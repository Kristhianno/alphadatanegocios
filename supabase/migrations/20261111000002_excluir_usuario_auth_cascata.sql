-- ============================================================================
-- Excluir um usuário em Supabase → Authentication passa a excluí-lo do
-- sistema também.
--
-- Por quê: o login do sistema usa a tabela própria `usuarios` (senha com
-- hash local); `auth.users` é só um espelho (Google / "esqueci minha
-- senha"), ligado por `usuarios.auth_user_id`. Apagar só em
-- Authentication deixava o usuário entrando normalmente.
--
-- Regras do gatilho (para cada `usuarios` ligado ao login apagado, por
-- auth_user_id OU pelo mesmo email):
--   * superadmin: nunca é apagado por aqui;
--   * o usuário é apagado;
--   * se era admin e a conta ficou SEM nenhum admin, a conta inteira é
--     apagada (clientes, agenda, contratos... via ON DELETE CASCADE) —
--     quem se cadastrar de novo com esse email começa do zero;
--   * se essa conta tem assinatura no Stripe, a exclusão é BLOQUEADA
--     (o Stripe continuaria cobrando): cancele a assinatura antes.
-- ============================================================================

create or replace function public.ao_excluir_usuario_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario record;
  v_assinatura text;
begin
  for v_usuario in
    select id, conta_id, papel
      from public.usuarios
     where auth_user_id = old.id
        or (old.email is not null and lower(email) = lower(old.email))
  loop
    continue when v_usuario.papel = 'superadmin';

    if v_usuario.papel = 'admin' and not exists (
      select 1 from public.usuarios
       where conta_id = v_usuario.conta_id and papel = 'admin' and id <> v_usuario.id
    ) then
      select stripe_subscription_id into v_assinatura from public.contas where id = v_usuario.conta_id;
      if v_assinatura is not null then
        raise exception 'A conta deste usuário tem assinatura no Stripe (%). Cancele a assinatura antes de excluir o usuário.', v_assinatura;
      end if;
      delete from public.contas where id = v_usuario.conta_id;  -- leva o usuário junto (cascade)
    else
      delete from public.usuarios where id = v_usuario.id;
    end if;
  end loop;

  return old;
end;
$$;

comment on function public.ao_excluir_usuario_auth() is
  'Gatilho de auth.users: excluir em Authentication exclui o usuário do sistema (e a conta, se era o último admin).';

drop trigger if exists trg_excluir_usuario_auth on auth.users;
create trigger trg_excluir_usuario_auth
  after delete on auth.users
  for each row execute function public.ao_excluir_usuario_auth();

-- ----------------------------------------------------------------------------
-- Limpeza única: usuários que já ficaram órfãos (tinham vínculo com um
-- login de Authentication que foi apagado ANTES deste gatilho existir).
-- Mesmas regras acima; contas com assinatura no Stripe não são tocadas.
-- ----------------------------------------------------------------------------
with orfaos as (
  select u.id, u.conta_id, u.papel
    from public.usuarios u
   where u.auth_user_id is not null
     and u.papel <> 'superadmin'
     and not exists (select 1 from auth.users a where a.id = u.auth_user_id)
),
contas_sem_admin as (
  select distinct o.conta_id
    from orfaos o
    join public.contas c on c.id = o.conta_id and c.stripe_subscription_id is null
   where o.papel = 'admin'
     and not exists (
       select 1 from public.usuarios u2
        where u2.conta_id = o.conta_id and u2.papel = 'admin'
          and u2.id not in (select id from orfaos)
     )
),
apaga_contas as (
  delete from public.contas where id in (select conta_id from contas_sem_admin) returning id
)
delete from public.usuarios
 where id in (select id from orfaos)
   and conta_id not in (select id from apaga_contas)
   and conta_id not in (select id from public.contas where stripe_subscription_id is not null);

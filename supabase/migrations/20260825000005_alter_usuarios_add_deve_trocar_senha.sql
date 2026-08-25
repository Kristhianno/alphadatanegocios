-- =====================================================================
-- Suporta senha temporária: um cliente convidado por link recebe uma
-- senha gerada pelo sistema e deve trocá-la no primeiro login. Sem essa
-- coluna não há como o frontend saber "isso ainda é a senha temporária,
-- force a troca" sem inferir por heurística.
-- =====================================================================

alter table usuarios add column deve_trocar_senha boolean not null default false;

comment on column usuarios.deve_trocar_senha is 'true quando a senha atual foi gerada pelo sistema (convite de cliente) e ainda não foi trocada pelo próprio usuário.';

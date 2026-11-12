-- ============================================================================
-- Portfólio da conta: Pacotes, Kits e Adicionais (substitui a tela antiga de
-- "Pacotes / Kits", que guardava tudo só no navegador). É daqui que a IA do
-- WhatsApp vai ler o que a empresa vende.
--
-- Fotos e PDFs NÃO ficam aqui: ficam em `arquivos` (Storage), ligados por
--   entidade_tipo = 'portfolio_item', entidade_id = portfolio_itens.id  (mídia do item)
--   entidade_tipo = 'portfolio_pacote' | 'portfolio_kit' | 'portfolio_adicional'
--                                            (materiais prontos de cada aba)
-- ============================================================================

create table portfolio_itens (
  id               uuid primary key default gen_random_uuid(),
  conta_id         uuid not null references contas(id) on delete cascade,
  tipo             text not null check (tipo in ('pacote', 'kit', 'adicional')),
  nome             text not null,
  descricao        text,
  preco            numeric(12, 2) check (preco is null or preco >= 0),
  capacidade       integer check (capacidade is null or capacidade >= 0),   -- convidados (pacotes)
  itens_inclusos   jsonb not null default '[]'::jsonb,                     -- ["Mesa decorada", "50 balões", ...]
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

comment on table portfolio_itens is 'Portfólio da conta (pacotes, kits e adicionais); fotos/PDFs em arquivos (entidade portfolio_item).';

create index idx_portfolio_itens_conta_tipo on portfolio_itens (conta_id, tipo, nome);

create trigger trg_portfolio_itens_atualizado_em
  before update on portfolio_itens
  for each row execute function set_atualizado_em();

grant all privileges on portfolio_itens to service_role;
revoke all on portfolio_itens from anon, authenticated;
alter table portfolio_itens enable row level security;

-- PDF do portfólio precisa de link público (a IA envia no WhatsApp).
-- Contratos/documentos continuam no bucket privado (regra no backend).
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                                  'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf']
 where id = 'publico';

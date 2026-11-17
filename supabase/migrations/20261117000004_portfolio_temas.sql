-- ============================================================================
-- Temas dos "materiais prontos" do Portfólio salvos assim que são criados
-- (antes só existiam quando recebiam o 1º arquivo — tema vazio sumia ao
-- recarregar a página). O vínculo com os arquivos continua pelo nome
-- (arquivos.tema), na mesma aba (tipo).
-- ============================================================================

create table if not exists portfolio_temas (
  id         uuid primary key default gen_random_uuid(),
  conta_id   uuid not null references contas(id) on delete cascade,
  tipo       text not null check (tipo in ('pacote', 'kit', 'adicional')),
  nome       text not null check (char_length(nome) between 1 and 80),
  criado_em  timestamptz not null default now()
);

create unique index if not exists uq_portfolio_temas_conta_tipo_nome on portfolio_temas (conta_id, tipo, lower(nome));

comment on table portfolio_temas is 'Temas criados nos materiais prontos do portfólio (agrupam arquivos por arquivos.tema).';

grant all privileges on portfolio_temas to service_role;
revoke all on portfolio_temas from anon, authenticated;
alter table portfolio_temas enable row level security;

-- =====================================================================
-- SERVICEHUB — SCHEMA FINANCEIRO (schema_financeiro.sql)
-- =====================================================================
-- Depende de: schema_shared.sql (contas)
--
-- `lancamentos_financeiros` é o módulo "Financeiro" genérico
-- (equipe interna apenas): receitas e despesas lançadas manualmente,
-- opcionalmente vinculadas a um registro de origem via
-- referencia_tipo/referencia_id (polimórfico, mesmo padrão de
-- `contratos`), mas também aceita lançamento avulso (ambos nulos).
-- =====================================================================

create table lancamentos_financeiros (
  id               uuid primary key default gen_random_uuid(),
  conta_id         uuid not null references contas(id) on delete cascade,
  tipo             text not null check (tipo in ('receita', 'despesa')),
  categoria        text,
  descricao        text not null,
  valor            numeric(12, 2) not null,
  referencia_tipo  text,
  referencia_id    uuid,
  status           text not null default 'pendente'
                     check (status in ('pendente', 'pago', 'cancelado')),
  data_prevista    date,
  data_pagamento   date,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create trigger trg_lancamentos_financeiros_atualizado_em
  before update on lancamentos_financeiros
  for each row execute function set_atualizado_em();

create index idx_lancamentos_financeiros_conta_id on lancamentos_financeiros (conta_id);
create index idx_lancamentos_financeiros_referencia on lancamentos_financeiros (referencia_tipo, referencia_id);

alter table lancamentos_financeiros enable row level security;

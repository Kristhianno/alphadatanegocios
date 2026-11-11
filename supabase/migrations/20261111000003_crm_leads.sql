-- ============================================================================
-- CRM de leads em kanban (plano Completo): cada conta acompanha seus
-- contatos pelas etapas Novo lead → Primeiro contato → Follow-up →
-- Concluído. Não confundir com `leads` (contatos da landing da própria
-- ALPHADATA, sem conta).
-- ============================================================================

create table crm_leads (
  id                 uuid primary key default gen_random_uuid(),
  conta_id           uuid not null references contas(id) on delete cascade,
  nome               text not null,
  telefone           text,
  email              text,
  tipo_evento        text,                                   -- ex: "Aniversário infantil", "Casamento"
  data_evento        date,
  convidados         integer check (convidados is null or convidados >= 0),
  valor_estimado     numeric(12, 2) check (valor_estimado is null or valor_estimado >= 0),
  origem             text not null default 'whatsapp'
                       check (origem in ('whatsapp', 'instagram', 'indicacao', 'site', 'telefone', 'outro')),
  etapa              text not null default 'novo'
                       check (etapa in ('novo', 'primeiro_contato', 'follow_up', 'concluido')),
  resultado          text check (resultado is null or resultado in ('ganho', 'perdido')),  -- só faz sentido em 'concluido'
  observacoes        text,
  posicao            double precision not null default 0,    -- ordem do card dentro da coluna
  ultimo_contato_em  timestamptz,                            -- base do alerta "parado há X dias" no follow-up
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

comment on table crm_leads is 'Leads do CRM em kanban de uma conta (plano Completo): Novo → Primeiro contato → Follow-up → Concluído.';

create index idx_crm_leads_conta_etapa on crm_leads (conta_id, etapa, posicao);

create trigger trg_crm_leads_atualizado_em
  before update on crm_leads
  for each row execute function set_atualizado_em();

-- Mesmo padrão das outras tabelas: só o backend (service_role) acessa;
-- RLS ligado sem política nega tudo à chave pública do navegador.
grant all privileges on crm_leads to service_role;
revoke all on crm_leads from anon, authenticated;
alter table crm_leads enable row level security;

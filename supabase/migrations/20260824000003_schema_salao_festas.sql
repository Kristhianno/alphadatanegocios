-- =====================================================================
-- SERVICEHUB — SCHEMA SALÃO DE FESTAS (schema_salao_festas.sql)
-- =====================================================================
-- Depende de: schema_shared.sql (contas, clientes, usuarios, agendamentos, contratos)
--
-- Nota de design: `contratos_evento` é uma tabela de extensão 1:1 do
-- `contratos` genérico (via contrato_id) — guarda só os campos que são
-- específicos de evento, evitando duplicar título/status/pdf que já
-- vivem em `contratos`.
-- =====================================================================

-- =====================================================================
-- pacotes_salao — com política de cancelamento
-- =====================================================================
create table pacotes_salao (
  id                              uuid primary key default gen_random_uuid(),
  conta_id                        uuid not null references contas(id) on delete cascade,
  nome                            text not null,
  descricao                       text,
  tipo_evento                     text not null
                                    check (tipo_evento in ('aniversario', 'casamento', 'corporativo', 'formatura', 'confraternizacao', 'outro')),
  capacidade_convidados           integer,
  preco_base                      numeric(12, 2) not null,
  itens_inclusos                  jsonb not null default '[]'::jsonb,   -- ["Decoração básica", "Som", "Buffet simples"]
  politica_cancelamento           text,                                  -- texto descritivo exibido ao cliente
  percentual_multa_cancelamento   numeric(5, 2) not null default 0,
  prazo_cancelamento_dias         integer not null default 0,           -- cancelamento sem multa até X dias antes do evento
  ativo                           boolean not null default true,
  criado_em                       timestamptz not null default now(),
  atualizado_em                   timestamptz not null default now()
);

create trigger trg_pacotes_salao_atualizado_em
  before update on pacotes_salao
  for each row execute function set_atualizado_em();

create index idx_pacotes_salao_conta_id on pacotes_salao (conta_id);

-- =====================================================================
-- eventos
-- =====================================================================
create table eventos (
  id                    uuid primary key default gen_random_uuid(),
  conta_id              uuid not null references contas(id) on delete cascade,
  cliente_id            uuid not null references clientes(id) on delete restrict,
  pacote_id             uuid references pacotes_salao(id) on delete set null,
  agendamento_id        uuid references agendamentos(id) on delete set null,
  nome_evento           text not null,
  tipo_evento           text not null
                          check (tipo_evento in ('aniversario', 'casamento', 'corporativo', 'formatura', 'confraternizacao', 'outro')),
  data_evento           timestamptz not null,
  numero_convidados     integer,
  status                text not null default 'orcamento'
                          check (status in ('orcamento', 'confirmado', 'em_andamento', 'finalizado', 'cancelado')),
  valor_total           numeric(12, 2) not null default 0,
  motivo_cancelamento   text,
  cancelado_em          timestamptz,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

create trigger trg_eventos_atualizado_em
  before update on eventos
  for each row execute function set_atualizado_em();

create index idx_eventos_conta_status on eventos (conta_id, status);
create index idx_eventos_data on eventos (conta_id, data_evento);
create index idx_eventos_cliente_id on eventos (cliente_id);

-- =====================================================================
-- equipes_evento — gestão de equipe por cargo, com confirmação
-- =====================================================================
create table equipes_evento (
  id                 uuid primary key default gen_random_uuid(),
  evento_id          uuid not null references eventos(id) on delete cascade,
  usuario_id         uuid references usuarios(id) on delete set null,   -- preenchido se for staff cadastrado no sistema
  nome               text not null,                                     -- nome do integrante (staff ou freelancer avulso)
  cargo              text not null,                                     -- 'garcom' | 'seguranca' | 'dj' | 'buffet' | 'decoracao' | 'coordenador' | ...
  quantidade         integer not null default 1,
  valor_pagamento    numeric(12, 2),
  confirmado         boolean not null default false,                   -- confirmação de presença, tipicamente 1 semana antes
  confirmado_em      timestamptz,
  criado_em          timestamptz not null default now()
);

create index idx_equipes_evento_evento_id on equipes_evento (evento_id);
create index idx_equipes_evento_cargo on equipes_evento (evento_id, cargo);

-- =====================================================================
-- equipamentos_evento — controle de retirada/devolução e condição
-- =====================================================================
create table equipamentos_evento (
  id                        uuid primary key default gen_random_uuid(),
  evento_id                 uuid not null references eventos(id) on delete cascade,
  nome_equipamento          text not null,
  quantidade                integer not null default 1,
  data_retirada             timestamptz,
  data_devolucao_prevista   timestamptz,
  data_devolucao_real       timestamptz,
  condicao_saida            text check (condicao_saida in ('novo', 'bom', 'regular', 'danificado')),
  condicao_retorno          text check (condicao_retorno in ('bom', 'regular', 'danificado', 'perdido')),
  observacoes               text,
  criado_em                 timestamptz not null default now()
);

create index idx_equipamentos_evento_evento_id on equipamentos_evento (evento_id);

-- =====================================================================
-- fotos_evento
-- =====================================================================
create table fotos_evento (
  id           uuid primary key default gen_random_uuid(),
  evento_id    uuid not null references eventos(id) on delete cascade,
  url          text not null,
  descricao    text,
  criado_em    timestamptz not null default now()
);

create index idx_fotos_evento_evento_id on fotos_evento (evento_id);

-- =====================================================================
-- contratos_evento — extensão 1:1 de `contratos`
-- =====================================================================
create table contratos_evento (
  id           uuid primary key default gen_random_uuid(),
  evento_id    uuid not null references eventos(id) on delete cascade,
  contrato_id  uuid references contratos(id) on delete set null,
  termos       text,        -- cláusulas específicas do evento (ex: política de cancelamento aplicada, itens inclusos)
  assinado_em  timestamptz,
  criado_em    timestamptz not null default now(),
  unique (evento_id, contrato_id)
);

create index idx_contratos_evento_evento_id on contratos_evento (evento_id);

-- =====================================================================
-- financeiro_evento — receitas/despesas para cálculo de lucro
-- =====================================================================
create table financeiro_evento (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references eventos(id) on delete cascade,
  tipo            text not null check (tipo in ('receita', 'despesa')),
  categoria       text,   -- 'sinal' | 'pagamento_final' | 'equipe' | 'equipamento' | 'buffet' | 'aluguel_espaco' | ...
  descricao       text,
  valor           numeric(12, 2) not null,
  data_prevista   date,
  data_pagamento  date,
  pago            boolean not null default false,
  criado_em       timestamptz not null default now()
);

comment on table financeiro_evento is
  'Lançamentos de receita/despesa por evento. calcularLucroEvento() soma receitas - despesas.';

create index idx_financeiro_evento_evento_id on financeiro_evento (evento_id);
create index idx_financeiro_evento_tipo on financeiro_evento (evento_id, tipo);

-- =====================================================================
-- Row Level Security (padrão: negar tudo a anon/authenticated)
-- =====================================================================
alter table pacotes_salao        enable row level security;
alter table eventos              enable row level security;
alter table equipes_evento       enable row level security;
alter table equipamentos_evento  enable row level security;
alter table fotos_evento         enable row level security;
alter table contratos_evento     enable row level security;
alter table financeiro_evento    enable row level security;

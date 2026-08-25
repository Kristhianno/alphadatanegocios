-- =====================================================================
-- SERVICEHUB — SCHEMA MANUTENÇÕES GERAIS (schema_manutencao.sql)
-- =====================================================================
-- Depende de: schema_shared.sql (contas, clientes, usuarios, contratos)
--
-- Nota de design: `materiais_utilizados` foi adicionada (além de
-- `materiais_manutencao`, o catálogo) para sustentar o requisito de
-- "rastreamento de materiais usados" por ordem — sem ela não daria
-- para saber quais materiais, em que quantidade e a que custo, foram
-- usados em cada ordem específica.
-- =====================================================================

-- =====================================================================
-- tipos_servico_manutencao — inclui a categoria de manutenção
-- =====================================================================
create table tipos_servico_manutencao (
  id                       uuid primary key default gen_random_uuid(),
  conta_id                 uuid not null references contas(id) on delete cascade,
  nome                     text not null,     -- 'Elétrica' | 'Hidráulica' | 'HVAC' | 'Estrutural' | ...
  categoria_manutencao     text not null check (categoria_manutencao in ('preventiva', 'corretiva', 'emergencia')),
  tempo_estimado_horas     numeric(6, 2),
  ativo                    boolean not null default true
);

create index idx_tipos_servico_manutencao_conta_id on tipos_servico_manutencao (conta_id);

-- =====================================================================
-- tecnicos — estende usuarios com dados profissionais
-- =====================================================================
create table tecnicos (
  id                              uuid primary key default gen_random_uuid(),
  usuario_id                      uuid not null unique references usuarios(id) on delete cascade,
  especialidades                  jsonb not null default '[]'::jsonb,   -- ids de tipos_servico_manutencao ou texto livre
  avaliacao_media                 numeric(3, 2) not null default 0,
  total_chamados_concluidos       integer not null default 0,
  disponivel                      boolean not null default true,
  criado_em                       timestamptz not null default now()
);

comment on table tecnicos is 'Dados profissionais de um usuário com papel = tecnico (ou gestor operacional).';

create index idx_tecnicos_usuario_id on tecnicos (usuario_id);

-- =====================================================================
-- servicos_manutencao — catálogo de serviços ofertados
-- =====================================================================
create table servicos_manutencao (
  id                uuid primary key default gen_random_uuid(),
  conta_id          uuid not null references contas(id) on delete cascade,
  tipo_servico_id   uuid references tipos_servico_manutencao(id) on delete set null,
  nome              text not null,
  descricao         text,
  preco_base        numeric(12, 2),
  ativo             boolean not null default true
);

create index idx_servicos_manutencao_conta_id on servicos_manutencao (conta_id);

-- =====================================================================
-- chamados_manutencao — com prioridade e tipo de manutenção
-- =====================================================================
create table chamados_manutencao (
  id                     uuid primary key default gen_random_uuid(),
  conta_id               uuid not null references contas(id) on delete cascade,
  cliente_id             uuid not null references clientes(id) on delete restrict,
  tipo_servico_id        uuid references tipos_servico_manutencao(id) on delete set null,
  categoria_manutencao   text not null check (categoria_manutencao in ('preventiva', 'corretiva', 'emergencia')),
  prioridade             text not null default 'normal'
                           check (prioridade in ('baixa', 'normal', 'alta', 'urgente')),
  descricao              text not null,
  endereco               text,
  status                 text not null default 'aberto'
                           check (status in ('aberto', 'orcamento_enviado', 'orcamento_aceito', 'agendado', 'em_execucao', 'concluido', 'cancelado')),
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);

create trigger trg_chamados_manutencao_atualizado_em
  before update on chamados_manutencao
  for each row execute function set_atualizado_em();

create index idx_chamados_manutencao_conta_status on chamados_manutencao (conta_id, status);
create index idx_chamados_manutencao_prioridade on chamados_manutencao (conta_id, prioridade);
create index idx_chamados_manutencao_cliente_id on chamados_manutencao (cliente_id);

-- =====================================================================
-- orcamentos — valor total calculado automaticamente
-- =====================================================================
create table orcamentos (
  id                        uuid primary key default gen_random_uuid(),
  chamado_id                uuid not null references chamados_manutencao(id) on delete cascade,
  itens                     jsonb not null default '[]'::jsonb,   -- [{ descricao, quantidade, valorUnitario }]
  valor_mao_obra            numeric(12, 2) not null default 0,
  valor_materiais           numeric(12, 2) not null default 0,
  valor_total               numeric(12, 2) generated always as (
                               coalesce(valor_mao_obra, 0) + coalesce(valor_materiais, 0)
                             ) stored,
  validade_dias             integer not null default 7,
  status                    text not null default 'pendente'
                              check (status in ('pendente', 'aceito', 'recusado', 'expirado')),
  gerado_automaticamente    boolean not null default true,
  respondido_em             timestamptz,
  criado_em                 timestamptz not null default now()
);

create index idx_orcamentos_chamado_id on orcamentos (chamado_id);
create index idx_orcamentos_status on orcamentos (status);

-- =====================================================================
-- ordens_manutencao — com cálculo automático de horas trabalhadas
-- =====================================================================
create table ordens_manutencao (
  id                   uuid primary key default gen_random_uuid(),
  conta_id             uuid not null references contas(id) on delete cascade,
  chamado_id           uuid not null references chamados_manutencao(id) on delete cascade,
  tecnico_id           uuid references tecnicos(id) on delete set null,
  data_agendada        timestamptz,
  hora_inicio          timestamptz,
  hora_fim             timestamptz,
  horas_trabalhadas    numeric(6, 2) generated always as (
                          case when hora_inicio is not null and hora_fim is not null
                            then round((extract(epoch from (hora_fim - hora_inicio)) / 3600.0)::numeric, 2)
                            else null
                          end
                        ) stored,
  status               text not null default 'agendada'
                         check (status in ('agendada', 'em_execucao', 'concluida', 'cancelada')),
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now(),
  constraint chk_ordens_manutencao_fim_apos_inicio
    check (hora_fim is null or hora_inicio is null or hora_fim >= hora_inicio)
);

create trigger trg_ordens_manutencao_atualizado_em
  before update on ordens_manutencao
  for each row execute function set_atualizado_em();

create index idx_ordens_manutencao_conta_status on ordens_manutencao (conta_id, status);
create index idx_ordens_manutencao_tecnico_id on ordens_manutencao (tecnico_id);
create index idx_ordens_manutencao_chamado_id on ordens_manutencao (chamado_id);

-- =====================================================================
-- materiais_manutencao — catálogo/estoque de materiais
-- =====================================================================
create table materiais_manutencao (
  id                uuid primary key default gen_random_uuid(),
  conta_id          uuid not null references contas(id) on delete cascade,
  nome              text not null,
  unidade_medida    text,
  custo_unitario    numeric(12, 4) not null default 0,
  estoque_atual     numeric(12, 3) not null default 0,
  ativo             boolean not null default true
);

create index idx_materiais_manutencao_conta_id on materiais_manutencao (conta_id);

-- =====================================================================
-- materiais_utilizados — rastreamento de materiais usados por ordem
-- =====================================================================
create table materiais_utilizados (
  id                          uuid primary key default gen_random_uuid(),
  ordem_id                    uuid not null references ordens_manutencao(id) on delete cascade,
  material_id                 uuid not null references materiais_manutencao(id) on delete restrict,
  quantidade                  numeric(12, 3) not null,
  custo_unitario_no_momento   numeric(12, 4) not null,   -- snapshot do custo no momento do uso (o catálogo pode mudar depois)
  custo_total                 numeric(12, 2) generated always as (
                                 round(quantidade * custo_unitario_no_momento, 2)
                               ) stored,
  criado_em                   timestamptz not null default now()
);

create index idx_materiais_utilizados_ordem_id on materiais_utilizados (ordem_id);

-- =====================================================================
-- laudos_tecnicos
-- =====================================================================
create table laudos_tecnicos (
  id                     uuid primary key default gen_random_uuid(),
  ordem_id               uuid not null references ordens_manutencao(id) on delete cascade,
  tecnico_id             uuid references tecnicos(id) on delete set null,
  diagnostico            text not null,
  servicos_realizados    text,
  recomendacoes          text,
  fotos                  jsonb not null default '[]'::jsonb,
  assinatura_tecnico     text,
  assinatura_cliente     text,
  arquivo_pdf_url        text,
  criado_em              timestamptz not null default now()
);

create index idx_laudos_tecnicos_ordem_id on laudos_tecnicos (ordem_id);

-- =====================================================================
-- inspeccoes
-- =====================================================================
create table inspeccoes (
  id                 uuid primary key default gen_random_uuid(),
  conta_id           uuid not null references contas(id) on delete cascade,
  cliente_id         uuid not null references clientes(id) on delete restrict,
  tipo_servico_id    uuid references tipos_servico_manutencao(id) on delete set null,
  data_inspecao      timestamptz not null,
  tecnico_id         uuid references tecnicos(id) on delete set null,
  checklist          jsonb not null default '[]'::jsonb,
  resultado          text check (resultado in ('aprovado', 'requer_atencao', 'critico')),
  observacoes        text,
  criado_em          timestamptz not null default now()
);

create index idx_inspeccoes_conta_id on inspeccoes (conta_id);
create index idx_inspeccoes_cliente_id on inspeccoes (cliente_id);

-- =====================================================================
-- manutencoes_preventivas — agenda recorrente por cliente
-- =====================================================================
create table manutencoes_preventivas (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references contas(id) on delete cascade,
  cliente_id          uuid not null references clientes(id) on delete cascade,
  tipo_servico_id     uuid references tipos_servico_manutencao(id) on delete set null,
  frequencia          text not null check (frequencia in ('semanal', 'mensal', 'trimestral', 'semestral', 'anual')),
  proxima_execucao    date not null,
  ultima_execucao     date,
  ativo               boolean not null default true,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create trigger trg_manutencoes_preventivas_atualizado_em
  before update on manutencoes_preventivas
  for each row execute function set_atualizado_em();

create index idx_manutencoes_preventivas_proxima on manutencoes_preventivas (conta_id, proxima_execucao) where ativo;

-- =====================================================================
-- contratos_manutencao — extensão 1:1 de `contratos`, com SLA
-- =====================================================================
create table contratos_manutencao (
  id                       uuid primary key default gen_random_uuid(),
  cliente_id               uuid not null references clientes(id) on delete cascade,
  contrato_id              uuid references contratos(id) on delete set null,
  escopo                   text,
  sla_horas_resposta       integer,   -- tempo garantido de resposta a um chamado, em horas
  vigencia_inicio          date,
  vigencia_fim             date,
  criado_em                timestamptz not null default now()
);

create index idx_contratos_manutencao_cliente_id on contratos_manutencao (cliente_id);

-- =====================================================================
-- Row Level Security (padrão: negar tudo a anon/authenticated)
-- =====================================================================
alter table tipos_servico_manutencao  enable row level security;
alter table tecnicos                  enable row level security;
alter table servicos_manutencao       enable row level security;
alter table chamados_manutencao       enable row level security;
alter table orcamentos                enable row level security;
alter table ordens_manutencao         enable row level security;
alter table materiais_manutencao      enable row level security;
alter table materiais_utilizados      enable row level security;
alter table laudos_tecnicos           enable row level security;
alter table inspeccoes                enable row level security;
alter table manutencoes_preventivas   enable row level security;
alter table contratos_manutencao      enable row level security;

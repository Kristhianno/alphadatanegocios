-- =====================================================================
-- SERVICEHUB — SCHEMA CONFEITARIA E SALGADOS (schema_confeitaria.sql)
-- =====================================================================
-- Depende de: schema_shared.sql (contas, clientes, usuarios, agendamentos)
--
-- Nota de design: além das tabelas pedidas, foi adicionada
-- `receita_ingredientes` (junção receita↔ingrediente) — é o que
-- permite calcular o custo de produção de uma receita a partir do
-- estoque, exigido pelos requisitos desta tarefa.
-- =====================================================================

-- =====================================================================
-- fornecedores
-- =====================================================================
create table fornecedores (
  id          uuid primary key default gen_random_uuid(),
  conta_id    uuid not null references contas(id) on delete cascade,
  nome        text not null,
  telefone    text,
  email       text,
  documento   text,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create index idx_fornecedores_conta_id on fornecedores (conta_id);

-- =====================================================================
-- ingredientes_estoque — com controle de validade e ponto de reposição
-- =====================================================================
create table ingredientes_estoque (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references contas(id) on delete cascade,
  nome                text not null,
  unidade_medida      text not null,                          -- 'g' | 'kg' | 'ml' | 'l' | 'unidade'
  quantidade_atual    numeric(12, 3) not null default 0,
  quantidade_minima   numeric(12, 3) not null default 0,       -- ponto de reposição / alerta de estoque baixo
  custo_unitario      numeric(12, 4) not null default 0,
  fornecedor_id       uuid references fornecedores(id) on delete set null,
  data_validade       date,                                    -- controle de validade do lote atual
  lote                text,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

comment on column ingredientes_estoque.quantidade_minima is
  'Abaixo deste valor o ingrediente entra em alerta de reposição.';

create trigger trg_ingredientes_estoque_atualizado_em
  before update on ingredientes_estoque
  for each row execute function set_atualizado_em();

create index idx_ingredientes_estoque_conta_id on ingredientes_estoque (conta_id);
create index idx_ingredientes_estoque_validade on ingredientes_estoque (conta_id, data_validade);

-- =====================================================================
-- receitas
-- =====================================================================
create table receitas (
  id                      uuid primary key default gen_random_uuid(),
  conta_id                uuid not null references contas(id) on delete cascade,
  nome                    text not null,
  categoria               text,                    -- 'bolo' | 'salgado' | 'doce' | 'torta'
  rendimento_quantidade   numeric(12, 2),           -- quantas unidades a receita rende
  rendimento_unidade      text,
  tempo_preparo_minutos   integer,
  modo_preparo            text,
  ativo                   boolean not null default true,
  criado_em               timestamptz not null default now(),
  atualizado_em           timestamptz not null default now()
);

create trigger trg_receitas_atualizado_em
  before update on receitas
  for each row execute function set_atualizado_em();

create index idx_receitas_conta_id on receitas (conta_id);

-- =====================================================================
-- receita_ingredientes — junção que sustenta o cálculo de custo
-- =====================================================================
create table receita_ingredientes (
  id                     uuid primary key default gen_random_uuid(),
  receita_id             uuid not null references receitas(id) on delete cascade,
  ingrediente_id         uuid not null references ingredientes_estoque(id) on delete restrict,
  quantidade_necessaria  numeric(12, 3) not null,
  unique (receita_id, ingrediente_id)
);

comment on table receita_ingredientes is
  'Composição de uma receita. custo_producao_estimado em catalogo_produtos é '
  'derivado somando quantidade_necessaria * ingredientes_estoque.custo_unitario.';

create index idx_receita_ingredientes_receita_id on receita_ingredientes (receita_id);

-- =====================================================================
-- catalogo_produtos — com margem de lucro calculada automaticamente
-- =====================================================================
create table catalogo_produtos (
  id                          uuid primary key default gen_random_uuid(),
  conta_id                    uuid not null references contas(id) on delete cascade,
  receita_id                  uuid references receitas(id) on delete set null,
  nome                        text not null,
  descricao                   text,
  categoria                   text,
  preco_venda                 numeric(12, 2) not null,
  custo_producao_estimado     numeric(12, 2) not null default 0,
  margem_lucro_percentual     numeric(6, 2) generated always as (
                                 case when preco_venda > 0
                                   then round(((preco_venda - custo_producao_estimado) / preco_venda) * 100, 2)
                                   else 0
                                 end
                               ) stored,
  ativo                       boolean not null default true,
  criado_em                   timestamptz not null default now(),
  atualizado_em               timestamptz not null default now()
);

comment on column catalogo_produtos.margem_lucro_percentual is
  'Calculada automaticamente pelo Postgres (generated column) a partir de preco_venda e custo_producao_estimado.';

create trigger trg_catalogo_produtos_atualizado_em
  before update on catalogo_produtos
  for each row execute function set_atualizado_em();

create index idx_catalogo_produtos_conta_id on catalogo_produtos (conta_id);
create index idx_catalogo_produtos_ativo on catalogo_produtos (conta_id, ativo);

-- =====================================================================
-- opcoes_customizacao
-- =====================================================================
create table opcoes_customizacao (
  id               uuid primary key default gen_random_uuid(),
  produto_id       uuid not null references catalogo_produtos(id) on delete cascade,
  tipo             text not null,   -- 'sabor' | 'recheio' | 'tamanho' | 'cobertura'
  nome             text not null,
  preco_adicional  numeric(12, 2) not null default 0,
  ativo            boolean not null default true
);

create index idx_opcoes_customizacao_produto_id on opcoes_customizacao (produto_id);

-- =====================================================================
-- fotos_produtos
-- =====================================================================
create table fotos_produtos (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references catalogo_produtos(id) on delete cascade,
  url         text not null,
  principal   boolean not null default false,
  ordem       integer not null default 0,
  criado_em   timestamptz not null default now()
);

create index idx_fotos_produtos_produto_id on fotos_produtos (produto_id);

-- =====================================================================
-- pedidos_confeitaria
-- =====================================================================
create table pedidos_confeitaria (
  id                uuid primary key default gen_random_uuid(),
  conta_id          uuid not null references contas(id) on delete cascade,
  cliente_id        uuid not null references clientes(id) on delete restrict,
  agendamento_id    uuid references agendamentos(id) on delete set null,   -- data/hora de entrega, se agendada
  numero            text not null,
  status            text not null default 'novo'
                      check (status in ('novo', 'confirmado', 'em_producao', 'pronto', 'entregue', 'cancelado')),
  data_entrega      timestamptz,
  endereco_entrega  text,
  valor_total       numeric(12, 2) not null default 0,
  observacoes       text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  unique (conta_id, numero)
);

create trigger trg_pedidos_confeitaria_atualizado_em
  before update on pedidos_confeitaria
  for each row execute function set_atualizado_em();

create index idx_pedidos_confeitaria_conta_status on pedidos_confeitaria (conta_id, status);
create index idx_pedidos_confeitaria_entrega on pedidos_confeitaria (conta_id, data_entrega);

-- =====================================================================
-- itens_pedido
-- =====================================================================
create table itens_pedido (
  id                    uuid primary key default gen_random_uuid(),
  pedido_id             uuid not null references pedidos_confeitaria(id) on delete cascade,
  produto_id            uuid not null references catalogo_produtos(id) on delete restrict,
  opcoes_selecionadas   jsonb not null default '[]'::jsonb,   -- [{ opcaoId, tipo, nome, precoAdicional }]
  quantidade            integer not null check (quantidade > 0),
  preco_unitario        numeric(12, 2) not null,
  subtotal              numeric(12, 2) generated always as (quantidade * preco_unitario) stored,
  observacoes           text
);

create index idx_itens_pedido_pedido_id on itens_pedido (pedido_id);

-- =====================================================================
-- ordens_producao — com checklist de etapas
-- =====================================================================
create table ordens_producao (
  id                     uuid primary key default gen_random_uuid(),
  conta_id               uuid not null references contas(id) on delete cascade,
  pedido_id              uuid not null references pedidos_confeitaria(id) on delete cascade,
  responsavel_id         uuid references usuarios(id) on delete set null,
  status                 text not null default 'aguardando'
                           check (status in ('aguardando', 'em_producao', 'finalizada', 'cancelada')),
  checklist_etapas       jsonb not null default '[]'::jsonb,   -- [{ etapa, concluida, concluida_em }]
  custo_producao_real    numeric(12, 2),
  iniciada_em            timestamptz,
  finalizada_em          timestamptz,
  criado_em              timestamptz not null default now()
);

comment on column ordens_producao.checklist_etapas is 'Etapas de produção como checklist, ex: [{"etapa":"Massa pronta","concluida":true}]';

create index idx_ordens_producao_conta_id on ordens_producao (conta_id);
create index idx_ordens_producao_pedido_id on ordens_producao (pedido_id);

-- =====================================================================
-- movimentacoes_estoque — entrada/saída/ajuste/perda de ingredientes
-- =====================================================================
create table movimentacoes_estoque (
  id                      uuid primary key default gen_random_uuid(),
  conta_id                uuid not null references contas(id) on delete cascade,
  ingrediente_id          uuid not null references ingredientes_estoque(id) on delete cascade,
  tipo                    text not null check (tipo in ('entrada', 'saida', 'ajuste', 'perda')),
  quantidade              numeric(12, 3) not null,
  quantidade_resultante   numeric(12, 3) not null,   -- saldo do ingrediente logo após este movimento (auditoria)
  motivo                  text,
  ordem_producao_id       uuid references ordens_producao(id) on delete set null,
  criado_por              uuid references usuarios(id) on delete set null,
  criado_em               timestamptz not null default now()
);

create index idx_movimentacoes_estoque_ingrediente on movimentacoes_estoque (ingrediente_id, criado_em desc);
create index idx_movimentacoes_estoque_ordem_producao on movimentacoes_estoque (ordem_producao_id);

-- =====================================================================
-- Row Level Security (padrão: negar tudo a anon/authenticated)
-- =====================================================================
alter table fornecedores           enable row level security;
alter table ingredientes_estoque   enable row level security;
alter table receitas               enable row level security;
alter table receita_ingredientes   enable row level security;
alter table catalogo_produtos      enable row level security;
alter table opcoes_customizacao    enable row level security;
alter table fotos_produtos         enable row level security;
alter table pedidos_confeitaria    enable row level security;
alter table itens_pedido           enable row level security;
alter table ordens_producao        enable row level security;
alter table movimentacoes_estoque  enable row level security;

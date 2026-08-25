-- =====================================================================
-- SERVICEHUB — SCHEMA FOTOGRAFIA E VÍDEO (schema_fotografia.sql)
-- =====================================================================
-- Depende de: schema_shared.sql (contas, clientes, usuarios, agendamentos, contratos)
-- =====================================================================

-- =====================================================================
-- pacotes_fotografia
-- =====================================================================
create table pacotes_fotografia (
  id                          uuid primary key default gen_random_uuid(),
  conta_id                    uuid not null references contas(id) on delete cascade,
  nome                        text not null,
  descricao                   text,
  tipo_sessao                 text not null
                                check (tipo_sessao in ('ensaio', 'casamento', 'evento', 'produto', 'institucional', 'outro')),
  quantidade_fotos_inclusas   integer,
  horas_inclusas              numeric(5, 2),
  preco_base                  numeric(12, 2) not null,
  ativo                       boolean not null default true,
  criado_em                   timestamptz not null default now(),
  atualizado_em               timestamptz not null default now()
);

create trigger trg_pacotes_fotografia_atualizado_em
  before update on pacotes_fotografia
  for each row execute function set_atualizado_em();

create index idx_pacotes_fotografia_conta_id on pacotes_fotografia (conta_id);

-- =====================================================================
-- sessoes_foto — status de edição com percentual de progresso
-- =====================================================================
create table sessoes_foto (
  id                              uuid primary key default gen_random_uuid(),
  conta_id                        uuid not null references contas(id) on delete cascade,
  cliente_id                      uuid not null references clientes(id) on delete restrict,
  pacote_id                       uuid references pacotes_fotografia(id) on delete set null,
  agendamento_id                  uuid references agendamentos(id) on delete set null,
  fotografo_id                    uuid references usuarios(id) on delete set null,
  tipo_sessao                     text not null,
  data_sessao                     timestamptz not null,
  local                           text,
  status                          text not null default 'agendada'
                                    check (status in ('agendada', 'realizada', 'em_edicao', 'entregue', 'cancelada')),
  percentual_edicao_concluida     smallint not null default 0
                                    check (percentual_edicao_concluida between 0 and 100),
  valor_total                     numeric(12, 2),
  criado_em                       timestamptz not null default now(),
  atualizado_em                   timestamptz not null default now()
);

create trigger trg_sessoes_foto_atualizado_em
  before update on sessoes_foto
  for each row execute function set_atualizado_em();

create index idx_sessoes_foto_conta_status on sessoes_foto (conta_id, status);
create index idx_sessoes_foto_data on sessoes_foto (conta_id, data_sessao);
create index idx_sessoes_foto_cliente_id on sessoes_foto (cliente_id);

-- =====================================================================
-- fotos_sessao — originais vs editadas, com seleção do cliente
-- =====================================================================
create table fotos_sessao (
  id                     uuid primary key default gen_random_uuid(),
  sessao_id              uuid not null references sessoes_foto(id) on delete cascade,
  tipo                   text not null check (tipo in ('original', 'editada')),
  foto_original_id       uuid references fotos_sessao(id) on delete set null,   -- se tipo='editada', aponta para a original
  url                    text not null,
  selecionada_cliente    boolean not null default false,                        -- cliente marcou como favorita/selecionada
  ordem                  integer not null default 0,
  criado_em              timestamptz not null default now(),
  constraint chk_fotos_sessao_original_ref
    check (tipo = 'editada' or foto_original_id is null)
);

comment on column fotos_sessao.foto_original_id is
  'Aponta para a foto original correspondente quando tipo = editada; nulo para originais.';

create index idx_fotos_sessao_sessao_id on fotos_sessao (sessao_id);
create index idx_fotos_sessao_original_id on fotos_sessao (foto_original_id);

-- =====================================================================
-- edicoes_foto — cada linha é um evento na timeline de edição
-- =====================================================================
create table edicoes_foto (
  id                    uuid primary key default gen_random_uuid(),
  foto_id               uuid not null references fotos_sessao(id) on delete cascade,
  editor_id             uuid references usuarios(id) on delete set null,
  status                text not null default 'pendente'
                          check (status in ('pendente', 'em_andamento', 'revisao', 'concluida')),
  descricao_alteracao   text,
  iniciada_em           timestamptz,
  concluida_em          timestamptz,
  criado_em             timestamptz not null default now()
);

comment on table edicoes_foto is
  'Timeline de edição: cada linha é um evento de status para uma foto (histórico completo, não só o estado atual).';

create index idx_edicoes_foto_foto_id on edicoes_foto (foto_id, criado_em desc);

-- =====================================================================
-- portfolio_fotografo — com controle de direitos autorais
-- =====================================================================
create table portfolio_fotografo (
  id                        uuid primary key default gen_random_uuid(),
  conta_id                  uuid not null references contas(id) on delete cascade,
  fotografo_id              uuid references usuarios(id) on delete set null,
  sessao_id                 uuid references sessoes_foto(id) on delete set null,
  foto_id                   uuid references fotos_sessao(id) on delete set null,
  titulo                    text,
  categoria                 text,
  permissao_cliente         boolean not null default false,   -- autorização do cliente para uso público da imagem
  permissao_concedida_em    timestamptz,
  direitos_autorais         text not null default 'fotografo'
                              check (direitos_autorais in ('fotografo', 'cliente', 'compartilhado')),
  publico                   boolean not null default false,
  criado_em                 timestamptz not null default now(),
  constraint chk_portfolio_publico_requer_permissao
    check (not publico or permissao_cliente)
);

comment on column portfolio_fotografo.direitos_autorais is
  'Titularidade dos direitos autorais da imagem — controla quem pode reutilizá-la comercialmente.';

create index idx_portfolio_fotografo_conta_id on portfolio_fotografo (conta_id);
create index idx_portfolio_fotografo_publico on portfolio_fotografo (conta_id, publico);

-- =====================================================================
-- galeria_cliente — link privado com expiração
-- =====================================================================
create table galeria_cliente (
  id                  uuid primary key default gen_random_uuid(),
  sessao_id           uuid not null references sessoes_foto(id) on delete cascade,
  token_acesso        text not null unique,     -- token opaco usado no link público (ex: /galeria/{token_acesso})
  senha_hash          text,                      -- opcional: galeria protegida por senha adicional
  expira_em           timestamptz not null,
  visualizacoes       integer not null default 0,
  permite_download    boolean not null default true,
  criado_em           timestamptz not null default now()
);

comment on table galeria_cliente is 'Galeria privada e temporária entregue ao cliente; expira_em controla a validade do link.';

create index idx_galeria_cliente_sessao_id on galeria_cliente (sessao_id);
create index idx_galeria_cliente_token on galeria_cliente (token_acesso);

-- =====================================================================
-- producoes_video
-- =====================================================================
create table producoes_video (
  id                          uuid primary key default gen_random_uuid(),
  conta_id                    uuid not null references contas(id) on delete cascade,
  cliente_id                  uuid not null references clientes(id) on delete restrict,
  sessao_id                   uuid references sessoes_foto(id) on delete set null,
  titulo                      text not null,
  status                      text not null default 'captacao'
                                check (status in ('captacao', 'edicao', 'revisao', 'finalizado', 'entregue')),
  duracao_estimada_segundos   integer,
  editor_id                   uuid references usuarios(id) on delete set null,
  url_entrega                 text,
  criado_em                   timestamptz not null default now(),
  atualizado_em                timestamptz not null default now()
);

create trigger trg_producoes_video_atualizado_em
  before update on producoes_video
  for each row execute function set_atualizado_em();

create index idx_producoes_video_conta_status on producoes_video (conta_id, status);

-- =====================================================================
-- frames_video — thumbnails/marcações em pontos do vídeo
-- =====================================================================
create table frames_video (
  id                     uuid primary key default gen_random_uuid(),
  producao_id            uuid not null references producoes_video(id) on delete cascade,
  url_thumbnail          text not null,
  timestamp_segundos     numeric(10, 2) not null,   -- posição do frame dentro do vídeo
  descricao              text,
  criado_em              timestamptz not null default now()
);

create index idx_frames_video_producao_id on frames_video (producao_id);

-- =====================================================================
-- contratos_sessao — extensão 1:1 de `contratos`, com termos de direitos autorais
-- =====================================================================
create table contratos_sessao (
  id                          uuid primary key default gen_random_uuid(),
  sessao_id                   uuid not null references sessoes_foto(id) on delete cascade,
  contrato_id                 uuid references contratos(id) on delete set null,
  termos_direitos_autorais    text,
  assinado_em                 timestamptz,
  criado_em                   timestamptz not null default now(),
  unique (sessao_id, contrato_id)
);

create index idx_contratos_sessao_sessao_id on contratos_sessao (sessao_id);

-- =====================================================================
-- Row Level Security (padrão: negar tudo a anon/authenticated)
-- Exceção intencional: galeria_cliente é acessada por um link público
-- (token_acesso), então sua política de leitura pública controlada por
-- token será definida junto ao middleware de auth (Tarefa 5), e não
-- herda o "deny all" — por ora RLS está ativo e sem policy = fechado
-- até essa policy específica ser adicionada.
-- =====================================================================
alter table pacotes_fotografia    enable row level security;
alter table sessoes_foto          enable row level security;
alter table fotos_sessao          enable row level security;
alter table edicoes_foto          enable row level security;
alter table portfolio_fotografo   enable row level security;
alter table galeria_cliente       enable row level security;
alter table producoes_video       enable row level security;
alter table frames_video          enable row level security;
alter table contratos_sessao      enable row level security;

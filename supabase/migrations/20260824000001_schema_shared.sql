-- =====================================================================
-- SERVICEHUB — SCHEMA COMPARTILHADO (schema_shared.sql)
-- =====================================================================
-- Tabelas usadas por TODOS os tipos de negócio (confeitaria, salão de
-- festas, fotografia/vídeo, manutenção, e futuros tipos).
--
-- Modelo multi-tenant: cada empresa que assina o SaaS é uma "conta"
-- (tabela `contas`). Dentro de uma conta existem `usuarios` com um
-- `papel` (admin | gestor | tecnico | cliente) — mantendo o modelo de
-- login já usado no ALPHADATA (admin / técnico-ou-gestor / cliente).
--
-- Nota de design: a tarefa original pedia uma única tabela `usuarios`
-- com campos de empresa (nomeEmpresa/tipoNegocio/plano). Esses dados
-- são por-conta, não por-login, então foram separados em `contas`
-- (o tenant) + `usuarios` (os logins daquela conta). Isso evita
-- duplicar nomeEmpresa/plano em cada usuário e é o que permite o
-- login de admin/gestor/tecnico/cliente dentro da mesma empresa.
-- =====================================================================

-- pgcrypto fornece gen_random_uuid(), usado como default de todas as PKs.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Função utilitária: atualiza automaticamente o campo atualizado_em
-- em qualquer tabela que tenha uma trigger BEFORE UPDATE apontando
-- para ela. Reaproveitada em todos os schemas (shared + verticais).
-- ---------------------------------------------------------------------
create or replace function set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

comment on function set_atualizado_em() is
  'Trigger genérica que mantém atualizado_em sincronizado a cada UPDATE.';

-- =====================================================================
-- tipos_negocio — catálogo dos verticais suportados pelo SaaS
-- =====================================================================
create table tipos_negocio (
  codigo       text primary key,              -- slug estável: 'confeitaria', 'salao_festas', 'fotografia_video', 'manutencao', 'outro'
  nome         text not null,                  -- nome amigável exibido na UI: "Confeitaria e Salgados"
  icone        text,                           -- emoji ou nome do ícone (Tabler/emoji) usado no seletor de negócio
  descricao    text,
  ativo        boolean not null default true,  -- permite desativar um vertical sem apagar histórico
  criado_em    timestamptz not null default now()
);

comment on table tipos_negocio is 'Catálogo dos tipos de negócio suportados pelo ServiceHub.';
comment on column tipos_negocio.codigo is 'Identificador estável usado como FK em todas as tabelas com tipo_negocio.';

insert into tipos_negocio (codigo, nome, icone, descricao) values
  ('confeitaria',       'Confeitaria e Salgados',   '🎂', 'Catálogo, receitas, pedidos, produção e estoque de ingredientes.'),
  ('salao_festas',      'Salão de Festas',          '🎉', 'Eventos, pacotes, equipes, equipamentos e fotos de festas.'),
  ('fotografia_video',  'Fotografia e Vídeo',       '📷', 'Sessões, portfólio, galeria privada, edições de foto e vídeo.'),
  ('manutencao',        'Manutenções Gerais',       '🔧', 'Chamados, orçamentos, ordens de serviço, técnicos e materiais.'),
  ('outro',             'Outro tipo de negócio',    '🧩', 'Vertical genérico para negócios que não se encaixam nos anteriores.');

-- =====================================================================
-- contas — o tenant: uma empresa assinante do SaaS
-- =====================================================================
create table contas (
  id                    uuid primary key default gen_random_uuid(),
  nome_empresa          text not null,                                   -- razão social / nome fantasia da empresa cliente do SaaS
  tipo_negocio          text not null references tipos_negocio(codigo),  -- define quais módulos/tabelas específicas a conta usa
  plano                 text not null default 'startup'
                          check (plano in ('startup', 'profissional', 'enterprise')),
  status                text not null default 'ativo'
                          check (status in ('ativo', 'cancelado', 'suspenso')),
  configuracoes_gerais  jsonb not null default '{}'::jsonb,               -- preferências livres (tema, notificações, integrações)
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

comment on table contas is 'Tenant do SaaS: uma empresa assinante e seu tipo de negócio/plano.';
comment on column contas.configuracoes_gerais is 'JSON livre para configurações que não justificam coluna própria.';

create trigger trg_contas_atualizado_em
  before update on contas
  for each row execute function set_atualizado_em();

-- =====================================================================
-- clientes — os clientes finais atendidos por uma conta
-- =====================================================================
create table clientes (
  id             uuid primary key default gen_random_uuid(),
  conta_id       uuid not null references contas(id) on delete cascade,
  nome           text not null,
  email          text,
  telefone       text,
  documento      text,                              -- CPF ou CNPJ
  endereco       text,
  cidade         text,
  estado         text,
  ativo          boolean not null default true,
  metadados      jsonb not null default '{}'::jsonb, -- dados específicos do vertical (ex: preferências alimentares, endereços salvos)
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (conta_id, email)
);

comment on table clientes is 'Clientes finais de uma conta (não confundir com a conta/tenant em si).';

create trigger trg_clientes_atualizado_em
  before update on clientes
  for each row execute function set_atualizado_em();

-- =====================================================================
-- usuarios — logins da conta: admin, gestor/técnico ou cliente
-- =====================================================================
create table usuarios (
  id               uuid primary key default gen_random_uuid(),
  conta_id         uuid not null references contas(id) on delete cascade,
  auth_user_id     uuid unique,                       -- opcional: vínculo com auth.users caso Supabase Auth seja adotado no futuro
  email            text not null unique,
  senha_hash       text,                              -- hash bcrypt/argon2; nulo se autenticação delegada ao Supabase Auth
  nome             text not null,
  papel            text not null
                     check (papel in ('admin', 'gestor', 'tecnico', 'cliente')),
  cliente_id       uuid references clientes(id) on delete set null,  -- preenchido apenas quando papel = 'cliente'
  status           text not null default 'ativo'
                     check (status in ('ativo', 'inativo', 'suspenso')),
  ultimo_login_em  timestamptz,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  constraint chk_usuarios_cliente_id_papel
    check (papel <> 'cliente' or cliente_id is not null)
);

comment on table usuarios is
  'Logins de uma conta. papel define a experiência: admin (gestão completa), '
  'gestor/tecnico (operacional — o rótulo exibido varia por tipo_negocio) e cliente (portal do cliente).';
comment on column usuarios.papel is
  'admin | gestor | tecnico | cliente — gestor e tecnico ocupam o mesmo "slot" operacional; '
  'o rótulo exibido na UI vem de TipoNegocioConfig, não do banco.';

create trigger trg_usuarios_atualizado_em
  before update on usuarios
  for each row execute function set_atualizado_em();

-- =====================================================================
-- servicos — catálogo genérico de serviços/produtos vendáveis
-- =====================================================================
create table servicos (
  id                         uuid primary key default gen_random_uuid(),
  conta_id                   uuid not null references contas(id) on delete cascade,
  tipo_negocio               text not null references tipos_negocio(codigo),
  nome                       text not null,
  descricao                  text,
  preco_base                 numeric(12, 2),
  duracao_estimada_minutos   integer,
  ativo                      boolean not null default true,
  metadados                  jsonb not null default '{}'::jsonb,  -- campos específicos por vertical (sabor, tamanho, tipo_evento, etc.)
  criado_em                  timestamptz not null default now(),
  atualizado_em              timestamptz not null default now()
);

comment on table servicos is
  'Serviço/produto vendável genérico. Verticais podem manter tabelas próprias '
  '(ex: catalogo_produtos) e opcionalmente espelhar aqui para relatórios cruzados.';
comment on column servicos.metadados is 'JSON com os campos definidos em TipoNegocioConfig.metadadosServico.';

create trigger trg_servicos_atualizado_em
  before update on servicos
  for each row execute function set_atualizado_em();

-- =====================================================================
-- agendamentos — genérico, usado por todos os verticais
-- =====================================================================
create table agendamentos (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references contas(id) on delete cascade,
  tipo_negocio        text not null references tipos_negocio(codigo),
  cliente_id          uuid not null references clientes(id) on delete restrict,
  servico_id          uuid references servicos(id) on delete set null,
  responsavel_id      uuid references usuarios(id) on delete set null,   -- técnico/gestor/fotógrafo atribuído
  data_hora_inicio    timestamptz not null,
  data_hora_fim       timestamptz,
  status              text not null default 'agendado'
                        check (status in ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado')),
  endereco            text,
  valor_estimado      numeric(12, 2),
  observacoes         text,
  motivo_cancelamento text,
  metadados           jsonb not null default '{}'::jsonb,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  constraint chk_agendamentos_fim_apos_inicio
    check (data_hora_fim is null or data_hora_fim >= data_hora_inicio)
);

comment on table agendamentos is 'Agenda genérica: horário reservado para um cliente, independente do vertical.';

create trigger trg_agendamentos_atualizado_em
  before update on agendamentos
  for each row execute function set_atualizado_em();

-- =====================================================================
-- ordens_servico — execução genérica (pode nascer de um agendamento)
-- =====================================================================
create table ordens_servico (
  id                uuid primary key default gen_random_uuid(),
  conta_id          uuid not null references contas(id) on delete cascade,
  tipo_negocio      text not null references tipos_negocio(codigo),
  agendamento_id    uuid references agendamentos(id) on delete set null,
  cliente_id        uuid not null references clientes(id) on delete restrict,
  responsavel_id    uuid references usuarios(id) on delete set null,
  numero            text not null,                       -- identificador legível por conta, ex: OS-0001
  status            text not null default 'aberta'
                      check (status in ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  valor_total       numeric(12, 2),
  checklist         jsonb not null default '[]'::jsonb,   -- [{ id, label, concluido, observacao }]
  fotos             jsonb not null default '{}'::jsonb,   -- { antes: [], durante: [], depois: [] }
  assinatura_cliente text,                                -- data URL ou referência ao Storage
  metadados         jsonb not null default '{}'::jsonb,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  concluida_em      timestamptz,
  unique (conta_id, numero)
);

comment on table ordens_servico is
  'Execução genérica de um serviço. Equivale à "ordem de serviço" do ALPHADATA, '
  'reaproveitável por qualquer vertical que precise de checklist + fotos + assinatura.';

create trigger trg_ordens_servico_atualizado_em
  before update on ordens_servico
  for each row execute function set_atualizado_em();

-- =====================================================================
-- contratos — genérico, referência polimórfica ao registro de origem
-- =====================================================================
create table contratos (
  id               uuid primary key default gen_random_uuid(),
  conta_id         uuid not null references contas(id) on delete cascade,
  tipo_negocio     text not null references tipos_negocio(codigo),
  cliente_id       uuid not null references clientes(id) on delete restrict,
  referencia_tipo  text not null,   -- 'agendamento' | 'ordem_servico' | 'evento' | 'sessao_foto' | 'pedido_confeitaria' | 'chamado_manutencao'
  referencia_id    uuid not null,   -- id da tabela referenciada; não é FK direta pois referencia_tipo é polimórfico
  titulo           text not null,
  conteudo         text,            -- corpo do contrato (texto ou template renderizado)
  valor_total      numeric(12, 2),
  status           text not null default 'rascunho'
                     check (status in ('rascunho', 'enviado', 'assinado', 'cancelado')),
  assinado_em      timestamptz,
  arquivo_pdf_url  text,
  metadados        jsonb not null default '{}'::jsonb,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

comment on table contratos is
  'Contrato genérico. Tabelas verticais (contratos_evento, contratos_sessao, '
  'contratos_manutencao) estendem este registro com campos específicos via contrato_id.';
comment on column contratos.referencia_id is
  'Aponta para o registro de origem (evento, sessão, pedido, chamado...) identificado por referencia_tipo.';

create trigger trg_contratos_atualizado_em
  before update on contratos
  for each row execute function set_atualizado_em();

-- =====================================================================
-- notificacoes
-- =====================================================================
create table notificacoes (
  id           uuid primary key default gen_random_uuid(),
  conta_id     uuid not null references contas(id) on delete cascade,
  usuario_id   uuid references usuarios(id) on delete cascade,  -- nulo = notificação de sistema/conta, não de um usuário específico
  tipo         text not null,      -- 'agendamento_confirmado' | 'pedido_pronto' | 'pagamento_recebido' | ...
  titulo       text not null,
  mensagem     text,
  canal        text not null default 'sistema'
                 check (canal in ('sistema', 'email', 'sms', 'whatsapp')),
  lida         boolean not null default false,
  lida_em      timestamptz,
  metadados    jsonb not null default '{}'::jsonb,
  criado_em    timestamptz not null default now()
);

comment on table notificacoes is 'Notificações enviadas a usuários de uma conta, por canal.';

-- =====================================================================
-- avaliacao_cliente — referência polimórfica, igual a contratos
-- =====================================================================
create table avaliacao_cliente (
  id               uuid primary key default gen_random_uuid(),
  conta_id         uuid not null references contas(id) on delete cascade,
  cliente_id       uuid not null references clientes(id) on delete cascade,
  referencia_tipo  text not null,   -- 'ordem_servico' | 'evento' | 'sessao_foto' | 'pedido_confeitaria' | 'ordem_manutencao'
  referencia_id    uuid not null,
  nota             smallint not null check (nota between 1 and 5),
  comentario       text,
  resposta_empresa text,
  criado_em        timestamptz not null default now()
);

comment on table avaliacao_cliente is 'Avaliação (1-5 estrelas) deixada pelo cliente sobre um serviço concluído.';

-- =====================================================================
-- integracao_pagamento
-- =====================================================================
create table integracao_pagamento (
  id                       uuid primary key default gen_random_uuid(),
  conta_id                 uuid not null references contas(id) on delete cascade,
  referencia_tipo          text not null,
  referencia_id            uuid not null,
  provedor                 text not null
                             check (provedor in ('stripe', 'mercado_pago', 'pagseguro', 'pix_manual', 'outro')),
  provedor_transacao_id    text,       -- id da transação no provedor externo, para reconciliação/webhooks
  valor                    numeric(12, 2) not null,
  moeda                    text not null default 'BRL',
  status                   text not null default 'pendente'
                             check (status in ('pendente', 'processando', 'pago', 'recusado', 'estornado')),
  metodo                   text,       -- 'cartao' | 'pix' | 'boleto'
  payload_bruto            jsonb,      -- payload cru do webhook, para auditoria/depuração
  pago_em                  timestamptz,
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now()
);

comment on table integracao_pagamento is 'Transações de pagamento associadas a qualquer registro de origem (polimórfico).';

create trigger trg_integracao_pagamento_atualizado_em
  before update on integracao_pagamento
  for each row execute function set_atualizado_em();

-- =====================================================================
-- auditoria — trilha de auditoria genérica
-- =====================================================================
create table auditoria (
  id            uuid primary key default gen_random_uuid(),
  conta_id      uuid references contas(id) on delete cascade,
  usuario_id    uuid references usuarios(id) on delete set null,
  acao          text not null,   -- 'create' | 'update' | 'delete' | 'login' | 'logout' | ...
  entidade      text not null,   -- nome da tabela/entidade afetada
  entidade_id   uuid,
  dados_antes   jsonb,
  dados_depois  jsonb,
  ip_origem     text,
  criado_em     timestamptz not null default now()
);

comment on table auditoria is 'Trilha de auditoria: quem fez o quê, quando, e o diff antes/depois.';

-- =====================================================================
-- Row Level Security — postura padrão: negar tudo a anon/authenticated.
-- service_role (usado pelo backend) ignora RLS automaticamente no
-- Supabase. Políticas granulares por papel (admin/gestor/tecnico/
-- cliente) serão adicionadas junto com o middleware de autenticação
-- (Tarefa 5), quando o modelo de auth (JWT próprio vs Supabase Auth)
-- estiver definido.
-- =====================================================================
alter table contas                enable row level security;
alter table clientes              enable row level security;
alter table usuarios              enable row level security;
alter table servicos              enable row level security;
alter table agendamentos          enable row level security;
alter table ordens_servico        enable row level security;
alter table contratos             enable row level security;
alter table notificacoes          enable row level security;
alter table avaliacao_cliente     enable row level security;
alter table integracao_pagamento  enable row level security;
alter table auditoria             enable row level security;

-- =====================================================================
-- Índices de apoio às buscas mais frequentes (escopo por conta_id é a
-- primeira coisa filtrada em praticamente toda query multi-tenant).
-- Índices adicionais/cross-cutting ficam em schema_indexes_constraints.sql.
-- =====================================================================
create index idx_clientes_conta_id             on clientes (conta_id);
create index idx_clientes_conta_nome           on clientes (conta_id, nome);
create index idx_usuarios_conta_id             on usuarios (conta_id);
create index idx_usuarios_papel                on usuarios (conta_id, papel);
create index idx_servicos_conta_tipo           on servicos (conta_id, tipo_negocio);
create index idx_agendamentos_conta_data       on agendamentos (conta_id, data_hora_inicio);
create index idx_agendamentos_status           on agendamentos (conta_id, status);
create index idx_agendamentos_cliente_id       on agendamentos (cliente_id);
create index idx_ordens_servico_conta_status   on ordens_servico (conta_id, status);
create index idx_ordens_servico_cliente_id     on ordens_servico (cliente_id);
create index idx_contratos_referencia          on contratos (referencia_tipo, referencia_id);
create index idx_notificacoes_usuario_lida     on notificacoes (usuario_id, lida);
create index idx_avaliacao_referencia          on avaliacao_cliente (referencia_tipo, referencia_id);
create index idx_integracao_pagamento_ref      on integracao_pagamento (referencia_tipo, referencia_id);
create index idx_auditoria_conta_criado        on auditoria (conta_id, criado_em desc);

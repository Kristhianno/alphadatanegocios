-- =====================================================================
-- SERVICEHUB — ÍNDICES E CONSTRAINTS ADICIONAIS (schema_indexes_constraints.sql)
-- =====================================================================
-- Os índices "óbvios" (conta_id, status, FKs de busca direta) já foram
-- criados junto de cada tabela nos arquivos anteriores — é mais fácil
-- de revisar um índice ao lado da tabela que ele serve. Este arquivo
-- reúne o que é genuinamente cross-cutting: índices compostos para os
-- dashboards/relatórios, índices parciais para filas de trabalho, e
-- índices GIN para busca dentro das colunas JSONB de metadados.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Relatórios: consultas típicas de dashboard filtram por conta + tipo
-- de negócio + status, ordenando por data de criação (mais recentes
-- primeiro). Um índice composto cobre esse padrão sem precisar de
-- index-only-scan combinando três índices simples.
-- ---------------------------------------------------------------------
create index idx_ordens_servico_relatorio
  on ordens_servico (conta_id, tipo_negocio, status, criado_em desc);

create index idx_agendamentos_relatorio
  on agendamentos (conta_id, tipo_negocio, status, data_hora_inicio desc);

-- ---------------------------------------------------------------------
-- "Minhas ordens" (visão do técnico/gestor logado) — filtra por
-- responsável e ordena por data. Equivalente ao usePrestadores +
-- ordens filtradas por tecnicoId no ALPHADATA.
-- ---------------------------------------------------------------------
create index idx_agendamentos_responsavel_data
  on agendamentos (responsavel_id, data_hora_inicio)
  where responsavel_id is not null;

create index idx_ordens_servico_responsavel
  on ordens_servico (responsavel_id, status)
  where responsavel_id is not null;

-- ---------------------------------------------------------------------
-- Filas de trabalho: dashboards mostram principalmente itens em aberto.
-- Índices parciais (WHERE) mantêm o índice pequeno e rápido, já que a
-- maioria das linhas historicamente estará concluída/cancelada.
-- ---------------------------------------------------------------------
create index idx_chamados_manutencao_abertos
  on chamados_manutencao (conta_id, prioridade, criado_em)
  where status not in ('concluido', 'cancelado');

create index idx_pedidos_confeitaria_ativos
  on pedidos_confeitaria (conta_id, data_entrega)
  where status not in ('entregue', 'cancelado');

create index idx_eventos_ativos
  on eventos (conta_id, data_evento)
  where status not in ('finalizado', 'cancelado');

create index idx_sessoes_foto_pendentes_edicao
  on sessoes_foto (conta_id, percentual_edicao_concluida)
  where status in ('realizada', 'em_edicao');

-- ---------------------------------------------------------------------
-- Ingredientes/materiais próximos do vencimento ou abaixo do mínimo —
-- consulta recorrente de alertas de estoque.
-- ---------------------------------------------------------------------
create index idx_ingredientes_estoque_alerta
  on ingredientes_estoque (conta_id, data_validade)
  where data_validade is not null;

-- ---------------------------------------------------------------------
-- Busca dentro de colunas JSONB de metadados (ex: filtrar agendamentos
-- por metadados->>'tipoEvento' = 'casamento'). GIN é o índice correto
-- para operadores de contenção (@>, ?, ?&, ?|) em jsonb.
-- ---------------------------------------------------------------------
create index idx_servicos_metadados_gin        on servicos using gin (metadados);
create index idx_agendamentos_metadados_gin    on agendamentos using gin (metadados);
create index idx_ordens_servico_metadados_gin  on ordens_servico using gin (metadados);
create index idx_contas_configuracoes_gin      on contas using gin (configuracoes_gerais);

-- ---------------------------------------------------------------------
-- Galeria de fotos entregue ao cliente: busca pelo token de acesso
-- público precisa ser O(log n), não sequential scan.
-- (Já criado em schema_fotografia.sql — mantido aqui documentado por
-- ser o único índice do schema que atende tráfego não-autenticado.)
-- ---------------------------------------------------------------------
-- create index idx_galeria_cliente_token on galeria_cliente (token_acesso);  -- já existe

-- =====================================================================
-- Registro de decisão: comportamento ON DELETE por relação
-- =====================================================================
-- [ATUALIZADO em 20260825000004_fix_restrict_fks_to_cascade.sql —
-- ver esse arquivo para o porquê.] Documentado aqui para revisão:
--
--   CASCADE      → contas → praticamente tudo (inclusive clientes →
--                  agendamentos/ordens_servico/eventos/etc, que
--                  começou como RESTRICT e foi corrigido pra CASCADE):
--                  apagar uma conta remove todo o histórico daquele
--                  tenant, de ponta a ponta, numa operação só.
--   SET NULL     → usuarios → responsavel_id, tecnico_id, editor_id...:
--                  remover um usuário (ex: funcionário demitido) não
--                  deve apagar o histórico de trabalho que ele fez,
--                  apenas desvincular o "quem fez".
--
-- Regra geral aplicada em todo o schema: nunca DELETE físico de
-- usuarios/clientes/produtos a partir da aplicação em uso normal —
-- sempre soft-delete via campo status/ativo. Isso NÃO é mais reforçado
-- por RESTRICT no banco (RESTRICT quebrava a cascata de exclusão de
-- conta inteira — testado e comprovado); a responsabilidade de nunca
-- fazer um DELETE físico avulso é 100% da camada de aplicação agora.
-- =====================================================================

-- =====================================================================
-- Particionamento (opcional, não aplicado nesta fase)
-- =====================================================================
-- `auditoria` e `ordens_servico` são as tabelas com maior volume de
-- escrita ao longo do tempo. Se o volume justificar (tipicamente
-- dezenas de milhões de linhas), a recomendação é RANGE PARTITION por
-- criado_em (mensal). Como particionamento precisa ser definido na
-- criação da tabela, aplicar isso depois exigiria uma migração de
-- recriação de tabela — decisão adiada até haver dado real de volume
-- em produção que justifique a complexidade operacional extra.
-- =====================================================================

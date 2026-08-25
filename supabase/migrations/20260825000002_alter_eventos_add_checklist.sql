-- =====================================================================
-- FIX: eventos precisa de uma coluna para o checklist operacional
-- =====================================================================
-- gerarChecklistEvento() (Tarefa 3.5) não tinha onde persistir as
-- etapas — schema_salao_festas.sql original não previu esse campo
-- (só pensou em financeiro_evento/equipes_evento/equipamentos_evento).
-- Mesmo padrão de ordens_servico.checklist e
-- ordens_producao.checklist_etapas.
-- =====================================================================

alter table eventos add column checklist jsonb not null default '[]'::jsonb;

comment on column eventos.checklist is
  'Checklist operacional do evento (montagem, decoração, som, etc.) — gerado por SalaoFestasService.gerarChecklistEvento().';

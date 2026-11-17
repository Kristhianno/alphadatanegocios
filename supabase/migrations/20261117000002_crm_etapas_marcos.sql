-- ============================================================================
-- CRM: sai a etapa "Novo lead". O funil passa a ser
--   Primeiro contato → Follow-up → Concluído
-- e cada avanço exige um marco do negócio:
--   → Follow-up: orçamento enviado
--   → Concluído: contrato enviado + assinado + sinal da reserva pago
-- Ao concluir, a data da festa fica fechada (não muda mais pelo card).
-- ============================================================================

update crm_leads set etapa = 'primeiro_contato', ultimo_contato_em = coalesce(ultimo_contato_em, now())
  where etapa = 'novo';

alter table crm_leads drop constraint if exists crm_leads_etapa_check;
alter table crm_leads add constraint crm_leads_etapa_check check (etapa in ('primeiro_contato', 'follow_up', 'concluido'));
alter table crm_leads alter column etapa set default 'primeiro_contato';

alter table crm_leads add column if not exists orcamento_enviado_em timestamptz;
alter table crm_leads add column if not exists contrato_enviado_em  timestamptz;
alter table crm_leads add column if not exists contrato_assinado_em timestamptz;
alter table crm_leads add column if not exists sinal_pago_em        timestamptz;

-- Leads que já estavam adiante no funil: considera os marcos cumpridos, pra não travar ninguém.
update crm_leads set orcamento_enviado_em = coalesce(orcamento_enviado_em, atualizado_em)
  where etapa in ('follow_up', 'concluido');
update crm_leads set
    contrato_enviado_em  = coalesce(contrato_enviado_em, atualizado_em),
    contrato_assinado_em = coalesce(contrato_assinado_em, atualizado_em),
    sinal_pago_em        = coalesce(sinal_pago_em, atualizado_em)
  where etapa = 'concluido' and coalesce(resultado, 'ganho') = 'ganho';
-- Quem estava em "Concluído" como "não fechou" volta pro follow-up (concluído agora é só festa fechada).
update crm_leads set etapa = 'follow_up', resultado = null where etapa = 'concluido' and resultado = 'perdido';

comment on table crm_leads is 'Leads do CRM em kanban de uma conta (plano Completo): Primeiro contato → Follow-up (orçamento enviado) → Concluído (contrato enviado e assinado + sinal pago; data fechada).';

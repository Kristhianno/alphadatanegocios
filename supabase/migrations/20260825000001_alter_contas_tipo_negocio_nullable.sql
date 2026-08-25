-- =====================================================================
-- FIX: contas.tipo_negocio precisa aceitar NULL
-- =====================================================================
-- O fluxo de cadastro é em duas etapas (POST /auth/register cria a
-- conta; POST /auth/selecionar-negocio define o vertical depois do
-- login) — schema_shared.sql original exigia tipo_negocio NOT NULL na
-- criação da conta, o que tornava o registro em duas etapas impossível.
-- Descoberto ao implementar UserService.criarUsuario (Tarefa 3.1).
-- =====================================================================

alter table contas alter column tipo_negocio drop not null;

comment on column contas.tipo_negocio is
  'Nulo entre o cadastro (POST /auth/register) e a seleção do vertical '
  '(POST /auth/selecionar-negocio) — UserService.selecionarTipoNegocio preenche depois.';

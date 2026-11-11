-- ============================================================================
-- Papel 'superadmin': o dono da plataforma ALPHADATA (não de um tenant).
--
-- O superadmin continua tendo uma linha em `contas` (uma conta interna,
-- marcada com configuracoes_gerais.interna = true e escondida das
-- listagens da plataforma) — assim `usuarios.conta_id` segue NOT NULL e
-- nenhum código existente que assume "todo usuário tem conta" quebra.
-- A única mudança de schema necessária é liberar o novo valor de papel.
-- ============================================================================

alter table usuarios drop constraint if exists usuarios_papel_check;

alter table usuarios
  add constraint usuarios_papel_check
  check (papel in ('admin', 'gestor', 'tecnico', 'cliente', 'superadmin'));

comment on column usuarios.papel is
  'admin (gestão completa da conta), gestor/tecnico (operacional), cliente (portal do cliente) '
  'ou superadmin (dono da plataforma — vê todas as contas; usa uma conta interna própria).';

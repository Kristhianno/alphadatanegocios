-- =====================================================================
-- FIX: ON DELETE RESTRICT quebra a cascata de exclusão de uma conta
-- =====================================================================
-- Descoberto rodando de verdade: apagar uma `conta` deveria cascatear
-- para tudo (é a única forma de exclusão que a aplicação realmente
-- executa — clientes/produtos/materiais individuais são sempre
-- soft-delete via campo ativo/status, nunca DELETE físico, como já
-- documentado em schema_indexes_constraints.sql).
--
-- Só que RESTRICT numa tabela que também é alcançada por outro
-- caminho CASCADE cria uma dependência que o Postgres não resolve de
-- forma confiável dentro de uma única árvore de cascata — a
-- constraint RESTRICT é verificada no momento em que o Postgres tenta
-- apagar a tabela referenciada, mesmo que as linhas que a referenciam
-- estejam, elas também, na fila para serem apagadas por outro caminho
-- CASCADE da mesma operação. Exemplo real que quebrou:
--   contas → receitas (cascade) → receita_ingredientes (cascade)
--   contas → ingredientes_estoque (cascade, caminho direto)
--   receita_ingredientes.ingrediente_id → ingredientes_estoque (era RESTRICT)
-- Resultado: "violates foreign key constraint
-- receita_ingredientes_ingrediente_id_fkey" ao apagar a conta.
--
-- Como a proteção contra apagar um cliente/produto/material isolado
-- por engano já é responsabilidade da aplicação (soft-delete), RESTRICT
-- aqui só atrapalhava o único cenário de exclusão física que existe de
-- verdade (apagar a conta inteira). Trocado para CASCADE em todas as
-- 12 constraints que tinham esse problema.
-- =====================================================================

alter table agendamentos          drop constraint agendamentos_cliente_id_fkey,
                                   add constraint agendamentos_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table ordens_servico        drop constraint ordens_servico_cliente_id_fkey,
                                   add constraint ordens_servico_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table contratos             drop constraint contratos_cliente_id_fkey,
                                   add constraint contratos_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table pedidos_confeitaria   drop constraint pedidos_confeitaria_cliente_id_fkey,
                                   add constraint pedidos_confeitaria_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table receita_ingredientes  drop constraint receita_ingredientes_ingrediente_id_fkey,
                                   add constraint receita_ingredientes_ingrediente_id_fkey foreign key (ingrediente_id) references ingredientes_estoque(id) on delete cascade;

alter table itens_pedido          drop constraint itens_pedido_produto_id_fkey,
                                   add constraint itens_pedido_produto_id_fkey foreign key (produto_id) references catalogo_produtos(id) on delete cascade;

alter table eventos               drop constraint eventos_cliente_id_fkey,
                                   add constraint eventos_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table sessoes_foto          drop constraint sessoes_foto_cliente_id_fkey,
                                   add constraint sessoes_foto_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table producoes_video       drop constraint producoes_video_cliente_id_fkey,
                                   add constraint producoes_video_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table chamados_manutencao   drop constraint chamados_manutencao_cliente_id_fkey,
                                   add constraint chamados_manutencao_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

alter table materiais_utilizados  drop constraint materiais_utilizados_material_id_fkey,
                                   add constraint materiais_utilizados_material_id_fkey foreign key (material_id) references materiais_manutencao(id) on delete cascade;

alter table inspeccoes            drop constraint inspeccoes_cliente_id_fkey,
                                   add constraint inspeccoes_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade;

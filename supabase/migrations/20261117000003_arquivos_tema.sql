-- ============================================================================
-- "Materiais prontos" do Portfólio organizados por tema (ex: "Festa Unicórnio",
-- "Casamento rústico"). O tema é só um rótulo livre no arquivo — os arquivos de
-- mesmo tema (na mesma aba) aparecem juntos. Arquivos antigos ficam sem tema.
-- ============================================================================

alter table arquivos add column if not exists tema text;

alter table arquivos drop constraint if exists arquivos_tema_check;
alter table arquivos add constraint arquivos_tema_check
  check (tema is null or char_length(tema) between 1 and 80);

comment on column arquivos.tema is 'Rótulo livre para agrupar materiais prontos do portfólio (null = sem tema).';

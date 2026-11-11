-- ============================================================================
-- Armazenamento de arquivos por conta (fotos, vídeos, PDFs, documentos).
--
-- Os bytes ficam no Supabase Storage, numa pasta por conta:
--   <bucket>/<conta_id>/<categoria>/<uuid>.<ext>
-- e esta tabela guarda o registro de cada arquivo (dono, tipo, tamanho,
-- categoria) — é dela que sai a cota usada por conta.
--
-- Dois buckets:
--   publico — catálogo (pacotes/kits) e portfólio: link permanente, é o que
--             a IA do WhatsApp envia pros clientes;
--   privado — contratos, documentos, fotos de eventos: só com link
--             temporário assinado pelo backend.
-- Limite por arquivo: 50MB (teto do plano gratuito do Supabase).
-- ============================================================================

create table arquivos (
  id              uuid primary key default gen_random_uuid(),
  conta_id        uuid not null references contas(id) on delete cascade,
  bucket          text not null check (bucket in ('publico', 'privado')),
  caminho         text not null unique,                 -- caminho do objeto dentro do bucket
  nome_original   text not null,
  tipo_mime       text not null,
  tipo            text not null check (tipo in ('imagem', 'video', 'documento')),
  tamanho_bytes   bigint not null check (tamanho_bytes >= 0),
  categoria       text not null
                    check (categoria in ('catalogo', 'portfolio', 'evento', 'contrato', 'documento', 'outro')),
  entidade_tipo   text,                                  -- opcional: a que registro o arquivo pertence (ex: 'servico', 'evento')
  entidade_id     uuid,
  criado_por      uuid references usuarios(id) on delete set null,
  criado_em       timestamptz not null default now()
);

comment on table arquivos is 'Arquivos (fotos, vídeos, PDFs) de cada conta guardados no Supabase Storage; base da cota de armazenamento.';

create index idx_arquivos_conta on arquivos (conta_id, criado_em desc);
create index idx_arquivos_entidade on arquivos (conta_id, entidade_tipo, entidade_id);

grant all privileges on arquivos to service_role;
revoke all on arquivos from anon, authenticated;
alter table arquivos enable row level security;

-- Buckets (sem políticas de acesso em storage.objects: upload só por URL
-- assinada gerada pelo backend; leitura do privado só por URL assinada).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('publico', 'publico', true, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']),
  ('privado', 'privado', false, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/msword', 'application/vnd.ms-excel'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

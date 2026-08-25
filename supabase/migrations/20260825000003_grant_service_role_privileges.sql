-- =====================================================================
-- FIX: service_role sem GRANT nas tabelas — "permission denied"
-- =====================================================================
-- RLS habilitado (Tarefa 1) e "service_role ignora RLS" são coisas
-- diferentes de ter GRANT de tabela. Bypass de RLS só entra em jogo
-- DEPOIS que o Postgres já autorizou a operação a nível de tabela —
-- sem o GRANT, o erro é "permission denied", nem chega a avaliar RLS.
--
-- Descoberto rodando os services de verdade via supabase-js (que fala
-- com o Postgres pela role service_role de fato, via PostgREST) — os
-- testes da Tarefa 1 usaram `supabase db query --linked`, que roda com
-- privilégio elevado por fora do PostgREST e não exercita esse caminho.
--
-- ALTER DEFAULT PRIVILEGES cobre as tabelas de migrations futuras
-- também, pra esse problema não se repetir a cada nova tabela.
-- =====================================================================

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Leads da landing ("Conhecer planos"): WhatsApp (opcional) e a mensagem
-- do formulário. Sem isso o lead chegava só com nome e e-mail.
alter table leads add column if not exists telefone text;
alter table leads add column if not exists mensagem text;

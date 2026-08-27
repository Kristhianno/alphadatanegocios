-- =====================================================================
-- Assinatura via Stripe (teste grátis de 7 dias) + captação de leads da
-- landing page. `status`/`plano` de `contas` continuam com os mesmos
-- valores de sempre — os status da assinatura no Stripe (trialing/
-- active/past_due/unpaid/canceled) são mapeados pro enum já existente
-- em BillingService, não precisam de coluna própria.
-- =====================================================================

alter table contas
  add column ciclo_cobranca      text check (ciclo_cobranca in ('mensal', 'anual')),
  add column stripe_customer_id      text,
  add column stripe_subscription_id text,
  add column trial_termina_em        timestamptz,
  add column assinatura_pendente     boolean not null default false;

comment on column contas.ciclo_cobranca is 'Periodicidade da assinatura escolhida no checkout (mensal ou anual). Nulo até a conta escolher um plano.';
comment on column contas.stripe_customer_id is 'Id do Customer no Stripe, preenchido após o primeiro checkout.';
comment on column contas.stripe_subscription_id is 'Id da Subscription no Stripe, preenchido após o primeiro checkout.';
comment on column contas.trial_termina_em is 'Fim do período de teste grátis de 7 dias (trial_end da subscription no Stripe).';
comment on column contas.assinatura_pendente is 'true quando a conta veio de um CTA de plano na landing e ainda não completou o checkout no Stripe — bloqueia o acesso ao dashboard até isso acontecer (ver Layout.jsx).';

create index idx_contas_stripe_customer_id on contas (stripe_customer_id) where stripe_customer_id is not null;
create index idx_contas_stripe_subscription_id on contas (stripe_subscription_id) where stripe_subscription_id is not null;

-- =====================================================================
-- leads — captação da landing page ("fale com a gente"), dado comercial
-- da própria ALPHADATA, não de um tenant — por isso sem conta_id.
-- =====================================================================
create table leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  email      text not null,
  origem     text not null default 'landing',
  criado_em  timestamptz not null default now()
);

comment on table leads is 'Leads captados na landing page pública para contato comercial — não é dado de um tenant (contas).';

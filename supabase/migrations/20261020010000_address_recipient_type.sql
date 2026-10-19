-- Lets a customer tell their own delivery addresses apart from ones they've
-- saved for someone else (profile page: "Own Address" vs "Others Address").
-- Defaults to 'own' so every existing row stays valid without a backfill.

alter table public.addresses
  add column recipient_type text not null default 'own'
  check (recipient_type in ('own', 'other'));

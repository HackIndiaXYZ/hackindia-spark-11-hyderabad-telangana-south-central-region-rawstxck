create table public.wallet_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  algorand_address text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, algorand_address)
);

create table public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bank_id text not null references public.repos(bank_id) on delete cascade,
  amount_microalgos bigint not null,
  receiver_address text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'consumed')),
  algorand_tx_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_links enable row level security;
alter table public.payment_sessions enable row level security;

create policy "own wallet links only" on public.wallet_links for all using (auth.uid() = user_id);
create policy "own payment sessions only" on public.payment_sessions for all using (auth.uid() = user_id);

-- Profiles table 
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  email text,
  is_admin boolean default false,
  selected_charity_id uuid,
  charity_percentage integer default 10 check (charity_percentage >= 10),
  subscription_status text default 'inactive',   
  subscription_plan text,                        
  subscription_end_date timestamptz,
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Charities
create table charities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Golf Scores 
create table scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 45),
  score_date date not null,
  created_at timestamptz default now(),
  unique(user_id, score_date)  
);

-- Monthly Draws
create table draws (
  id uuid default gen_random_uuid() primary key,
  draw_date date not null,
  drawn_numbers integer[] not null,   
  status text default 'pending',     
  jackpot_amount numeric default 0,
  pool_4match numeric default 0,
  pool_3match numeric default 0,
  jackpot_rolled_over boolean default false,
  created_at timestamptz default now()
);

-- Winners / Results
create table draw_results (
  id uuid default gen_random_uuid() primary key,
  draw_id uuid references draws(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  matched_count integer not null,           -- 3, 4, or 5
  prize_amount numeric default 0,
  proof_url text,
  verification_status text default 'pending',  -- pending | approved | rejected
  payout_status text default 'pending',        -- pending | paid
  created_at timestamptz default now()
);

-- Autocreate profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

--charities to start
insert into charities (name, description, is_featured) values
  ('Cancer Research UK', 'Funding life-saving cancer research across the UK.', true),
  ('Age UK', 'Supporting older people to live well and with dignity.', false),
  ('Mind', 'Mental health support and advocacy.', false);
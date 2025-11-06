-- Achievement System: Schema (run manually)
-- Creates tables for levels, metrics, achievements, and a helper view.

-- Roles: 'buyer' or 'seller'

create table if not exists public.user_levels (
  user_id uuid not null,
  role text not null check (role in ('buyer','seller')),
  level int not null default 0,
  xp int not null default 0,
  next_level_xp int not null default 100,
  updated_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.achievements (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  description text,
  icon text, -- path to icon in public
  role text not null check (role in ('buyer','seller')),
  tier text not null default 'bronze',
  points int not null default 0
);

create table if not exists public.user_achievements (
  user_id uuid not null,
  achievement_id bigint not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.user_metrics (
  user_id uuid primary key,
  -- buyer metrics
  total_spent numeric(12,2) not null default 0,
  order_count int not null default 0,
  -- seller metrics
  items_sold int not null default 0,
  total_sales_amount numeric(12,2) not null default 0,
  avg_rating numeric(3,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- Helper view to map level to badge asset path
create or replace view public.v_user_level_badge as
  select
    ul.user_id,
    ul.role,
    ul.level,
    case
      when ul.level = 0 then 'Novice'
      when ul.level = 1 then 'Bronze'
      when ul.level = 2 then 'Silver'
      when ul.level = 3 then 'Gold'
      when ul.level = 4 then 'Platinum'
      when ul.level = 5 then 'Sapphire'
      when ul.level = 6 then 'Emerald'
      when ul.level = 7 then 'Ruby'
      when ul.level = 8 then 'Diamond'
      else 'Mythic'
    end as level_name,
    '/badges/' || (
      case
        when ul.level = 0 then 'Novice'
        when ul.level = 1 then 'Bronze'
        when ul.level = 2 then 'Silver'
        when ul.level = 3 then 'Gold'
        when ul.level = 4 then 'Platinum'
        when ul.level = 5 then 'Sapphire'
        when ul.level = 6 then 'Emerald'
        when ul.level = 7 then 'Ruby'
        when ul.level = 8 then 'Diamond'
        else 'Mythic'
      end
    ) || '.svg' as badge_path
  from public.user_levels ul;

-- Indexes
create index if not exists idx_user_levels_user_role on public.user_levels(user_id, role);
create index if not exists idx_user_achievements_user on public.user_achievements(user_id);
create index if not exists idx_user_metrics_user on public.user_metrics(user_id);

-- Seed default achievements (idempotent)
insert into public.achievements(code, name, description, icon, role, tier, points)
select * from (values
  ('first_purchase','First Purchase','Completed first order','/badges/first_purchase.svg','buyer','bronze',50),
  ('big_spender_100','Big Spender $100','Spent $100 total','/badges/big_spender.svg','buyer','silver',100),
  ('five_orders','Five Orders','Completed 5 orders','/badges/five_orders.svg','buyer','gold',120),
  ('streak_3_months','3-Month Streak','Ordered 3 months in a row','/badges/streak.svg','buyer','gold',150),
  ('first_sale','First Sale','Completed first sale','/badges/first_sale.svg','seller','bronze',50),
  ('ten_sales','Ten Sales','Sold 10 items','/badges/ten_sales.svg','seller','silver',120),
  ('rating_4_plus','4+ Rating','Maintained rating >= 4.0','/badges/rating.svg','seller','gold',150),
  ('revenue_10k','$10k Revenue','Reached $10,000 in revenue','/badges/revenue.svg','seller','gold',200)
) s(code,name,description,icon,role,tier,points)
where not exists (select 1 from public.achievements a where a.code = s.code);




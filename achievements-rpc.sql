-- Achievement System: RPCs (run manually)

-- Helper RPC to fetch level
create or replace function public.get_user_level(p_user_id uuid, p_role text)
returns table(level int, xp int, next_level_xp int, badge text) language sql stable as $$
  select ul.level, ul.xp, ul.next_level_xp, v.badge_path
  from public.user_levels ul
  left join public.v_user_level_badge v on v.user_id = ul.user_id and v.role = ul.role
  where ul.user_id = p_user_id and ul.role = p_role
$$;

-- RPC to fetch achievements
create or replace function public.get_user_achievements(p_user_id uuid, p_role text)
returns table(code text, name text, description text, icon text, tier text, earned_at timestamptz) language sql stable as $$
  select a.code, a.name, a.description, a.icon, a.tier, ua.earned_at
  from public.user_achievements ua
  join public.achievements a on a.id = ua.achievement_id
  where ua.user_id = p_user_id and a.role = p_role
  order by ua.earned_at desc
$$;

-- RPC to fetch progress deltas (next milestones)
create or replace function public.get_progress(p_user_id uuid, p_role text)
returns json language plpgsql stable as $$
declare
  m record;
  result json;
begin
  select * into m from public.user_metrics where user_id = p_user_id;
  if not found then
    return '{}'::json;
  end if;
  if p_role = 'buyer' then
    return json_build_object(
      'total_spent', m.total_spent,
      'order_count', m.order_count,
      'next_spent_100', greatest(0, 100 - m.total_spent),
      'next_orders_5', greatest(0, 5 - m.order_count)
    );
  else
    return json_build_object(
      'items_sold', m.items_sold,
      'total_sales_amount', m.total_sales_amount,
      'avg_rating', m.avg_rating,
      'next_sales_10', greatest(0, 10 - m.items_sold),
      'next_revenue_10k', greatest(0, 10000 - m.total_sales_amount)
    );
  end if;
end; $$;

-- Procedural helper used by Edge Function to idempotently grant an achievement
create or replace function public.grant_achievement_if_new(p_user_id uuid, p_code text)
returns void language plpgsql as $$
declare
  a_id bigint;
begin
  select id into a_id from public.achievements where code = p_code;
  if a_id is null then return; end if;
  insert into public.user_achievements(user_id, achievement_id)
  values (p_user_id, a_id)
  on conflict do nothing;
end; $$;






















-- Achievement System: Backfill (run manually)
-- Initializes user_metrics from historical orders and reviews.
-- Adjust table/column names to match your schema.

-- Ensure user_metrics rows exist for all known users
insert into public.user_metrics(user_id)
select id from auth.users u
on conflict do nothing;

-- Backfill buyer totals from orders
update public.user_metrics m set
  total_spent = coalesce(s.total_spent, 0),
  order_count = coalesce(s.order_count, 0),
  updated_at = now()
from (
  select buyer_id as user_id, sum(total)::numeric(12,2) as total_spent, count(*) as order_count
  from public.orders
  where status = 'paid'
  group by buyer_id
) s
where s.user_id = m.user_id;

-- Backfill seller totals from orders/items
update public.user_metrics m set
  items_sold = coalesce(s.items_sold, 0),
  total_sales_amount = coalesce(s.total_sales_amount, 0),
  updated_at = now()
from (
  select o.seller_id as user_id,
         sum(oi.quantity) as items_sold,
         sum(o.total)::numeric(12,2) as total_sales_amount
  from public.orders o
  left join public.order_items oi on oi.order_id = o.id
  where o.status = 'paid'
  group by o.seller_id
) s
where s.user_id = m.user_id;

-- Backfill seller average ratings
update public.user_metrics m set
  avg_rating = coalesce(s.avg_rating, 0),
  updated_at = now()
from (
  select seller_id as user_id, round(avg(rating)::numeric, 2) as avg_rating
  from public.reviews
  group by seller_id
) s
where s.user_id = m.user_id;






























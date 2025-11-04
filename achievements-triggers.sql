-- Achievement System: Triggers (run manually)
-- Updates user_metrics on order/payment and review changes.
-- NOTE: Adjust table/column names if your schema differs.

-- Example assumptions:
-- orders(id, buyer_id uuid, seller_id uuid, total numeric, status text)
-- order_items(id, order_id, quantity int)
-- reviews(id, seller_id uuid, rating numeric)

create or replace function public.fn_metrics_on_order_paid()
returns trigger language plpgsql as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    -- Buyer metrics
    insert into public.user_metrics(user_id, total_spent, order_count)
    values (new.buyer_id, new.total, 1)
    on conflict (user_id) do update set
      total_spent = public.user_metrics.total_spent + excluded.total_spent,
      order_count = public.user_metrics.order_count + 1,
      updated_at = now();

    -- Seller metrics
    -- Sum items from order_items
    perform 1;
    update public.user_metrics m
    set items_sold = m.items_sold + coalesce((
      select sum(oi.quantity) from public.order_items oi where oi.order_id = new.id
    ),0),
        total_sales_amount = m.total_sales_amount + new.total,
        updated_at = now()
    where m.user_id = new.seller_id;

    insert into public.user_metrics(user_id)
    values (new.seller_id)
    on conflict do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists trg_metrics_on_order_paid on public.orders;
create trigger trg_metrics_on_order_paid
after update on public.orders
for each row execute function public.fn_metrics_on_order_paid();


create or replace function public.fn_metrics_on_review_change()
returns trigger language plpgsql as $$
declare
  avg_r numeric;
begin
  select round(avg(r.rating)::numeric, 2) into avg_r
  from public.reviews r
  where r.seller_id = coalesce(new.seller_id, old.seller_id);

  insert into public.user_metrics(user_id, avg_rating)
  values (coalesce(new.seller_id, old.seller_id), coalesce(avg_r,0))
  on conflict (user_id) do update set
    avg_rating = coalesce(avg_r,0),
    updated_at = now();

  return coalesce(new, old);
end; $$;

drop trigger if exists trg_metrics_on_review_ins on public.reviews;
create trigger trg_metrics_on_review_ins
after insert on public.reviews
for each row execute function public.fn_metrics_on_review_change();

drop trigger if exists trg_metrics_on_review_upd on public.reviews;
create trigger trg_metrics_on_review_upd
after update on public.reviews
for each row execute function public.fn_metrics_on_review_change();









// Supabase Edge Function: recalc_levels
// Computes XP, levels, and grants achievements for buyers and sellers.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

type Role = 'buyer' | 'seller';

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1200, 2000, 3000, 4500, 6500, 9000];

function computeBuyerXp(totalSpent: number, orderCount: number): number {
  return Math.floor((totalSpent || 0) / 5) + (orderCount || 0) * 10;
}

function computeSellerXp(totalSalesAmount: number, itemsSold: number, avgRating: number): number {
  return Math.floor((totalSalesAmount || 0) / 10) + (itemsSold || 0) * 5 + Math.round((avgRating || 0) * 20);
}

function xpToLevel(xp: number) {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
  }
  const nextLevelXp = LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return { level, nextLevelXp };
}

async function grantAchievements(supabase: any, userId: string, role: Role, metrics: any) {
  const toGrant: string[] = [];
  if (role === 'buyer') {
    if ((metrics.order_count || 0) >= 1) toGrant.push('first_purchase');
    if ((metrics.total_spent || 0) >= 100) toGrant.push('big_spender_100');
    if ((metrics.order_count || 0) >= 5) toGrant.push('five_orders');
    // streak_3_months requires additional logic; skipping in minimal version
  } else {
    if ((metrics.items_sold || 0) >= 1) toGrant.push('first_sale');
    if ((metrics.items_sold || 0) >= 10) toGrant.push('ten_sales');
    if ((metrics.avg_rating || 0) >= 4.0) toGrant.push('rating_4_plus');
    if ((metrics.total_sales_amount || 0) >= 10000) toGrant.push('revenue_10k');
  }

  for (const code of toGrant) {
    await supabase.rpc('grant_achievement_if_new', { p_user_id: userId, p_code: code });
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id') || undefined;

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Select target users
  let { data: metrics, error } = await supabase
    .from('user_metrics')
    .select('*')
    .limit(userId ? 1 : 1000)
    .eq(userId ? 'user_id' : 'user_id', userId || undefined);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  metrics = metrics || [];

  for (const m of metrics) {
    const buyerXp = computeBuyerXp(Number(m.total_spent), Number(m.order_count));
    const sellerXp = computeSellerXp(Number(m.total_sales_amount), Number(m.items_sold), Number(m.avg_rating));

    const buyer = xpToLevel(buyerXp);
    const seller = xpToLevel(sellerXp);

    // Upsert levels
    if (buyerXp >= 0) {
      await supabase
        .from('user_levels')
        .upsert({ user_id: m.user_id, role: 'buyer', level: buyer.level, xp: buyerXp, next_level_xp: buyer.nextLevelXp, updated_at: new Date().toISOString() }, { onConflict: 'user_id,role' });
      await grantAchievements(supabase, m.user_id, 'buyer', m);
    }

    if (sellerXp >= 0) {
      await supabase
        .from('user_levels')
        .upsert({ user_id: m.user_id, role: 'seller', level: seller.level, xp: sellerXp, next_level_xp: seller.nextLevelXp, updated_at: new Date().toISOString() }, { onConflict: 'user_id,role' });
      await grantAchievements(supabase, m.user_id, 'seller', m);
    }
  }

  return new Response(JSON.stringify({ processed: metrics.length }), { headers: { 'content-type': 'application/json' } });
});






























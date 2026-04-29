import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Events that grant or confirm active premium access
const PREMIUM_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
]);

// Events that definitively end premium access.
// CANCELLATION is intentionally excluded — the user retains access until
// their paid period expires, at which point EXPIRATION fires.
// BILLING_ISSUE is also excluded — RevenueCat has a grace period; EXPIRATION
// fires when access is actually revoked.
const LAPSE_EVENTS = new Set([
  'EXPIRATION',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const WEBHOOK_SECRET = 'yoke_webhook_secret_2026_$!kF9xQpR3mZ';
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: { event?: { type?: string; app_user_id?: string } };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const eventType = body?.event?.type ?? '';
  const appUserId = body?.event?.app_user_id ?? '';

  if (!appUserId) {
    return json({ error: 'Missing app_user_id in event' }, 400);
  }

  const isPremium = PREMIUM_EVENTS.has(eventType);
  const isLapse = LAPSE_EVENTS.has(eventType);

  if (!isPremium && !isLapse) {
    // Acknowledge but take no action (CANCELLATION, BILLING_ISSUE, etc.)
    return json({ received: true, action: 'ignored', type: eventType });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await admin
    .from('users')
    .update({ is_premium: isPremium })
    .eq('id', appUserId);

  if (error) {
    console.error(`sync-premium-webhook: failed for user=${appUserId} type=${eventType}:`, error.message);
    return json({ error: error.message }, 500);
  }

  console.log(`sync-premium-webhook: user=${appUserId} type=${eventType} is_premium=${isPremium}`);
  return json({ received: true, action: 'updated', type: eventType, is_premium: isPremium });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

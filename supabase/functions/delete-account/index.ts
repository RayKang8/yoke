import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SECURE_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: SECURE_HEADERS });
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

  // Verify the JWT by calling getUser() — safer than manual JWT parsing
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  let userId: string;
  try {
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return json({ error: 'Invalid or expired token' }, 401);
    userId = user.id;
  } catch {
    return json({ error: 'Authentication failed' }, 401);
  }

  // Use admin client to delete — requires confirmed identity above
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: deleteError.message }, 500);

  return json({ success: true });
});

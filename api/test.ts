export const config = { runtime: 'edge' }

export default function handler(req: Request) {
  return new Response(JSON.stringify({
    ok: true,
    env: {
      hasSupaUrl: !!process.env.SUPABASE_URL,
      hasSupaKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

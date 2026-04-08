export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    env: {
      hasSupaUrl: !!process.env.SUPABASE_URL,
      hasSupaKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasViteUrl: !!process.env.VITE_SUPABASE_URL,
      hasViteKey: !!process.env.VITE_SUPABASE_ANON_KEY,
    }
  })
}

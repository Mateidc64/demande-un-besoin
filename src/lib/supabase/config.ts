// Les deux infos publiques de Supabase. Elles viennent de .env.local (en local)
// ou des réglages "Environment Variables" de Vercel (en ligne).
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vrai si les deux infos sont remplies. Sinon le site marche quand même,
// simplement sans base de données.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

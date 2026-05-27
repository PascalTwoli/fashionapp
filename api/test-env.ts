import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    supabaseUrl: process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('VITE'))
  });
}

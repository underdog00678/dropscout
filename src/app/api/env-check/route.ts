import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrlPrefix: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").slice(0, 35),
    anonKeyPrefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
    nodeEnv: process.env.NODE_ENV,
  });
}

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db"; // Drizzle DB instance

// Initialize Supabase client for auth (for compatibility)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Better Auth configuration with conditional database persistence
const authConfig = {
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: false,
    },
    cookiePrefix: "better-auth",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
  socialProviders: {},
  account: {
    accountLinking: {
      enabled: false,
    },
  },
};

// Add database adapter only if database is available
if (db) {
  console.log('🗄️ Using database adapter for Better Auth');
  (authConfig as any).database = drizzleAdapter(db, {
    provider: "postgresql",
  });
} else {
  console.log('🔌 Using memory adapter for Better Auth (development mode)');
}

export const auth = betterAuth(authConfig);
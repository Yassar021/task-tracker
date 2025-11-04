import { betterAuth } from "better-auth";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple auth config with Supabase integration
export const auth = betterAuth({
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
});
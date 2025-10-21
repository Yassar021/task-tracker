import { betterAuth } from "better-auth";

// Temporary auth config without database adapter
// We'll use Supabase directly for auth operations
const authConfig: any = {
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // For school environment, we can disable this
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: false, // Disable caching to ensure fresh session checks
        },
        // Ensure cookies are properly handled
        cookiePrefix: "better-auth",
        // Additional security settings
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    },
    account: {
        accountLinking: {
            enabled: false,
        },
    },
    experimental: {
        enabled: true,
    },
    // Skip database adapter for now - we'll use Supabase directly
};

export const auth = betterAuth(authConfig);
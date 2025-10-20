import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, users, teachers } from "@/db";
import { account, session, user, verification } from "@/db/schema/auth";

// Handle missing database gracefully
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
};

// Only add database adapter if db is available
if (db) {
    authConfig.database = drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
        schema: {
            user: user,
            account: account,
            session: session,
            verification: verification,
        },
    });
}

export const auth = betterAuth(authConfig);
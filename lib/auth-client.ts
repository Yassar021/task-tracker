import { createAuthClient } from "better-auth/react";

// Use dynamic baseURL for Better Auth to work in production
const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://task-tracker-yps.vercel.app'
    : (process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000');

export const authClient = createAuthClient({
    baseURL: baseURL,
    // Disable session caching to always get fresh session data
    sessionCache: {
        enabled: false,
    },
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
} = authClient;
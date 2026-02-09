// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/app/lib/db";
import type { NextAuthOptions } from "next-auth";

const options: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        // request Gmail readonly + openid email profile and force offline refresh token
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database" // sessions stored in DB via adapter
  },
  callbacks: {
    /**
     * jwt gets called on sign in and subsequent requests. We'll capture
     * tokens from the account object (available on first sign in) so
     * that our signIn callback can persist refresh_token.
     */
    async jwt({ token, account }) {
      // On initial sign-in, account will be present
      if (account) {
        // attach token metadata to JWT (optional)
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expires_at = account.expires_at;
      }
      return token;
    },

    /**
     * session is returned to the client. We keep it minimal here,
     * but you can attach flags to session.user if desired.
     */
    async session({ session, token }) {
      // Attach a small flag if user has a refresh token (not strictly necessary)
      session.user = session.user || {};
      (session as any).accessToken = (token as any).accessToken ?? null;
      return session;
    }
  },

  /**
   * Events let us run code when a user signs in.
   * We'll use the 'signIn' event to persist the refresh token to the gmail_tokens table.
   */
  events: {
    async signIn({ user, account }) {
      try {
        // account may be undefined after initial sign-in; only proceed when present
        if (!account) return;

        // account.providerAccountId is the Google user id (sub)
        const googleUserId = account.providerAccountId;

        // only persist refresh_token if we're given one (Google returns it on first consent)
        const refreshToken = account.refresh_token;
        const accessToken = account.access_token;
        const scope = account.scope;
        const tokenType = account.token_type;
        const expiresAt = account.expires_at ? new Date(account.expires_at * 1000) : null;

        if (refreshToken) {
          // upsert into gmail_tokens table (Prisma model name: GmailToken)
          await prisma.gmailToken.upsert({
            where: { userId: user.id },
            update: {
              googleUserId,
              refreshToken,
              accessToken,
              scope,
              tokenType,
              expiry: expiresAt || undefined
            },
            create: {
              userId: user.id,
              googleUserId,
              refreshToken,
              accessToken,
              scope,
              tokenType,
              expiry: expiresAt || undefined
            }
          });
        } else {
          // If no refresh token (unlikely if we requested offline & prompt=consent),
          // we still store access token info if available
          if (accessToken) {
            await prisma.gmailToken.upsert({
              where: { userId: user.id },
              update: { accessToken, scope, tokenType, expiry: expiresAt || undefined },
              create: { userId: user.id, googleUserId, accessToken, scope, tokenType, expiry: expiresAt || undefined }
            });
          }
        }
      } catch (err) {
        console.error("signIn event: failed to save gmail token", err);
      }
    }
  },

  // useful for debugging local dev; remove or lower verbosity in prod
  debug: process.env.NODE_ENV === "development"
};

const handler = NextAuth(options);
export { handler as GET, handler as POST };

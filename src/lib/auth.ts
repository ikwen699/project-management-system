import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { supabase } from "./supabase";
import type { User } from "@/types";

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { data: user, error } = await supabase
            .from("User")
            .select("*")
            .eq("email", credentials.email as string)
            .single();

          if (error) {
            console.error("Auth DB error:", error.message, "code:", error.code);
            return null;
          }

          if (!user) {
            console.error("Auth: no user found for email:", credentials.email);
            return null;
          }

          if ((user as any).removalScheduledAt && new Date((user as any).removalScheduledAt) <= new Date()) {
            console.error("Auth: account scheduled for removal has passed:", credentials.email);
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password as string,
            (user as User).password
          );

          if (!isPasswordValid) {
            console.error("Auth: invalid password for email:", credentials.email);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatar,
            role: (user as any).role || "USER",
          };
        } catch (e: any) {
          console.error("Auth authorize exception:", e?.message || String(e));
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      // Throttled re-validation: check user exists and not past-due every 5 minutes
      const now = Date.now();
      const lastCheck = (token.userCheckedAt as number) || 0;
      if (token.id && now - lastCheck > 5 * 60 * 1000) {
        try {
          const { data } = await supabase
            .from("User")
            .select("role, removalScheduledAt")
            .eq("id", token.id as string)
            .single();
          if (!data) {
            return null;
          }
          if (data.removalScheduledAt && new Date(data.removalScheduledAt) <= new Date()) {
            return null;
          }
          token.role = data.role || "USER";
          token.userCheckedAt = now;
        } catch {
          token.role = "USER";
        }
      } else if (!token.role && token.id) {
        // If role is missing from token (existing session), fetch from DB
        try {
          const { data } = await supabase
            .from("User")
            .select("role")
            .eq("id", token.id as string)
            .single();
          if (data) {
            token.role = data.role || "USER";
          }
        } catch {
          token.role = "USER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id || token.sub) as string;
        (session.user as any).role = token.role || "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

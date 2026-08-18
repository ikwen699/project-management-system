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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { data: user, error } = await supabase
          .from("User")
          .select("*")
          .eq("email", credentials.email as string)
          .single();

        if (error || !user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          (user as User).password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: (user as any).role || "USER",
        };
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
      // If role is missing from token (existing session), fetch from DB
      if (!token.role && token.id) {
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

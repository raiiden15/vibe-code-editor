import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "./lib/db";
import authConfig from "./auth.config";
import { getAccountByUserId, getUserById } from "./modules/auth/actions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Handle User Creating and account liking after a sign in 
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user || !account) return false;

            // check if the user already exists
            const existingUser = await db.user.findUnique({
                where: { email: user.email! },
            });

            if (!existingUser) {
                const newUser = await db.user.create({
                    data: {
                        email: user.email!,
                        name: user.name,
                        image: user.image,

                        accounts: {
                            // @ts-ignore
                            create: {
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                refreshToken: account.refresh_token,
                                accessToken: account.access_token,
                                expiresAt: account.expires_at,
                                tokenType: account.token_type,
                                scope: account.scope,
                                idToken: account.id_token,
                                sessionState: account.session_state,
                            },
                        },
                    },
                });
                // if new user creation fails, return false
                if (!newUser) return false; 
            } else {
              // Link account if user exits and account exists
                const existingAccount = await db.account.findUnique({
                    where: {
                        provider_providerAccountId: {
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        },
                    },
                });
                // if user exits, but no account, then create it
                if (!existingAccount) {
                    await db.account.create({
                        data: {
                            userId: existingUser.id,
                            type: account.type,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            refreshToken: account.refresh_token,
                            accessToken: account.access_token,
                            expiresAt: account.expires_at,
                            tokenType: account.token_type,
                            scope: account.scope,
                            idToken: account.id_token,
                            // @ts-ignore
                            sessionState: account.session_state,
                        },
                    });
                }
            }

            return true;
        },

        async jwt({ token, user, account }) {
            // sub is like id
            if (!token.sub) return token;
            const existingUser = await getUserById(token.sub);

            if (!existingUser) return token;

            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;

            return token;
        },

        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub; // different user id for different user
            }

            if (token.sub && session.user) {
                session.user.role = token.role;
                session.user.name = token.name;
                session.user.image = token.picture;
            }

            return session;
        },
    },
    secret: process.env.AUTH_SECRET,
    adapter: PrismaAdapter(db),
    session: {strategy: "jwt"},
    ...authConfig,
});

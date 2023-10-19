import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, default as NextAuth } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { mysqlTable } from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            // ...other properties
            // role: UserRole;
        } & DefaultSession["user"];
    }

    // interface User {
    //   // ...other properties
    //   // role: UserRole;
    // }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const {
    handlers: { GET, POST },
    auth,
} = NextAuth({
    providers: [
        DiscordProvider({
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
        }),
    ],
    adapter: DrizzleAdapter(db, mysqlTable),
    callbacks: {
        session: ({ session, user }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: user.id,
                },
            };
        },
    },
});

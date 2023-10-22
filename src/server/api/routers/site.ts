import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { sites } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

export const siteRouter = createTRPCRouter({
    createSite: protectedProcedure
        .input(z.object({ name: z.string().min(1), url: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            // check if site already exists
            const site = await ctx.db.query.sites.findFirst({
                where: eq(sites.url, input.url),
            });

            // if site exists, throw error
            if (site) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Site already exists",
                });
            }

            // if site doesn't exist, create it
            const newSite = await ctx.db.transaction(async (tx) => {
                await tx
                    .insert(sites)
                    .values({
                        name: input.name,
                        url: input.url,
                        id: createId(),
                        userId: ctx.session.user.id,
                    })
                    .execute();

                return await tx.query.sites.findFirst({
                    where: eq(sites.url, input.url),
                });
            });

            return newSite;
        }),
    getSite: protectedProcedure
        .input(z.object({ url: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.query.sites.findFirst({
                where: eq(sites.url, input.url),
            });
        }),
    checkSiteExists: protectedProcedure
        .input(z.object({ url: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!input.url) {
                return false;
            }
            const site = await ctx.db.query.sites.findFirst({
                where: eq(sites.url, input.url),
            });
            return !!site;
        }),
    getSites: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.query.sites.findMany({
            where: eq(sites.userId, ctx.session.user.id),
        });
    }),
});

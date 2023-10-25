import { type NextRequest, NextResponse } from "next/server";
import { verifySignatureEdge } from "@upstash/qstash/dist/nextjs";
import { env } from "~/env.mjs";
import {
    pageStats,
    referrerStats,
    siteStats,
    browserStats,
    deviceTypeStats,
    locationStats,
    sites,
    pageviews,
    locations,
} from "~/server/db/schema";
import { db } from "~/server/db";
import { gte } from "drizzle-orm";

type PageStatsInput = typeof pageStats.$inferInsert;
type ReferrerStatsInput = typeof referrerStats.$inferInsert;
type SiteStatsInput = typeof siteStats.$inferInsert;
type BrowserStatsInput = typeof browserStats.$inferInsert;
type DeviceTypeStatsInput = typeof deviceTypeStats.$inferInsert;
type LocationStatsInput = typeof locationStats.$inferInsert;
type PageviewsSelect = typeof pageviews.$inferSelect;

async function handler(_req: NextRequest) {
    // // simulate work
    // await new Promise((r) => setTimeout(r, 1000));

    // console.log("Success");
    // return NextResponse.json({ name: "John Doe" });

    const fetchedPageviews = await db.query.pageviews.findMany({
        where: gte(pageviews.timestamp, new Date(Date.now() - 1000 * 60 * 60)),
    });

    let siteIds = fetchedPageviews.map((pv) => pv.siteId);
    // get only the unique site ids
    siteIds = Array.from(new Set(siteIds));

    // create a hash map of site id to list of pageviews
    const siteIdToPageviews: Record<string, PageviewsSelect[]> = {};

    for (const siteId of siteIds) {
        siteIdToPageviews[siteId] = fetchedPageviews.filter(
            (pv) => pv.siteId === siteId,
        );
    }

    const pageStatsInserts: PageStatsInput[] = [];
    const referrerStatsInserts: ReferrerStatsInput[] = [];
    const siteStatsInserts: SiteStatsInput[] = [];
    const browserStatsInserts: BrowserStatsInput[] = [];
    const deviceTypeStatsInserts: DeviceTypeStatsInput[] = [];
    const locationStatsInserts: LocationStatsInput[] = [];

    for (const siteId of siteIds) {
        const pageviews = siteIdToPageviews[siteId]!;

        const siteStat: SiteStatsInput = {
            siteId,
            pageviews: pageviews.length,
            uniquePageviews: Array.from(
                new Set(pageviews.map((pv) => pv.userSignature)),
            ).length,
            avgDuration:
                pageviews.reduce((acc, pv) => acc + pv.duration, 0) /
                pageviews.length,
        };
    }

    return NextResponse.json({ name: "John Doe" });
}

export const POST = verifySignatureEdge(handler, {
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
});

export const runtime = "edge";

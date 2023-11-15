import { pageviews, type sites } from "~/server/db/schema";
import { db } from "~/server/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { ClientBarVisual, ClientVisitorGraph } from "./client-visuals";

type Site = typeof sites.$inferSelect;

export async function VisitorGraph({ site }: { site: Site }) {
    // for now, just get the last 30 days
    // get the date 30 days ago (at the start of the day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // get data
    const rawData = await db
        .select({
            pageviews: sql<number>`count(${pageviews.id})`,
            uniquePageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
            avgDuration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d 00:00:00')`,
        })
        .from(pageviews)
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
            ),
        )
        .groupBy(({ ts }) => ts)
        .execute();

    // format data
    const data = rawData.map((row) => ({
        // convert the timestamp (ts) to a friendly date (e.g. 30 Nov)
        date: new Date(row.ts).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        }),
        Pageviews: row.pageviews,
        "Unique Pageviews": row.uniquePageviews,
        Duration: row.avgDuration,
    }));

    return <ClientVisitorGraph data={data} />;
}

export async function ReferrersVisual({ site }: { site: Site }) {
    // for now, just get the last 30 days
    // get the date 30 days ago (at the start of the day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // get data
    const rawData = await db
        .select({
            referrer: pageviews.referrerHostname,
            pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
        })
        .from(pageviews)
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
            ),
        )
        .groupBy(({ referrer }) => referrer)
        .orderBy(desc(sql<number>`count(distinct ${pageviews.userSignature})`))
        .limit(10)
        .execute();

    // format data
    const data = rawData.map((row) => ({
        name: row.referrer ?? "Direct",
        value: row.pageviews,
    }));

    return <ClientBarVisual data={data} />;
}

export async function PagesVisual({ site }: { site: Site }) {
    // for now, just get the last 30 days
    // get the date 30 days ago (at the start of the day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // get data
    const rawData = await db
        .select({
            page: pageviews.pathname,
            pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
        })
        .from(pageviews)
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
            ),
        )
        .groupBy(({ page }) => page)
        .orderBy(desc(sql<number>`count(distinct ${pageviews.userSignature})`))
        .limit(10)
        .execute();

    // format data
    const data = rawData.map((row) => ({
        name: row.page,
        value: row.pageviews,
    }));

    return <ClientBarVisual data={data} />;
}

// add function for location visual(s)

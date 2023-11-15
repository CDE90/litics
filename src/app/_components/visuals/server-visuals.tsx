import { pageviews, type sites } from "~/server/db/schema";
import { db } from "~/server/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { ClientBarVisual, ClientVisitorGraph } from "./client-visuals";

import "server-only";

type Site = typeof sites.$inferSelect;

function generateDates(startDate: Date, endDate: Date) {
    const dates = [];
    const currentDate = startDate;
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

export async function VisitorGraph({ site }: { site: Site }) {
    // for now, just get the last 30 days
    // get the date 30 days ago (at the start of the day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // if the site was created after the start date, set the start date to the site's creation date (so we don't get lots of empty data)
    if (site.createdAt > startDate) {
        startDate.setTime(site.createdAt.getTime());
    }

    // get data
    const rawData = await db
        .select({
            pageviews: sql<number>`count(distinct concat(${pageviews.userSignature}, ${pageviews.pathname}))`,
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

    // generate dates for the specified range
    const generatedDates = generateDates(startDate, new Date());

    // map over generated dates and add data
    const data = generatedDates.map((date) => {
        const dateStr = date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        });

        const row = rawData.find(
            (row) =>
                new Date(row.ts).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                }) === dateStr,
        );

        return {
            date: dateStr,
            Pageviews: row?.pageviews ?? 0,
            "Unique Pageviews": row?.uniquePageviews ?? 0,
            Duration: row?.avgDuration ?? 0,
        };
    });

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

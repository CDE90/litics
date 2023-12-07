import { locations, pageviews, type sites } from "~/server/db/schema";
import { db } from "~/server/db";
import { type SQL, and, desc, eq, gte, sql, ne } from "drizzle-orm";
import { ClientBarVisual, AreaGraph, WorldMap } from "./client-visuals";

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

export async function VisitorGraph({
    site,
    filters,
}: {
    site: Site;
    filters: SQL<unknown> | undefined;
}) {
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
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d 00:00:00')`,
        })
        .from(pageviews)
        .leftJoin(locations, eq(locations.id, pageviews.locationId))
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
                filters ?? sql`1`,
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
            data: {
                Pageviews: row?.pageviews ?? 0,
                "Unique Pageviews": row?.uniquePageviews ?? 0,
            },
        };
    });

    return (
        <AreaGraph data={data} categories={["Pageviews", "Unique Pageviews"]} />
    );
}

export async function DurationGraph({
    site,
    filters,
}: {
    site: Site;
    filters: SQL<unknown> | undefined;
}) {
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
            avgDuration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d 00:00:00')`,
        })
        .from(pageviews)
        .leftJoin(locations, eq(locations.id, pageviews.locationId))
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
                filters ?? sql`1`,
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
            data: {
                Duration: row?.avgDuration ?? 0,
            },
        };
    });

    return (
        <AreaGraph data={data} categories={["Duration"]} formatter="duration" />
    );
}

function groupFieldToChar(groupField: string) {
    const filterFields = {
        referrerHostname: "r",
        pathname: "p",
        country: "c",
        region: "R",
        city: "C",
        browser: "b",
        os: "o",
        screenSize: "s",
    } as const;

    return filterFields[groupField as keyof typeof filterFields];
}

export async function BarListVisual({
    site,
    filters,
    groupField,
    valueQuery,
    defaultGroupName,
    currentURL,
}: {
    site: Site;
    filters: SQL<unknown> | undefined;
    groupField: keyof (typeof pageviews)["_"]["columns"];
    valueQuery?: SQL<number>;
    defaultGroupName?: string;
    currentURL: string;
}) {
    if (!valueQuery) {
        valueQuery = sql<number>`count(distinct ${pageviews.userSignature})`;
    }

    // for now, just get the last 30 days
    // get the date 30 days ago (at the start of the day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // get data
    const rawData = await db
        .select({
            name: pageviews[groupField],
            value: valueQuery,
        })
        .from(pageviews)
        .leftJoin(locations, eq(locations.id, pageviews.locationId))
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
                ne(pageviews[groupField], ""),
                filters ?? sql`1`,
            ),
        )
        .groupBy(({ name }) => name)
        .orderBy(desc(valueQuery))
        .limit(10)
        .execute();

    // format data
    const data = rawData.map(({ name, value }) => ({
        name: name?.toString() ?? defaultGroupName ?? "Unknown",
        value,
    }));

    return (
        <ClientBarVisual
            data={data}
            filterOption={groupFieldToChar(groupField)}
            currentURL={currentURL}
        />
    );
}

export async function BarListLocationVisual({
    site,
    filters,
    groupField,
    valueQuery,
    defaultGroupName,
    currentURL,
}: {
    site: Site;
    filters: SQL<unknown> | undefined;
    groupField: Exclude<keyof (typeof locations)["_"]["columns"], "id">;
    valueQuery?: SQL<number>;
    defaultGroupName?: string;
    currentURL: string;
}) {
    if (!valueQuery) {
        valueQuery = sql<number>`count(distinct ${pageviews.userSignature})`;
    }

    // for now, just get the last 30 days
    // get the date 30 days ago (at the start of the day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // get data
    const rawData = await db
        .select({
            name: locations[groupField],
            value: valueQuery,
        })
        .from(pageviews)
        .leftJoin(locations, eq(locations.id, pageviews.locationId))
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
                ne(locations[groupField], ""),
                filters ?? sql`1`,
            ),
        )
        .groupBy(({ name }) => name)
        .orderBy(desc(valueQuery))
        .limit(10)
        .execute();

    // format data
    const data = rawData.map(({ name, value }) => ({
        name: name?.toString() ?? defaultGroupName ?? "Unknown",
        value,
    }));

    return (
        <ClientBarVisual
            data={data}
            filterOption={groupFieldToChar(groupField)}
            currentURL={currentURL}
        />
    );
}

export async function MapVisual({
    site,
    filters,
    currentURL,
}: {
    site: Site;
    filters: SQL<unknown> | undefined;
    currentURL: string;
}) {
    // for now, just get the last 30 days
    // get the date 30 days ago (at the start of the day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    // get data
    const rawData = await db
        .select({
            country: locations.country,
            value: sql<number>`count(distinct ${pageviews.userSignature})`,
        })
        .from(pageviews)
        .leftJoin(locations, eq(locations.id, pageviews.locationId))
        .where(
            and(
                eq(pageviews.siteId, site.id),
                gte(pageviews.timestamp, startDate),
                filters ?? sql`1`,
            ),
        )
        .groupBy(({ country }) => country)
        .execute();

    // format data
    const data = rawData
        .filter(({ country }) => country !== null)
        .map(({ country, value }) => ({
            country: country?.toString() ?? "Unknown",
            value,
        }));

    return <WorldMap data={data} currentURL={currentURL} />;
}

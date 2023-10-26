import { verifySignatureEdge } from "@upstash/qstash/dist/nextjs";
import { eq, gte, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "~/env.mjs";
import { db } from "~/server/db";
import {
    browserStats,
    deviceTypeStats,
    locationStats,
    locations,
    pageStats,
    pageviews,
    referrerStats,
    siteStats,
} from "~/server/db/schema";

async function handler(_req: NextRequest) {
    // get the aggregated stats for page stats
    const aggPageResults = await db
        .select({
            site_id: pageviews.siteId,
            pathname: pageviews.pathname,
            pageviews: sql<number>`count(${pageviews.id})`,
            unique_pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
            avg_duration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:00:00')`,
        })
        .from(pageviews)
        .where(
            gte(
                pageviews.timestamp,
                // sql<string>`date_sub(now(), interval 1 hour)`,
                new Date(Date.now() - 1000 * 60 * 30),
            ),
        )
        .groupBy(({ site_id, ts, pathname }) => [site_id, ts, pathname])
        .execute();

    if (aggPageResults.length !== 0) {
        await db
            .insert(pageStats)
            .values(
                aggPageResults.map((row) => ({
                    siteId: row.site_id,
                    pathname: row.pathname,
                    pageviews: row.pageviews,
                    uniquePageviews: row.unique_pageviews,
                    avgDuration: row.avg_duration,
                    timestamp: new Date(row.ts),
                })),
            )
            .execute();
    }

    // get the aggregated stats for referrer stats
    const aggReferrerResults = await db
        .select({
            site_id: pageviews.siteId,
            pathname: pageviews.pathname,
            referrer_hostname: pageviews.referrerHostname,
            pageviews: sql<number>`count(${pageviews.id})`,
            unique_pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
            avg_duration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:00:00')`,
        })
        .from(pageviews)
        .where(
            gte(
                pageviews.timestamp,
                // sql<string>`date_sub(now(), interval 1 hour)`,
                new Date(Date.now() - 1000 * 60 * 30),
            ),
        )
        .groupBy(({ site_id, ts, pathname, referrer_hostname }) => [
            site_id,
            ts,
            pathname,
            referrer_hostname,
        ])
        .execute();

    if (aggReferrerResults.length !== 0) {
        await db
            .insert(referrerStats)
            .values(
                aggReferrerResults.map((row) => ({
                    siteId: row.site_id,
                    pathname: row.pathname,
                    referrerHostname: row.referrer_hostname,
                    pageviews: row.pageviews,
                    uniquePageviews: row.unique_pageviews,
                    avgDuration: row.avg_duration,
                    timestamp: new Date(row.ts),
                })),
            )
            .execute();
    }

    // get the aggregated stats for site stats
    const aggSiteResults = await db
        .select({
            site_id: pageviews.siteId,
            pageviews: sql<number>`count(${pageviews.id})`,
            unique_pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
            avg_duration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:00:00')`,
        })
        .from(pageviews)
        .where(
            gte(
                pageviews.timestamp,
                // sql<string>`date_sub(now(), interval 1 hour)`,
                new Date(Date.now() - 1000 * 60 * 30),
            ),
        )
        .groupBy(({ site_id, ts }) => [site_id, ts])
        .execute();

    if (aggSiteResults.length !== 0) {
        await db
            .insert(siteStats)
            .values(
                aggSiteResults.map((row) => ({
                    siteId: row.site_id,
                    pageviews: row.pageviews,
                    uniquePageviews: row.unique_pageviews,
                    avgDuration: row.avg_duration,
                    timestamp: new Date(row.ts),
                })),
            )
            .execute();
    }

    // get the aggregated stats for browser stats
    const aggBrowserResults = await db
        .select({
            site_id: pageviews.siteId,
            pathname: pageviews.pathname,
            browser_name: pageviews.browser,
            pageviews: sql<number>`count(${pageviews.id})`,
            unique_pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
            avg_duration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:00:00')`,
        })
        .from(pageviews)
        .where(
            gte(
                pageviews.timestamp,
                // sql<string>`date_sub(now(), interval 1 hour)`,
                new Date(Date.now() - 1000 * 60 * 30),
            ),
        )
        .groupBy(({ site_id, ts, pathname, browser_name }) => [
            site_id,
            ts,
            pathname,
            browser_name,
        ])
        .execute();

    if (aggBrowserResults.length !== 0) {
        await db
            .insert(browserStats)
            .values(
                aggBrowserResults.map((row) => ({
                    siteId: row.site_id,
                    pathname: row.pathname,
                    browserName: row.browser_name ?? "Unknown",
                    pageviews: row.pageviews,
                    uniquePageviews: row.unique_pageviews,
                    avgDuration: row.avg_duration,
                    timestamp: new Date(row.ts),
                })),
            )
            .execute();
    }

    // get the aggregated stats for device type stats
    const aggDeviceTypeResults = await db
        .select({
            site_id: pageviews.siteId,
            pathname: pageviews.pathname,
            os: pageviews.os,
            device_type: sql<string>`case 
                    when substring_index(substring_index(${pageviews.screenSize}, 'x', 2), 'x', -1) is null then 'Unknown'
                    when substring_index(substring_index(${pageviews.screenSize}, 'x', 2), 'x', -1) < 576 then 'Mobile'
                    when substring_index(substring_index(${pageviews.screenSize}, 'x', 2), 'x', -1) < 992 then 'Tablet'
                    else 'Desktop'
                end`,
            pageviews: sql<number>`count(${pageviews.id})`,
            unique_pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
            avg_duration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:00:00')`,
        })
        .from(pageviews)
        .where(
            gte(
                pageviews.timestamp,
                // sql<string>`date_sub(now(), interval 1 hour)`,
                new Date(Date.now() - 1000 * 60 * 30),
            ),
        )
        .groupBy(({ site_id, ts, pathname, os, device_type }) => [
            site_id,
            ts,
            pathname,
            os,
            device_type,
        ])
        .execute();

    if (aggDeviceTypeResults.length !== 0) {
        await db
            .insert(deviceTypeStats)
            .values(
                aggDeviceTypeResults.map((row) => ({
                    siteId: row.site_id,
                    pathname: row.pathname,
                    os: row.os ?? "Unknown",
                    deviceType: row.device_type,
                    pageviews: row.pageviews,
                    uniquePageviews: row.unique_pageviews,
                    avgDuration: row.avg_duration,
                    timestamp: new Date(row.ts),
                })),
            )
            .execute();
    }

    // get the aggregated stats for location stats
    const aggLocationResults = await db
        .select({
            site_id: pageviews.siteId,
            pathname: pageviews.pathname,
            country: locations.country,
            region: locations.region,
            city: locations.city,
            location_id: locations.id,
            pageviews: sql<number>`count(${pageviews.id})`,
            unique_pageviews: sql<number>`count(distinct ${pageviews.userSignature})`,
            avg_duration: sql<number>`round(avg(${pageviews.duration}))`,
            ts: sql<string>`date_format(convert_tz(${pageviews.timestamp}, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:00:00')`,
        })
        .from(pageviews)
        .leftJoin(locations, eq(pageviews.locationId, locations.id))
        .where(
            gte(
                pageviews.timestamp,
                // sql<string>`date_sub(now(), interval 1 hour)`,
                new Date(Date.now() - 1000 * 60 * 30),
            ),
        )
        .groupBy(({ site_id, ts, pathname, location_id }) => [
            site_id,
            ts,
            pathname,
            location_id,
        ])
        .execute();

    if (aggLocationResults.length !== 0) {
        await db
            .insert(locationStats)
            .values(
                aggLocationResults.map((row) => ({
                    siteId: row.site_id,
                    pathname: row.pathname,
                    country: row.country,
                    region: row.region,
                    city: row.city,
                    pageviews: row.pageviews,
                    uniquePageviews: row.unique_pageviews,
                    avgDuration: row.avg_duration,
                    timestamp: new Date(row.ts),
                })),
            )
            .execute();
    }

    return NextResponse.json({
        pageStats: aggPageResults,
        referrerStats: aggReferrerResults,
        siteStats: aggSiteResults,
        browserStats: aggBrowserResults,
        deviceTypeStats: aggDeviceTypeResults,
        locationStats: aggLocationResults,
    });
}

export const POST = verifySignatureEdge(handler, {
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
});

export const runtime = "edge";

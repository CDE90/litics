import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { locations, pageviews, sites } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";

async function hash(str: string) {
    const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(str),
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}

function getBrowser(userAgent: string | null) {
    if (!userAgent) return "Unknown";

    const ua = userAgent.toLowerCase();
    if (ua.includes("yabrowser")) return "Yandex";
    if (ua.includes("samsungbrowser")) return "Samsung";
    if (ua.includes("ucbrowser")) return "UC Browser";
    if (ua.includes("opr")) return "Opera";
    if (ua.includes("opera") && !ua.includes("opr")) {
        return ua.includes("version") ? "Opera" : "Opera Mini";
    }
    if (ua.includes("edge"))
        return ua.includes("edg") ? "Microsoft Edge" : "Microsoft Legacy Edge";
    if (ua.includes("msie") || ua.includes("trident/"))
        return "Microsoft Internet Explorer";
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("safari"))
        return ua.includes("chrome") ? "Chrome" : "Safari";
    if (ua.includes("firefox")) return "Firefox";

    // Additional browsers could be added based on their specific user agent identifiers.

    return "Unknown";
}

function getOS(userAgent: string | null) {
    if (!userAgent) return "Unknown";

    const ua = userAgent.toLowerCase();
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("android")) return "Android";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
        return "iOS";
    if (ua.includes("mac") || ua.includes("darwin")) return "Mac OS";
    return "Unknown";
}

const props = {
    site: z.object({
        hostname: z.string(),
        pathname: z.string(),
    }),
    referrer: z.object({
        hostname: z.string().nullable(),
        pathname: z.string().nullable(),
    }),
    screenSize: z.string(),
    inactiveTime: z.number().gte(0).lte(30),
};

const typeEnum = z.enum(["load", "ping", "exit"]);

const loadRequestSchema = z.object({
    type: z.literal(typeEnum.enum.load),
    site: props.site,
    referrer: props.referrer,
    screenSize: props.screenSize,
});

const pingRequestSchema = z.object({
    type: z.literal(typeEnum.enum.ping),
    site: props.site,
    inactiveTime: props.inactiveTime,
});

const exitRequestSchema = z.object({
    type: z.literal(typeEnum.enum.exit),
    site: props.site,
    inactiveTime: props.inactiveTime,
});

const requestSchema = z.discriminatedUnion("type", [
    loadRequestSchema,
    pingRequestSchema,
    exitRequestSchema,
]);

export async function POST(request: NextRequest) {
    const res = requestSchema.safeParse(await request.json());

    if (!res.success) {
        return NextResponse.json({ success: false, error: res.error });
    }

    const data = res.data;

    const timestamp = new Date();

    const userAgent = request.headers.get("user-agent");

    const location = request.geo;
    const region = location?.region;
    const country = location?.country;
    const city = location?.city;

    const ip = request.ip;

    const userSignature = await hash(
        JSON.stringify({
            ip: ip,
            userAgent,
            hostname: data.site.hostname,
        }),
    );

    // get site
    const site = await db.query.sites.findFirst({
        where: eq(sites.url, data.site.hostname),
        columns: { id: true },
    });

    if (!site) {
        return NextResponse.json(
            {
                success: false,
                error: "Site not found",
            },
            { status: 404 },
        );
    }

    const pageview = await db.query.pageviews.findFirst({
        where: and(
            eq(
                pageviews.pageviewHash,
                sql`unhex(md5(concat_ws(
                    "|",
                    ${site.id},
                    ${userSignature},
                    ${data.site.pathname},
                    ${data.type === "exit" ? 1 : 0}
                )))`,
            ),
            gte(pageviews.timestamp, new Date(Date.now() - 1000 * 60 * 30)), // 30 minutes
        ),
        orderBy: desc(pageviews.timestamp),
        columns: {
            id: true,
            timestamp: true,
        },
    });

    if (pageview) {
        let duration = Math.floor(
            (timestamp.getTime() - pageview.timestamp.getTime()) / 1000,
        );

        if (
            (data.type === "ping" || data.type === "exit") &&
            duration >= data.inactiveTime
        ) {
            duration -= data.inactiveTime;
            if (duration < 0) duration = 0;
        }

        await db
            .update(pageviews)
            .set({
                duration,
                hasExited: data.type === "exit",
            })
            .where(eq(pageviews.id, pageview.id))
            .execute();
    } else {
        const id = createId();

        let referrerHostname = null;
        let referrerPathname = null;
        let screenSize = null;
        let locationId: string | null = null;

        if (data.type === "load") {
            referrerHostname = data.referrer.hostname;
            referrerPathname = data.referrer.pathname;
            screenSize = data.screenSize;
        }

        if (
            region !== undefined ||
            country !== undefined ||
            city !== undefined
        ) {
            const locationFilters = [];
            if (region) {
                locationFilters.push(eq(locations.region, region));
            }
            if (country) {
                locationFilters.push(eq(locations.country, country));
            }
            if (city) {
                locationFilters.push(eq(locations.city, city));
            }

            const location = await db.query.locations.findFirst({
                where: and(...locationFilters),
                columns: { id: true },
            });

            locationId = location?.id ?? createId();

            if (!location) {
                await db
                    .insert(locations)
                    .values({
                        id: locationId,
                        region,
                        country,
                        city,
                    })
                    .execute();
            }
        }

        await db
            .insert(pageviews)
            .values({
                id,
                siteId: site.id,
                hostname: data.site.hostname,
                pathname: data.site.pathname,
                referrerHostname: referrerHostname,
                referrerPathname: referrerPathname,
                screenSize: screenSize,
                browser: getBrowser(userAgent),
                os: getOS(userAgent),
                duration: 0,
                timestamp: timestamp,
                userSignature,
                hasExited: data.type === "exit",
                locationId,
            })
            .execute();
    }

    return NextResponse.json({
        success: true,
    });
}

export const runtime = "edge";

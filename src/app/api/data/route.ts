import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { eq, and, desc, gte } from "drizzle-orm";
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
    // return createHash("sha256").update(str).digest("hex");
}

function getBrowser(userAgent: string | null) {
    if (!userAgent) return "Unknown";

    const ua = userAgent.toLowerCase();
    if (ua.includes("edg/")) return "Edge";
    if (ua.includes("trident/")) return "Internet Explorer";
    if (ua.includes("firefox/")) return "Firefox";
    if (ua.includes("chrome/")) return "Chrome";
    if (ua.includes("safari/")) return "Safari";
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
    timestamp: z.string(),
    screenSize: z.string(),
};

const typeEnum = z.enum(["load", "ping", "exit"]);

const loadRequestSchema = z.object({
    type: z.literal(typeEnum.enum.load),
    ...props,
});

const pingRequestSchema = z.object({
    type: z.literal(typeEnum.enum.ping),
    site: props.site,
    timestamp: props.timestamp,
});

const exitRequestSchema = z.object({
    type: z.literal(typeEnum.enum.exit),
    site: props.site,
    timestamp: props.timestamp,
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
            eq(pageviews.userSignature, userSignature),
            eq(pageviews.hostname, data.site.hostname),
            eq(pageviews.pathname, data.site.pathname),
            eq(pageviews.hasExited, false),
            gte(pageviews.timestamp, new Date(Date.now() - 1000 * 60 * 30)), // 30 minutes
        ),
        orderBy: desc(pageviews.timestamp),
    });

    if (pageview) {
        const duration = Math.floor(
            (new Date(data.timestamp).getTime() -
                pageview.timestamp.getTime()) /
                1000,
        );

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

        const timestamp = new Date(data.timestamp);

        let referrerHostname = null;
        let referrerPathname = null;
        let screenSize = null;

        if (data.type === "load") {
            referrerHostname = data.referrer.hostname;
            referrerPathname = data.referrer.pathname;
            screenSize = data.screenSize;
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
                os: "Unknown",
                duration: 0,
                timestamp: timestamp,
                userSignature,
                hasExited: data.type === "exit",
            })
            .execute();

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

            const location = await db.query.locations
                .findFirst({
                    where: and(...locationFilters),
                })
                .execute();

            if (location) {
                await db
                    .update(pageviews)
                    .set({
                        locationId: location.id,
                    })
                    .where(eq(pageviews.id, id))
                    .execute();
            } else {
                await db
                    .insert(locations)
                    .values({
                        id: createId(),
                        region,
                        country,
                        city,
                    })
                    .execute();
            }
        }
    }

    return NextResponse.json({
        success: true,
    });
}

export const runtime = "edge";

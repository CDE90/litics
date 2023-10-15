import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { db } from "~/server/db";
import { eq, and, desc, gte } from "drizzle-orm";
import { locations, pageviews, sites } from "~/server/db/schema";
import { createId } from "@paralleldrive/cuid2";

function hash(str: string) {
    return createHash("sha256").update(str).digest("hex");
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

const requestSchema = z.object({
    site: z.object({
        hostname: z.string(),
        pathname: z.string(),
    }),
    referrer: z.object({
        hostname: z.string(),
        pathname: z.string(),
    }),
    duration: z.number(),
    timestamp: z.string(),
    screenSize: z.string(),
});

export async function POST(request: NextRequest) {
    const res = requestSchema.safeParse(await request.json());

    console.log(res);

    if (!res.success) {
        console.log(res.error);
    }

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

    console.log(data);

    const userSignature = hash(
        JSON.stringify({
            ip: ip,
            userAgent,
            hostname: data.site.hostname,
        })
    );

    // get site
    let site = await db.query.sites.findFirst({
        where: eq(sites.url, data.site.hostname),
    });

    if (!site) {
        // return NextResponse.json({
        //     success: false,
        //     error: "Site not found",
        // });

        // for now, create the site
        await db
            .insert(sites)
            .values({
                id: createId(),
                name: data.site.hostname,
                url: data.site.hostname,
            })
            .execute();

        // get site
        site = await db.query.sites.findFirst({
            where: eq(sites.url, data.site.hostname),
        });

        if (!site) {
            return NextResponse.json({
                success: false,
                error: "Site not found",
            });
        }
    }

    const pageview = await db.query.pageviews.findFirst({
        where: and(
            eq(pageviews.userSignature, userSignature),
            eq(pageviews.hostname, data.site.hostname),
            eq(pageviews.pathname, data.site.pathname),
            gte(pageviews.timestamp, new Date(Date.now() - 1000 * 60 * 30))
        ),
        orderBy: desc(pageviews.timestamp),
    });

    if (pageview) {
        await db
            .update(pageviews)
            .set({
                duration: pageview.duration + data.duration,
            })
            .where(eq(pageviews.id, pageview.id))
            .execute();
    } else {
        const id = createId();

        const timestamp = new Date(data.timestamp);

        await db
            .insert(pageviews)
            .values({
                id,
                siteId: site.id,
                hostname: data.site.hostname,
                pathname: data.site.pathname,
                referrerHostname: data.referrer.hostname,
                referrerPathname: data.referrer.pathname,
                screenSize: data.screenSize,
                browser: getBrowser(userAgent),
                os: "Unknown",
                duration: data.duration,
                timestamp: timestamp,
                userSignature,
            })
            .execute();

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

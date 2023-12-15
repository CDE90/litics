import { Grid, Card, Col, Text } from "@tremor/react";
import { Suspense } from "react";
import {
    DurationGraph,
    BarListVisual,
    VisitorGraph,
    BarListLocationVisual,
    MapVisual,
} from "~/app/_components/visuals/server-visuals";
import { Tabs } from "~/app/_components/visuals/tabs";
import { and, or, eq, ne } from "drizzle-orm";
import { pageviews, locations, sites } from "~/server/db/schema";
import { getBaseUrl } from "~/trpc/shared";
import { db } from "~/server/db";
import DateSelector from "~/app/_components/date-selector";

function fieldNameToField(
    fieldName:
        | "referrerHostname"
        | "pathname"
        | "country"
        | "region"
        | "city"
        | "browser"
        | "os"
        | "screenSize",
) {
    // if it is a location field, use the locations table
    if (
        fieldName === "country" ||
        fieldName === "region" ||
        fieldName === "city"
    ) {
        return locations[fieldName];
    } else {
        return pageviews[fieldName];
    }
}

function searchParamsToFilters(
    searchParams: Record<string, string | string[]>,
) {
    const filters = [];

    const filterFields = {
        r: "referrerHostname",
        p: "pathname",
        c: "country",
        R: "region",
        C: "city",
        b: "browser",
        o: "os",
        s: "screenSize",
    } as const;

    for (const [key, value] of Object.entries(filterFields)) {
        if (key in searchParams) {
            let filterString = searchParams[key]!;

            if (
                typeof filterString === "string" &&
                filterString.includes(",")
            ) {
                filterString = filterString.split(",");
            }

            if (Array.isArray(filterString)) {
                if (filterString.length === 0) continue;
                if (filterString.length === 1) {
                    filters.push(
                        filterString[0]!.startsWith("!")
                            ? ne(
                                  fieldNameToField(value),
                                  filterString[0]!.slice(1),
                              )
                            : eq(fieldNameToField(value), filterString[0]!),
                    );

                    continue;
                }

                filters.push(
                    or(
                        ...filterString.map((filter) => {
                            return filter.startsWith("!")
                                ? ne(fieldNameToField(value), filter.slice(1))
                                : eq(fieldNameToField(value), filter);
                        }),
                    ),
                );
            } else {
                filters.push(
                    filterString.startsWith("!")
                        ? ne(fieldNameToField(value), filterString.slice(1))
                        : eq(fieldNameToField(value), filterString),
                );
            }
        }
    }

    if (filters.length === 0) return undefined;
    if (filters.length === 1) return filters[0];
    return and(...filters);
}

export default async function DashboardPage({
    params,
    searchParams,
}: {
    params: { url: string };
    searchParams: Record<string, string | string[]>;
}) {
    const site = await db.query.sites.findFirst({
        where: eq(sites.url, params.url),
    });

    if (!site) {
        return <div>Site not found</div>;
        // SHOULD PUSH TO CREATE SITE PAGE OR SOMTHING
    }

    const baseUrl = getBaseUrl();

    const filters = searchParamsToFilters(searchParams);

    // @ts-expect-error this is fine
    const searchParamsCopy = new URLSearchParams(searchParams);
    searchParamsCopy.delete("url");
    const currentURL = `${baseUrl}/dashboard/${
        site.url
    }?${searchParamsCopy.toString()}`;

    return (
        <div>
            <h1 className="text-4xl font-bold">Dashboard - {site.name}</h1>
            <DateSelector baseUrl={baseUrl} className="my-4" />
            <Grid className="my-4 gap-4" numItems={1} numItemsLg={2}>
                <Col numColSpan={1} numColSpanLg={2}>
                    <Card className="h-full">
                        <Tabs
                            title="Visitors"
                            tabs={[
                                {
                                    title: "Visitors",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <VisitorGraph
                                                site={site}
                                                filters={filters}
                                            />
                                        </Suspense>
                                    ),
                                },
                                {
                                    title: "Duration",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <DurationGraph
                                                site={site}
                                                filters={filters}
                                            />
                                        </Suspense>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Text className="text-2xl font-bold">
                            Top Referrers
                        </Text>
                        <Suspense fallback={<div>Loading...</div>}>
                            <BarListVisual
                                site={site}
                                filters={filters}
                                groupField="referrerHostname"
                                defaultGroupName="Direct / None"
                                currentURL={currentURL}
                            />
                        </Suspense>
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Text className="text-2xl font-bold">Top Pages</Text>
                        <Suspense fallback={<div>Loading...</div>}>
                            <BarListVisual
                                site={site}
                                filters={filters}
                                groupField="pathname"
                                currentURL={currentURL}
                            />
                        </Suspense>
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Tabs
                            title="Locations"
                            tabs={[
                                {
                                    title: "Map",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <MapVisual
                                                site={site}
                                                filters={filters}
                                                currentURL={currentURL}
                                            />
                                        </Suspense>
                                    ),
                                },
                                {
                                    title: "Countries",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <BarListLocationVisual
                                                site={site}
                                                filters={filters}
                                                groupField="country"
                                                currentURL={currentURL}
                                            />
                                        </Suspense>
                                    ),
                                },
                                {
                                    title: "Regions",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <BarListLocationVisual
                                                site={site}
                                                filters={filters}
                                                groupField="region"
                                                currentURL={currentURL}
                                            />
                                        </Suspense>
                                    ),
                                },
                                {
                                    title: "Cities",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <BarListLocationVisual
                                                site={site}
                                                filters={filters}
                                                groupField="city"
                                                currentURL={currentURL}
                                            />
                                        </Suspense>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Tabs
                            title="Devices"
                            tabs={[
                                {
                                    title: "Browser",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <BarListVisual
                                                site={site}
                                                filters={filters}
                                                groupField="browser"
                                                currentURL={currentURL}
                                            />
                                        </Suspense>
                                    ),
                                },
                                {
                                    title: "OS",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <BarListVisual
                                                site={site}
                                                filters={filters}
                                                groupField="os"
                                                currentURL={currentURL}
                                            />
                                        </Suspense>
                                    ),
                                },
                                {
                                    title: "Size",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <BarListVisual
                                                site={site}
                                                filters={filters}
                                                groupField="screenSize"
                                                currentURL={currentURL}
                                            />
                                        </Suspense>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </Col>
            </Grid>
        </div>
    );
}

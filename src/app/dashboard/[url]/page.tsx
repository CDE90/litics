import { Grid, Card, Col, Text } from "@tremor/react";
import { Suspense } from "react";
import {
    DurationGraph,
    BarListVisual,
    VisitorGraph,
    BarListLocationVisual,
    MapVisual,
} from "~/app/_components/visuals/server-visuals";
import { api } from "~/trpc/server";
import { Tabs } from "~/app/_components/visuals/tabs";
import { and, or, eq, ne } from "drizzle-orm";
import { pageviews, locations } from "~/server/db/schema";

/*
The search params should be checked to match one of the following:
referrer: r
page: p
country: c
region: R
city: C
browser: b
os: o
size: s

if there are multiple of the same param, they should be combined with OR
if there are multiple different params, they should be combined with AND
if the value is prefixed with a !, it should be negated
*/

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
                            ? ne(fieldNameToField(value), filterString[0]!)
                            : eq(fieldNameToField(value), filterString[0]!),
                    );

                    continue;
                }

                filters.push(
                    or(
                        ...filterString.map((filter) => {
                            return filter.startsWith("!")
                                ? ne(fieldNameToField(value), filter)
                                : eq(fieldNameToField(value), filter);
                        }),
                    ),
                );
            } else {
                filters.push(
                    filterString.startsWith("!")
                        ? ne(fieldNameToField(value), filterString)
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
    const site = await api.site.getSite.query({ url: params.url });

    if (!site) {
        return <div>Site not found</div>;
        // SHOULD PUSH TO CREATE SITE PAGE OR SOMTHING
    }

    console.log(searchParams);

    // at some point, add filter handling here. Get filters from URL params

    const filters = searchParamsToFilters(searchParams);

    return (
        <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p>{JSON.stringify(searchParams, null, 2)}</p>
            <Grid className="mt-4 gap-4" numItems={1} numItemsLg={2}>
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

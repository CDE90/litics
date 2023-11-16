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

export default async function DashboardPage({
    params,
}: {
    params: { url: string };
}) {
    const site = await api.site.getSite.query({ url: params.url });

    if (!site) {
        return <div>Site not found</div>;
        // SHOULD PUSH TO CREATE SITE PAGE OR SOMTHING
    }

    // at some point, add filter handling here. Get filters from URL params

    return (
        <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
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
                                            <VisitorGraph site={site} />
                                        </Suspense>
                                    ),
                                },
                                {
                                    title: "Duration",
                                    component: (
                                        <Suspense
                                            fallback={<div>Loading...</div>}
                                        >
                                            <DurationGraph site={site} />
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
                            <BarListVisual site={site} groupField="pathname" />
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
                                            <MapVisual site={site} />
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

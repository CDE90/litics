import { Grid, Card, Col, Text, Metric } from "@tremor/react";
import { Suspense } from "react";
import VisitorGraph from "~/app/_components/visuals/visitors-graph";
import { api } from "~/trpc/server";

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
                        <Text className="text-2xl font-bold">Visitors</Text>
                        <Suspense fallback={<div>Loading...</div>}>
                            <VisitorGraph site={site} />
                        </Suspense>
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Text className="text-2xl font-bold">
                            Top Referrers
                        </Text>
                        <Metric className="text-2xl font-bold">2</Metric>
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Text className="text-2xl font-bold">Top Pages</Text>
                        <Metric className="text-2xl font-bold">3</Metric>
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Text className="text-2xl font-bold">Locations</Text>
                        <Metric className="text-2xl font-bold">4</Metric>
                    </Card>
                </Col>
                <Col>
                    <Card className="h-full">
                        <Text className="text-2xl font-bold">Devices</Text>
                        <Metric className="text-2xl font-bold">5</Metric>
                    </Card>
                </Col>
            </Grid>
        </div>
    );
}

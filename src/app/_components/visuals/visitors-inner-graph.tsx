"use client";

import { AreaChart } from "@tremor/react";

export default function InnerGraph({
    data,
}: {
    data: {
        date: string;
        Pageviews: number;
        "Unique Pageviews": number;
        Duration: number;
    }[];
}) {
    return (
        <>
            <AreaChart
                className="mt-4 h-72"
                data={data}
                index="date"
                categories={["Pageviews", "Unique Pageviews", "Duration"]}
                curveType="monotone"
                onValueChange={(_) => null}
            />
        </>
    );
}

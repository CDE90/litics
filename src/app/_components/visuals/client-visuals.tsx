"use client";

import { AreaChart, BarList, type BarListProps } from "@tremor/react";

export function ClientVisitorGraph({
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
                className="mt-4 h-96"
                data={data}
                index="date"
                categories={["Pageviews", "Unique Pageviews", "Duration"]}
                curveType="monotone"
                onValueChange={(_) => null}
            />
        </>
    );
}

export function ClientBarVisual({ data }: { data: BarListProps["data"] }) {
    return (
        <>
            <BarList data={data} className="mt-4" />
        </>
    );
}

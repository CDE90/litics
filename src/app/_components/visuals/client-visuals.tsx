"use client";

import { AreaChart, BarList, type BarListProps } from "@tremor/react";

const durationFormatter = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;

    return `${minutes}m ${seconds}s`;
};

const numberFormatter = (value: number) => {
    if (value > 1e6) {
        return `${Math.round(value / 1e5) / 10}m`;
    } else if (value > 1e3) {
        return `${Math.round(value / 100) / 10}k`;
    } else {
        return value.toString();
    }
};

export function AreaGraph({
    data,
    categories,
    formatter,
}: {
    data: {
        date: string;
        data: Record<string, number>;
    }[];
    categories: string[];
    formatter?: "duration" | "number";
}) {
    const newData = data.map((d) => {
        const newData: Record<string, number | string> = { date: d.date };
        categories.forEach((cat) => {
            newData[cat] = d.data[cat] ?? 0;
        });
        return newData;
    });

    return (
        <>
            <AreaChart
                className="mt-4 h-96"
                data={newData}
                index="date"
                categories={categories}
                curveType="monotone"
                onValueChange={(_) => null}
                maxValue={
                    Math.max(
                        ...data.map((d) => Math.max(...Object.values(d.data))),
                    ) || 0
                }
                valueFormatter={
                    formatter === "number"
                        ? numberFormatter
                        : formatter === "duration"
                          ? durationFormatter
                          : undefined
                }
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

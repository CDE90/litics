"use client";

import { AreaChart, BarList, type BarListProps } from "@tremor/react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useState } from "react";

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
            <BarList data={data} className="mt-4 h-[432px]" />
        </>
    );
}

export function WorldMap({
    data,
}: {
    data: { country: string; value: number }[];
}) {
    const [tooltip, setTooltip] = useState<{
        country: string;
        value: number;
        x: number;
        y: number;
    } | null>(null);

    const colourScale = scaleLinear()
        .domain([0, Math.max(...data.map((d) => d.value))])
        // @ts-expect-error doesn't like the type of the range
        .range(["#ffffff", "#3b82f6"]);

    return (
        <div className="mt-4 flex h-[432px] flex-col justify-center">
            <ComposableMap
                className="h-auto max-h-[432px] w-full"
                projection="geoMercator"
                projectionConfig={{
                    rotate: [0, 0, 0],
                    scale: 120,
                    center: [0, 45],
                }}
                width={800}
                height={500}
            >
                <Geographies geography="/countries.json">
                    {({
                        geographies,
                    }: {
                        geographies: {
                            properties: { iso_a2: string; admin: string };
                            rsmKey: string;
                        }[];
                    }) =>
                        geographies.map((geo) => {
                            const d = data.find(
                                (s) => s.country === geo.properties.iso_a2,
                            );
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={
                                        d
                                            ? colourScale(d.value).toString()
                                            : "#ffffff"
                                    }
                                    stroke="#111827"
                                    className="hover:cursor-pointer hover:opacity-75 focus:outline-none"
                                    onMouseEnter={(evt) => {
                                        const mapRect =
                                            evt.currentTarget.parentElement?.parentElement?.getBoundingClientRect() ?? {
                                                left: 0,
                                                top: 0,
                                            };
                                        const offsetX =
                                            evt.clientX - mapRect.left;
                                        const offsetY =
                                            evt.clientY - mapRect.top;

                                        setTooltip({
                                            country: geo.properties.admin,
                                            value: d?.value ?? 0,
                                            x: offsetX,
                                            y: offsetY,
                                        });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
            {tooltip && (
                <div
                    className="absolute rounded-md bg-gray-800 p-2 shadow-md transition-all"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div>{tooltip.country}</div>
                    <div>{tooltip.value} Visitors</div>
                </div>
            )}
        </div>
    );
}

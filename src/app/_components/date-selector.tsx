"use client";

import { DateRangePicker } from "@tremor/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function DateSelector({
    baseUrl,
    className,
}: {
    baseUrl: string;
    className?: string;
}) {
    const params = useParams();
    const selectedUrl = params.url as string;

    const searchParams = useSearchParams();

    const router = useRouter();

    // get the start date and end date if present in search params
    // they will be stored as f and t respectively
    const startDate = searchParams.get("f")
        ? new Date(searchParams.get("f") ?? "")
        : new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    const endDate = searchParams.get("t")
        ? new Date(searchParams.get("t") ?? "")
        : new Date();
    endDate.setHours(23, 59, 59, 999);

    return (
        <DateRangePicker
            className={className}
            onValueChange={(value) => {
                const url = new URL(
                    `${baseUrl}/dashboard/${selectedUrl}?${searchParams.toString()}`,
                );
                value.from?.setHours(0, 0, 0, 0);
                value.to?.setHours(23, 59, 59, 999);

                if (value.from) {
                    url.searchParams.set("f", value.from.toISOString());
                } else {
                    url.searchParams.delete("f");
                }
                if (value.to) {
                    url.searchParams.set("t", value.to.toISOString());
                } else {
                    url.searchParams.delete("t");
                }

                router.push(url.toString());
            }}
            enableClear={false}
            defaultValue={{
                from: startDate,
                to: endDate,
            }}
        />
    );
}

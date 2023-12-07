"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import SiteDropdown from "../../_components/site-selector";
import { api } from "~/trpc/react";
import { useParams, useSearchParams } from "next/navigation";
import { getBaseUrl } from "~/trpc/shared";

const filterMap = {
    r: "Referrer",
    p: "Page",
    c: "Country",
    R: "Region",
    C: "City",
    b: "Browser",
    o: "OS",
    s: "Screen Size",
} as const;

function filterLetterToString(letter: string) {
    if (!Object.keys(filterMap).includes(letter)) return null;

    return filterMap[letter as keyof typeof filterMap];
}

export default function DashboardSidebar({
    username,
    userIcon,
}: {
    username: string | null | undefined;
    userIcon: string | null | undefined;
}) {
    const baseUrl = getBaseUrl();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const sites = api.site.getSites.useQuery();

    const params = useParams();
    const selectedUrl = params.url as string;

    const searchParams = useSearchParams();
    const [niceSearchParams, setNiceSearchParams] = useState<
        Record<string, string>[]
    >([]);

    useEffect(() => {
        setNiceSearchParams([]);

        for (const key of Object.keys(filterMap)) {
            if (searchParams.has(key)) {
                if (Array.isArray(searchParams.getAll(key))) {
                    setNiceSearchParams((prev) => [
                        ...prev,
                        ...searchParams
                            .getAll(key)
                            .map((value) => ({ [key]: value })),
                    ]);
                } else {
                    setNiceSearchParams((prev) => [
                        ...prev,
                        { [key]: searchParams.get(key) ?? "" },
                    ]);
                }
            }
        }
    }, [searchParams]);

    return (
        <>
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50 lg:hidden"
                    onClose={setSidebarOpen}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/80" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button
                                            type="button"
                                            className="-m-2.5 rounded-2xl border-2 border-neutral-400 bg-neutral-900/50 p-2.5"
                                            onClick={() =>
                                                setSidebarOpen(false)
                                            }
                                        >
                                            <span className="sr-only">
                                                Close sidebar
                                            </span>
                                            <XMarkIcon
                                                className="h-6 w-6 text-white"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                </Transition.Child>
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-neutral-900 pb-2">
                                    <div className="w-full border-b border-neutral-700 px-4 py-4">
                                        <SiteDropdown
                                            sites={sites.data ?? []}
                                            selectedURL={selectedUrl}
                                        />
                                    </div>
                                    <nav className="mt-2 flex flex-1 flex-col px-6">
                                        <ul
                                            role="list"
                                            className="flex flex-1 flex-col gap-y-7"
                                        >
                                            <li>
                                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                                    Filters
                                                </div>
                                                <ul
                                                    role="list"
                                                    className="-mx-2 space-y-1"
                                                >
                                                    {niceSearchParams.map(
                                                        (item) => {
                                                            const key =
                                                                Object.keys(
                                                                    item,
                                                                )[0]!;
                                                            const value =
                                                                Object.values(
                                                                    item,
                                                                )[0]!;

                                                            if (key === "url")
                                                                return null;

                                                            const filter =
                                                                filterLetterToString(
                                                                    key,
                                                                );

                                                            if (!filter)
                                                                return null;

                                                            return (
                                                                <li
                                                                    key={
                                                                        key +
                                                                        " = " +
                                                                        value
                                                                    }
                                                                >
                                                                    <div className="group grid w-full grid-cols-7 rounded-md bg-neutral-800 p-2 text-sm leading-6 transition-all hover:bg-neutral-50 hover:text-neutral-700">
                                                                        <span className="col-span-6 shrink-0 break-all group-hover:text-neutral-700">
                                                                            {filter +
                                                                                (value.startsWith(
                                                                                    "!",
                                                                                )
                                                                                    ? " is not "
                                                                                    : " is ") +
                                                                                value.replace(
                                                                                    "!",
                                                                                    "",
                                                                                )}
                                                                        </span>
                                                                        <Link
                                                                            className="min-w-6 min-h-6 my-auto ml-auto h-6 w-6 text-white group-hover:text-neutral-700"
                                                                            href={`${baseUrl}/dashboard/${selectedUrl}?${new URLSearchParams(
                                                                                searchParams,
                                                                            )
                                                                                .toString()
                                                                                .replaceAll(
                                                                                    key +
                                                                                        "=" +
                                                                                        value,
                                                                                    "",
                                                                                )
                                                                                .replaceAll(
                                                                                    key +
                                                                                        "=%21" +
                                                                                        value.slice(
                                                                                            1,
                                                                                        ),
                                                                                    "",
                                                                                )
                                                                                .replaceAll(
                                                                                    key +
                                                                                        "=" +
                                                                                        encodeURIComponent(
                                                                                            value,
                                                                                        ),
                                                                                    "",
                                                                                )
                                                                                .replaceAll(
                                                                                    key +
                                                                                        "=%21" +
                                                                                        encodeURIComponent(
                                                                                            value,
                                                                                        ).slice(
                                                                                            1,
                                                                                        ),
                                                                                    "",
                                                                                )
                                                                                .replaceAll(
                                                                                    "&&",
                                                                                    "&",
                                                                                )}`}
                                                                        >
                                                                            <XMarkIcon />
                                                                        </Link>
                                                                    </div>
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                </ul>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="sticky top-16 hidden h-[calc(100vh-64px)] lg:z-30 lg:flex lg:w-72 lg:flex-col">
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-2 overflow-y-auto bg-neutral-900">
                    <div className="w-full border-b border-neutral-700 px-4 py-4">
                        <SiteDropdown
                            sites={sites.data ?? []}
                            selectedURL={selectedUrl}
                        />
                    </div>
                    <nav className="mt-2 flex flex-1 flex-col px-6">
                        <ul
                            role="list"
                            className="flex flex-1 flex-col gap-y-7"
                        >
                            <li>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                    Filters
                                </div>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {niceSearchParams.map((item) => {
                                        const key = Object.keys(item)[0]!;
                                        const value = Object.values(item)[0]!;

                                        if (key === "url") return null;

                                        const filter =
                                            filterLetterToString(key);

                                        if (!filter) return null;

                                        return (
                                            <li key={key + " = " + value}>
                                                <div className="group grid w-full grid-cols-7 rounded-md bg-neutral-800 p-2 text-sm leading-6 transition-all hover:bg-neutral-50 hover:text-neutral-700">
                                                    <span className="col-span-6 shrink-0 break-all group-hover:text-neutral-700">
                                                        {filter +
                                                            (value.startsWith(
                                                                "!",
                                                            )
                                                                ? " is not "
                                                                : " is ") +
                                                            value.replace(
                                                                "!",
                                                                "",
                                                            )}
                                                    </span>
                                                    <Link
                                                        className="min-w-6 min-h-6 my-auto ml-auto h-6 w-6 text-white group-hover:text-neutral-700"
                                                        href={`${baseUrl}/dashboard/${selectedUrl}?${new URLSearchParams(
                                                            searchParams,
                                                        )
                                                            .toString()
                                                            .replaceAll(
                                                                key +
                                                                    "=" +
                                                                    value,
                                                                "",
                                                            )
                                                            .replaceAll(
                                                                key +
                                                                    "=%21" +
                                                                    value.slice(
                                                                        1,
                                                                    ),
                                                                "",
                                                            )
                                                            .replaceAll(
                                                                key +
                                                                    "=" +
                                                                    encodeURIComponent(
                                                                        value,
                                                                    ),
                                                                "",
                                                            )
                                                            .replaceAll(
                                                                key +
                                                                    "=%21" +
                                                                    encodeURIComponent(
                                                                        value,
                                                                    ).slice(1),
                                                                "",
                                                            )
                                                            .replaceAll(
                                                                "&&",
                                                                "&",
                                                            )}`}
                                                    >
                                                        <XMarkIcon />
                                                    </Link>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                            <li className="-mx-6 mt-auto">
                                <Link
                                    href="#"
                                    className="flex items-center gap-x-4 border-t border-neutral-700 px-6 py-3 text-sm font-semibold leading-6 text-neutral-200 hover:bg-neutral-800"
                                >
                                    <Image
                                        className="h-8 w-8 rounded-full"
                                        src={userIcon ?? "/logo.svg"}
                                        alt="User icon"
                                        width={32}
                                        height={32}
                                    />
                                    <span aria-hidden="true">{username}</span>
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="sticky top-16 z-50 flex h-[calc(100vh-64px)] flex-col p-4 sm:p-6 lg:hidden">
                <button
                    type="button"
                    className="-m-2.5 rounded-2xl border-2 border-neutral-400 bg-neutral-900/50 p-2.5 lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <span className="sr-only">Open sidebar</span>
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
            </div>
        </>
    );
}

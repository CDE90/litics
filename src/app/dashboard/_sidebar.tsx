"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    Bars3Icon,
    CalendarIcon,
    ChartPieIcon,
    DocumentDuplicateIcon,
    FolderIcon,
    HomeIcon,
    UsersIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import SiteDropdown from "../_components/site-selector";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

const navigation = [
    { name: "Dashboard", href: "#", icon: HomeIcon, current: true },
    { name: "Team", href: "#", icon: UsersIcon, current: false },
    { name: "Projects", href: "#", icon: FolderIcon, current: false },
    { name: "Calendar", href: "#", icon: CalendarIcon, current: false },
    {
        name: "Documents",
        href: "#",
        icon: DocumentDuplicateIcon,
        current: false,
    },
    { name: "Reports", href: "#", icon: ChartPieIcon, current: false },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function DashboardSidebar({
    username,
    userIcon,
}: {
    username: string | null | undefined;
    userIcon: string | null | undefined;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const sites = api.site.getSites.useQuery();

    const params = useParams();
    const selectedUrl = params.url as string;

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
                                            className="-m-2.5 rounded-2xl border-2 border-neutral-400 bg-dark-tremor-background/50 p-2.5"
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
                                {/* Sidebar component, swap this element with another sidebar if you like */}
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-dark-tremor-background pb-2">
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
                                                <ul
                                                    role="list"
                                                    className="-mx-2 space-y-1"
                                                >
                                                    {navigation.map((item) => (
                                                        <li key={item.name}>
                                                            <a
                                                                href={item.href}
                                                                className={classNames(
                                                                    item.current
                                                                        ? "bg-neutral-700 text-neutral-200"
                                                                        : "text-gray-400",
                                                                    "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 hover:bg-neutral-50 hover:text-neutral-700",
                                                                )}
                                                            >
                                                                <item.icon
                                                                    className={classNames(
                                                                        item.current
                                                                            ? "text-neutral-200"
                                                                            : "text-gray-400",
                                                                        "h-6 w-6 shrink-0 group-hover:text-neutral-700",
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                                {item.name}
                                                            </a>
                                                        </li>
                                                    ))}
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
                <div className="flex grow flex-col gap-y-2 overflow-y-auto bg-dark-tremor-background">
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
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <a
                                                href={item.href}
                                                className={classNames(
                                                    item.current
                                                        ? "bg-neutral-700 text-neutral-200"
                                                        : "text-gray-400",
                                                    "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 hover:bg-neutral-50 hover:text-neutral-700",
                                                )}
                                            >
                                                <item.icon
                                                    className={classNames(
                                                        item.current
                                                            ? "text-neutral-200"
                                                            : "text-gray-400",
                                                        "h-6 w-6 shrink-0 group-hover:text-neutral-700",
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li className="-mx-6 mt-auto">
                                <Link
                                    href="#"
                                    className="flex items-center gap-x-4 border-t border-neutral-700 px-6 py-3 text-sm font-semibold leading-6 text-neutral-200 hover:bg-dark-tremor-background-subtle"
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
                    className="-m-2.5 rounded-2xl border-2 border-neutral-400 bg-dark-tremor-background/50 p-2.5 lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <span className="sr-only">Open sidebar</span>
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
            </div>
        </>
    );
}

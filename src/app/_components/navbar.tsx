"use client";

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
    { name: "Home", href: "/" },
    { name: "Get Started", href: "/get-started" },
    { name: "Dashboard", href: "/dashboard" },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
    const pathname = usePathname();

    return (
        <Disclosure as="nav" className="bg-gray-800">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                        <div className="relative flex h-16 items-center justify-between">
                            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                                {/* Mobile menu button*/}
                                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                    <span className="absolute -inset-0.5" />
                                    <span className="sr-only">
                                        Open main menu
                                    </span>
                                    {open ? (
                                        <XMarkIcon
                                            className="block h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Bars3Icon
                                            className="block h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Disclosure.Button>
                            </div>
                            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link
                                        href="/"
                                        className="flex items-center justify-center h-8 w-auto hover:scale-110 transition"
                                    >
                                        <Image
                                            className="w-full h-full"
                                            src="/logo.svg"
                                            alt="Image"
                                            height={32}
                                            width={32}
                                        />
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:justify-center sm:w-full">
                                    <div className="flex space-x-4">
                                        {navigation.map((item) => {
                                            const current =
                                                pathname === item.href;

                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={classNames(
                                                        current
                                                            ? "bg-gray-900 text-white"
                                                            : "text-gray-300 hover:text-white",
                                                        "rounded-md px-3 py-2 text-sm font-medium transition hover:bg-gray-700"
                                                    )}
                                                    aria-current={
                                                        current
                                                            ? "page"
                                                            : undefined
                                                    }
                                                >
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                                {/* Profile dropdown */}
                                <Link
                                    href="/api/auth/signin"
                                    className="bg-green-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-green-700 transition"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            {navigation.map((item) => {
                                const current = pathname === item.href;

                                return (
                                    <Disclosure.Button
                                        key={item.name}
                                        as="a"
                                        href={item.href}
                                        className={classNames(
                                            current
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-300 hover:text-white",
                                            "block rounded-md px-3 py-2 text-base font-medium transition hover:bg-gray-700"
                                        )}
                                        aria-current={
                                            current ? "page" : undefined
                                        }
                                    >
                                        {item.name}
                                    </Disclosure.Button>
                                );
                            })}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
}

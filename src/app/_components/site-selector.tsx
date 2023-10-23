import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { type sites } from "~/server/db/schema";
import { SmallLoading } from "./loading";

type Site = typeof sites.$inferSelect;

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

const SiteDropdown = ({
    sites,
    selectedID,
}: {
    sites: Site[];
    selectedID: string;
}) => {
    const [selectedSite, setSelectedSite] = useState(
        sites.find((g) => g.id === selectedID),
    );

    useEffect(() => {
        setSelectedSite(sites.find((g) => g.id === selectedID));
    }, [selectedID, sites]);

    return (
        <Listbox value={selectedSite}>
            {({ open }) => (
                <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-md border border-neutral-600 bg-neutral-700 py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                        <span className="flex h-6 flex-row items-center align-middle">
                            {selectedSite ? (
                                <span className="block truncate">
                                    {selectedSite.url}
                                </span>
                            ) : (
                                <SmallLoading />
                            )}
                        </span>
                        <span className="absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-neutral-400"
                                aria-hidden="true"
                            />
                        </span>
                    </Listbox.Button>

                    <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="opacity-0"
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-neutral-600 py-1 text-base shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none sm:text-sm">
                            {sites.map((site) => (
                                <Listbox.Option
                                    key={site.id}
                                    className={({ active }) =>
                                        classNames(
                                            active
                                                ? "bg-blue-600 text-white"
                                                : "text-neutral-100",
                                            "relative cursor-default select-none py-2 pl-3 pr-9",
                                        )
                                    }
                                    value={site}
                                >
                                    {({ selected, active }) => (
                                        <Link
                                            href={
                                                selected
                                                    ? "#"
                                                    : `/dashboard/${site.url}`
                                            }
                                        >
                                            <div className="flex items-center">
                                                <span
                                                    className={classNames(
                                                        selected
                                                            ? "font-semibold"
                                                            : "font-normal",
                                                        "block h-6 truncate",
                                                    )}
                                                >
                                                    {site.url}
                                                </span>
                                            </div>

                                            {selected ? (
                                                <span
                                                    className={classNames(
                                                        active
                                                            ? "text-white"
                                                            : "text-blue-600",
                                                        "absolute inset-y-0 right-0 flex items-center pr-4",
                                                    )}
                                                >
                                                    <CheckIcon
                                                        className="h-5 w-5"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                            ) : null}
                                        </Link>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            )}
        </Listbox>
    );
};

export default SiteDropdown;

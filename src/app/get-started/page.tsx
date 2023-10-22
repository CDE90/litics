"use client";

import { useEffect, useState } from "react";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardIcon,
} from "@heroicons/react/24/outline";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

const steps = [
    {
        id: "Step 1",
        name: "Details",
    },
    {
        id: "Step 2",
        name: "Add to Site",
    },
];

type Step = (typeof steps)[number];

export default function GetStartedPage() {
    const [currentStep, setCurrentStep] = useState<Step>(
        steps.find((step) => step.name === "Details")!,
    );
    const [url, setUrl] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);

    const [error, setError] = useState<string>("");

    const router = useRouter();

    const createSite = api.site.createSite.useMutation({
        onSuccess: (data) => {
            if (data === undefined) return;
            router.push(`/dashboard/${data.url}`);
        },
    });

    const siteExists = api.site.checkSiteExists.useQuery(
        {
            url,
        },
        { enabled: false },
    );

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 3000);
        }
    }, [copied]);

    useEffect(() => {
        if (siteExists.data === true) {
            setError("Site already exists");
        } else {
            setError("");
        }
    }, [siteExists.data]);

    return (
        <main className="mx-auto mt-8 flex h-full w-full max-w-7xl flex-col px-8">
            <nav aria-label="Progress" className="w-full">
                <ol
                    role="list"
                    className="space-y-4 md:flex md:space-x-8 md:space-y-0"
                >
                    {steps.map((step, idx) => {
                        const current = currentStep === step;
                        const done =
                            idx < steps.findIndex((s) => s === currentStep);

                        return (
                            <li key={step.name} className="md:flex-1">
                                {done ? (
                                    <div className="flex w-full flex-col border-l-4 border-blue-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                                        <span className="text-sm font-medium text-blue-600">
                                            {step.id}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {step.name}
                                        </span>
                                    </div>
                                ) : current ? (
                                    <div className="flex w-full flex-col border-l-4 border-blue-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                                        <span className="text-sm font-medium text-blue-600">
                                            {step.id}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {step.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                                        <span className="text-sm font-medium text-gray-500">
                                            {step.id}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {step.name}
                                        </span>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>

            {/* Render the current step */}
            {currentStep === steps[0] && (
                <div className="mx-auto mt-8 flex flex-col">
                    <h1 className="text-3xl font-bold">
                        Enter Website Details
                    </h1>
                    <div className="mt-8 flex flex-col items-center gap-8">
                        <div className="flex flex-row items-center">
                            <label
                                className="mr-2 text-sm font-medium text-white"
                                htmlFor="url"
                            >
                                URL
                            </label>
                            <div className="flex flex-row items-center rounded-l-md border-y-2 border-l-2 border-neutral-300 px-3 py-2 text-sm font-medium text-white">
                                https://
                            </div>
                            <input
                                className="flex flex-row items-center rounded-r-md border-y-2 border-r-2 border-neutral-300 px-3 py-2 text-sm font-medium text-black outline-none transition"
                                type="text"
                                placeholder="example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                        {/* add an input for website name */}
                        <div className="flex flex-row items-center">
                            <label
                                className="ml-8 mr-2 text-sm font-medium text-white"
                                htmlFor="name"
                            >
                                Name
                            </label>
                            <input
                                className="flex flex-row items-center rounded-md border-2 border-neutral-300 px-3 py-2 text-sm font-medium text-black outline-none transition"
                                type="text"
                                placeholder="Example"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    {error !== "" && (
                        <div className="mt-4 flex flex-row items-center rounded-md border-2 border-red-600 bg-red-600 px-3 py-2 text-sm font-medium text-white">
                            {error}
                        </div>
                    )}
                </div>
            )}
            {currentStep === steps[1] && (
                <div className="mx-auto mt-8 flex flex-col">
                    <h1 className="text-3xl font-bold">Add JS Snippet</h1>
                    <p className="mt-4 text-lg">
                        Copy and paste the following snippet into the
                        &lt;head&gt; section of your website
                    </p>
                    <div className="mt-4 flex flex-col items-center">
                        <div className="flex flex-row items-center rounded-md border-2 border-neutral-300 px-3 py-2 text-sm font-medium text-white">
                            &lt;script defer
                            src=&quot;https://litics.ecwrd.com/script.js&quot;&gt;&lt;/script&gt;
                            <button
                                className="ml-2 h-5 w-5 font-mono transition hover:scale-110"
                                onClick={() => {
                                    void navigator.clipboard.writeText(
                                        '<script defer src="https://litics.ecwrd.com/script.js"></script>',
                                    );
                                    setCopied(true);
                                }}
                            >
                                <ClipboardIcon />
                            </button>
                        </div>
                        {copied && (
                            <div className="mt-4 flex flex-row items-center rounded-md border-2 border-neutral-300 bg-neutral-700 px-3 py-2 text-sm font-medium text-white">
                                Copied to clipboard!
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="mb-8 mt-auto flex w-full flex-row justify-between">
                {/* Button to go back a stage */}
                {currentStep !== steps[0] && (
                    <button
                        className="flex flex-row items-center rounded-md border-2 border-neutral-300 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
                        onClick={() => {
                            const idx = steps.findIndex(
                                (step) => step === currentStep,
                            );
                            if (idx <= 0) return;
                            setCurrentStep(steps[idx - 1]!);
                        }}
                    >
                        <ChevronLeftIcon className="mr-2 h-5 w-5" />
                        Back
                    </button>
                )}

                {/* Button to go forward a stage */}
                {currentStep !== steps.at(-1) && (
                    <button
                        className="ml-auto flex flex-row items-center rounded-md border-2 border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:border-blue-700 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                            const idx = steps.findIndex(
                                (step) => step === currentStep,
                            );
                            if (idx >= steps.length - 1) return;
                            if (currentStep === steps[0] && url === "") {
                                setError("Please enter a URL");
                                return;
                            }
                            if (currentStep === steps[0] && name === "") {
                                setError("Please enter a name");
                                return;
                            }
                            siteExists
                                .refetch()
                                .then((data) => {
                                    if (data.data === true) {
                                        setError("Site already exists");
                                        return;
                                    } else {
                                        setCurrentStep(steps[idx + 1]!);
                                        setError("");
                                    }
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                        }}
                    >
                        Next
                        <ChevronRightIcon className="ml-2 h-5 w-5" />
                    </button>
                )}

                {/* If on last stage, show done button */}
                {currentStep === steps.at(-1) && (
                    <button
                        className="ml-auto flex flex-row items-center rounded-md border-2 border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:border-blue-700 hover:bg-blue-700"
                        onClick={() => {
                            if (url === "" || name === "") return;
                            createSite.mutate({
                                url,
                                name,
                            });
                        }}
                    >
                        Done
                    </button>
                )}
            </div>
        </main>
    );
}

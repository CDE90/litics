"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const steps = [
    {
        id: "Step 1",
        name: "Details",
    },
    {
        id: "Step 2",
        name: "Add to Site",
    },
    {
        id: "Step 3",
        name: "Done!",
    },
];

type Step = (typeof steps)[number];

export default function GetStartedPage() {
    const [currentStep, setCurrentStep] = useState<Step>(
        steps.find((step) => step.name === "Details")!,
    );

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
                                    <button
                                        className="group flex w-full cursor-pointer flex-col border-l-4 border-blue-600 py-2 pl-4 hover:border-blue-800 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                                        onClick={() => setCurrentStep(step)}
                                    >
                                        <span className="text-sm font-medium text-blue-600 group-hover:text-blue-800">
                                            {step.id}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {step.name}
                                        </span>
                                    </button>
                                ) : current ? (
                                    <button
                                        className="flex w-full cursor-pointer flex-col border-l-4 border-blue-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                                        onClick={() => setCurrentStep(step)}
                                    >
                                        <span className="text-sm font-medium text-blue-600">
                                            {step.id}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {step.name}
                                        </span>
                                    </button>
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
                {currentStep !== steps[2] && (
                    <button
                        className="ml-auto flex flex-row items-center rounded-md border-2 border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:border-blue-700 hover:bg-blue-700"
                        onClick={() => {
                            const idx = steps.findIndex(
                                (step) => step === currentStep,
                            );
                            if (idx >= steps.length - 1) return;
                            setCurrentStep(steps[idx + 1]!);
                        }}
                    >
                        Next
                        <ChevronRightIcon className="ml-2 h-5 w-5" />
                    </button>
                )}
            </div>
        </main>
    );
}

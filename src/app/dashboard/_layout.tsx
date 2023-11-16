import { Suspense } from "react";
import DashboardSidebar from "./_sidebar";

export default function DashboardLayoutComponent({
    children,
    username,
    userIcon,
}: {
    children: React.ReactNode;
    username: string | null | undefined;
    userIcon: string | null | undefined;
}) {
    return (
        <div className="flex flex-row">
            <Suspense fallback={<div>Loading...</div>}>
                <DashboardSidebar userIcon={userIcon} username={username} />
            </Suspense>

            <main className="w-full">
                <div className="-ml-[76px] mt-8 px-4 sm:px-6 lg:ml-0 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import DashboardLayoutComponent from "~/app/dashboard/[url]/_layout";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect(`/api/auth/signin?callbackUrl=/dashboard`);
    }

    return (
        <DashboardLayoutComponent
            username={session.user.name}
            userIcon={session.user.image}
        >
            {children}
        </DashboardLayoutComponent>
    );
}

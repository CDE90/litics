import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/api/auth/signin?callbackUrl=/dashboard");
    }

    return <>{children}</>;
}

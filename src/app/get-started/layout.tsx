import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function GetStartedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/api/auth/signin?callbackUrl=/get-started");
    }

    return <>{children}</>;
}

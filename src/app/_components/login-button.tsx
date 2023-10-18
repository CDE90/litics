import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";

export default async function LoginButton() {
    const session = await getServerAuthSession();

    if (!session) {
        return (
            <Link
                href="/api/auth/signin"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
                Sign In
            </Link>
        );
    } else {
        return (
            <Link
                href="/api/auth/signout"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
                Sign Out
            </Link>
        );
    }
}

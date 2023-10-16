import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";

export default async function LoginButton() {
    const session = await getServerAuthSession();

    if (!session) {
        return (
            <Link
                href="/api/auth/signin"
                className="bg-green-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-green-700 transition"
            >
                Sign In
            </Link>
        );
    } else {
        return (
            <Link
                href="/api/auth/signout"
                className="bg-green-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-green-700 transition"
            >
                Sign Out
            </Link>
        );
    }
}

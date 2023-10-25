import { type NextRequest, NextResponse } from "next/server";
import { verifySignatureEdge } from "@upstash/qstash/dist/nextjs";
import { env } from "~/env.mjs";

async function handler(_req: NextRequest) {
    // simulate work
    await new Promise((r) => setTimeout(r, 1000));

    console.log("Success");
    return NextResponse.json({ name: "John Doe" });
}

export const POST = verifySignatureEdge(handler, {
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
});

export const runtime = "edge";

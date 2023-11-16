/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
    images: {
        remotePatterns: [
            {
                hostname: "tailwindui.com",
            },
            {
                hostname: "images.unsplash.com",
            },
            {
                hostname: "cdn.discordapp.com",
            },
        ],
    },
};

export default config;

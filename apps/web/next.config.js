/** @type {import('next').NextConfig} */
const nextConfig = {
    // Transpile workspace packages that ship TypeScript source directly.
    // Works with both Turbopack (dev) and webpack (next build).
    transpilePackages: ["@repo/core", "@repo/db"],
};

export default nextConfig;





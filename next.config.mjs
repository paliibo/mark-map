/**
 * Mark Map ships as a fully static site — no server, no secrets, no runtime.
 * `basePath` is injected by CI so the same build works both at a domain root
 * and under a GitHub Pages project path (/mark-map).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

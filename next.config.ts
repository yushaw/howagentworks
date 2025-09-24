import type { NextConfig } from "next";

const basePathEnv = process.env.NEXT_PUBLIC_BASE_PATH;
const hasBasePath = Boolean(basePathEnv && basePathEnv.trim().length);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  assetPrefix: hasBasePath ? basePathEnv : undefined,
  basePath: hasBasePath ? basePathEnv : undefined,
  reactStrictMode: true,
};

export default nextConfig;

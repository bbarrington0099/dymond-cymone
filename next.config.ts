import type { NextConfig } from "next";

export const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    browserDebugInfoInTerminal: true,
  }
};

export default nextConfig;
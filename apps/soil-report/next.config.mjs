import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  outputFileTracingRoot: path.join(import.meta.dirname),
};

export default nextConfig;

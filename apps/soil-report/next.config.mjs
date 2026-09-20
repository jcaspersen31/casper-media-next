import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit (used by @react-pdf/renderer) loads its standard fonts from disk
  // at runtime; Next's serverless bundler doesn't reliably trace those non-JS
  // asset files, causing a MODULE_NOT_FOUND in production. Marking both as
  // external keeps them intact in node_modules instead of being bundled.
  serverExternalPackages: ["pdf-parse", "pdfkit", "@react-pdf/renderer"],
  outputFileTracingRoot: path.join(import.meta.dirname),
};

export default nextConfig;

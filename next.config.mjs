const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/commissioning", destination: "/commissioning.html" }];
  },
  async headers() {
    return [
      { source: "/commissioning", headers: noindex },
      { source: "/commissioning.html", headers: noindex },
    ];
  },
};
export default nextConfig;

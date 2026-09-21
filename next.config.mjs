/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  turbopack: {},
  // Proxy external APIs to bypass CORS in the browser.
  async rewrites() {
    return [
      { source: "/api/bazaar/:path*", destination: "https://bakedbazaar.art/api/:path*" },
      { source: "/api/cookiescan/:path*", destination: "https://api.cookiescan.io/:path*" },
      { source: "/api/swap/:path*", destination: "https://swap.cookiescan.io/api/:path*" },
    ];
  },
};

export default nextConfig;

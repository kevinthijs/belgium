/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/inkomst",
        destination: "/belgie#inkomsten",
        permanent: true,
      },
      {
        source: "/inkomsten",
        destination: "/belgie#inkomsten",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

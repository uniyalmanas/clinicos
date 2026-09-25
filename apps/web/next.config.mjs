/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/clinic/desk",
        destination: "/dashboard/desk",
        permanent: true,
      },
      {
        source: "/doctor/queue",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/doctor/consult/:id",
        destination: "/dashboard/consult/:id",
        permanent: true,
      },
      {
        source: "/pharmacy/console",
        destination: "/dashboard/pharmacy",
        permanent: true,
      },
      {
        source: "/clinic/expenses",
        destination: "/dashboard/finance",
        permanent: true,
      },
      {
        source: "/clinic/settlement",
        destination: "/dashboard/finance",
        permanent: true,
      },
      {
        source: "/display/waiting-room",
        destination: "/waiting-room",
        permanent: true,
      },
      {
        source: "/doctors",
        destination: "/search",
        permanent: false,
      },
      {
        source: "/clinics",
        destination: "/search",
        permanent: false,
      },
      {
        source: "/patient",
        destination: "/patient/portal",
        permanent: false,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        perf_hooks: false,
        dns: false,
      };
    }
    return config;
  },
};

export default nextConfig;

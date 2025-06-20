/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Add this rule to ignore the specific warning
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@supabase[\/]realtime-js[\/]dist[\/]main[\/]RealtimeClient\.js/, // Regex to match the module path
        message: /Critical dependency: the request of a dependency is an expression/, // Regex to match the message
      },
    ];

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;

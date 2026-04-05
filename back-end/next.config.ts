import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    webpack: (config, { isServer }) => {
        config.resolve.alias.canvas = false;
        if (isServer) {
            config.externals.push('canvas');
        }
        return config;
    },
};

export default nextConfig;

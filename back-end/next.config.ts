import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb', // Para PDFs grandes
        },
    },
};

export default nextConfig;

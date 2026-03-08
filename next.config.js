/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
        serverComponentsExternalPackages: ["pdf-parse", "mammoth", "xlsx"],
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
};

module.exports = nextConfig;

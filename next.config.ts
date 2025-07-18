import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: [
      "drive.google.com",
      "drive.usercontent.google.com",
      "lh3.googleusercontent.com",
      "placehold.co",
    ],
  },
  // Exclude directories from build and watch
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules",
        "**/.git",
        "**/.bmad-core/**",
        "**/mcp/**",
        "**/docs/**",
        "**/.ai/**",
        "**/database/**",
        "**/docker/**",
      ],
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/fonts/:path*",
        destination: "https://fonts.gstatic.com/:path*",
      },
    ];
  },
};

export default nextConfig;

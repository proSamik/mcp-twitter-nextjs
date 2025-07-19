import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

export default () => {
  const nextConfig: NextConfig = {
    cleanDistDir: true,
    images: {
      domains: [
        "img.youtube.com", // YouTube images
        "lh3.googleusercontent.com", // Google profile images
        "api.microlink.io", // Microlink images
        "images.unsplash.com", // Unsplash images
        "images.pexels.com", // Pexels images
        "social-media-scheduler.456893f3709eea11fc391e81e0361029.r2.cloudflarestorage.com", // R2 bucket
      ],
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};

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
      ],
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};

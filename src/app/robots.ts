import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/sign-in/", "/sign-up/", "/forgot-password/"],
      },
    ],
    sitemap: "https://grablink.xyz/sitemap.xml",
  };
}

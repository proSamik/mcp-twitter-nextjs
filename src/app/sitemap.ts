import { MetadataRoute } from "next";

const psecPages = [
  "activecampaign-alternative",
  "hubspot-alternative",
  "sendfox-alternative",
  "convertkit-alternative",
  "beehiiv-alternative",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseURL = "https://grablink.xyz";

  const psecUrls = psecPages.map((page) => ({
    url: `${baseURL}/${page}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: baseURL,
      lastModified: new Date(),
    },
    {
      url: `${baseURL}/pricing`,
      lastModified: new Date(),
    },
    {
      url: `${baseURL}/privacy-policy`,
      lastModified: new Date(),
    },
    {
      url: `${baseURL}/terms-of-service`,
      lastModified: new Date(),
    },
    ...psecUrls,
  ];
}

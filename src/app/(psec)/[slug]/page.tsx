import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Define the data for the pSEO pages
const psecData: { [key: string]: any } = {
  "activecampaign-alternative": {
    title: "GrabLink: A Simpler, More Focused ActiveCampaign Alternative",
    description:
      "Looking for a straightforward alternative to ActiveCampaign? Discover how GrabLink provides a fast and easy way to capture leads without the complexity of a full marketing automation suite.",
    competitorName: "ActiveCampaign",
    competitorDescription:
      "ActiveCampaign is a powerful marketing automation platform that offers email marketing, CRM, and cross-channel marketing features. It's designed for businesses that need a comprehensive solution to manage the entire customer lifecycle.",
    grablinkAdvantage:
      "GrabLink focuses on one thing and does it exceptionally well: capturing leads with simple, high-converting forms. If you don't need the complexity and cost of a full marketing automation platform, GrabLink is the perfect solution.",
    faq: [
      {
        question: "Is GrabLink cheaper than ActiveCampaign?",
        answer:
          "Yes, for most users, GrabLink is significantly more affordable than ActiveCampaign. Our pricing is simple and transparent, designed for businesses that need powerful lead capture without the cost of a full marketing automation suite.",
      },
      {
        question: "Can I integrate GrabLink with other tools?",
        answer:
          "Absolutely. GrabLink is designed to work with your existing marketing stack. You can easily send your leads to ActiveCampaign or any other CRM or email marketing service.",
      },
    ],
  },
  "hubspot-alternative": {
    title:
      "GrabLink: The Best Lightweight HubSpot Alternative for Lead Generation",
    description:
      "Feeling overwhelmed by HubSpot? GrabLink offers a streamlined, easy-to-use alternative for creating beautiful lead capture forms without the enterprise-level features and pricing.",
    competitorName: "HubSpot",
    competitorDescription:
      "HubSpot is a comprehensive inbound marketing, sales, and customer service platform offering CRM, marketing automation, content management, and analytics tools. With multiple 'Hubs' and complex pricing starting at $20/month per seat but reaching $890+/month for Marketing Hub Professional with mandatory $3,000+ onboarding fees.",
    grablinkAdvantage:
      "HubSpot can be overwhelming and expensive for businesses that simply need effective lead capture. GrabLink provides essential lead generation functionality without the complexity, learning curve, or high costs of HubSpot's enterprise-level platform.",
    faq: [
      {
        question: "Is GrabLink a free alternative to HubSpot?",
        answer:
          "GrabLink offers a generous free plan that is a great alternative to HubSpot's free tools for lead capture. For more advanced features, our paid plans are much more affordable than HubSpot's.",
      },
      {
        question: "Can I use GrabLink if I already use HubSpot?",
        answer:
          "Yes, many of our customers use GrabLink to create beautiful, high-converting file-sharing lead magnets and then send the leads to their HubSpot account. It's a great way to improve your lead generation while avoiding HubSpot's complex form builder and high costs.",
      },
    ],
  },
  "sendfox-alternative": {
    title:
      "GrabLink vs. SendFox: The Superior Choice for High-Converting Lead Capture",
    description:
      "While SendFox is great for newsletters, GrabLink is designed for high-converting lead capture. See why GrabLink is the better choice for building your email list with beautiful, effective forms.",
    competitorName: "SendFox",
    competitorDescription:
      "SendFox is a simple and affordable email marketing tool for content creators. It's great for sending newsletters, but it's not designed for creating high-converting lead capture forms.",
    grablinkAdvantage:
      "GrabLink is a purpose-built tool for creating beautiful, effective lead capture forms. With our advanced features and integrations, you can build your email list faster and more effectively than with SendFox.",
    faq: [
      {
        question: "Why is GrabLink better than SendFox for lead capture?",
        answer:
          "GrabLink offers more advanced form-building features, better customization options, and more powerful integrations than SendFox. Our focus is on helping you convert more visitors into subscribers.",
      },
      {
        question: "Is GrabLink more expensive than SendFox?",
        answer:
          "GrabLink's pricing is competitive with SendFox and offers more value for lead capture. Our free plan is a great way to get started.",
      },
    ],
  },
  "convertkit-alternative": {
    title:
      "GrabLink: The Best Kit (ConvertKit) Alternative for Focused Lead Capture",
    description:
      "Kit is great for creators, but what if you just need powerful lead capture? Discover why GrabLink is the best alternative for building your list with high-converting file downloads.",
    competitorName: "Kit (formerly ConvertKit)",
    competitorDescription:
      "Kit (formerly ConvertKit) is an email marketing platform built specifically for creators, bloggers, and online entrepreneurs. It offers email automation, subscriber management, and creator-focused tools with a generous free plan supporting up to 10,000 subscribers.",
    grablinkAdvantage:
      "While Kit excels at email marketing for creators, GrabLink specializes in the crucial first step: capturing leads with valuable file downloads. Kit focuses on what happens after you have subscribers; GrabLink focuses on getting those subscribers in the first place.",
    faq: [
      {
        question: "Is GrabLink a good alternative to Kit for bloggers?",
        answer:
          "Yes, if you're a blogger who wants to capture more leads from your website, GrabLink is an excellent alternative to Kit. Our file-sharing approach often converts better than traditional email opt-ins, and you can still use Kit for email marketing afterward.",
      },
      {
        question: "Can I sell digital products with GrabLink?",
        answer:
          "GrabLink is focused on lead capture and does not have built-in features for selling digital products like Kit. However, you can use GrabLink to build your audience and then sell to them through Kit or another platform.",
      },
    ],
  },
  "beehiiv-alternative": {
    title:
      "GrabLink vs. Beehiiv: The Best Alternative for On-Site Lead Capture",
    description:
      "Beehiiv is a fantastic newsletter platform, but for powerful, on-site lead capture, GrabLink is the superior choice. See how we help you convert more visitors into subscribers.",
    competitorName: "Beehiiv",
    competitorDescription:
      "Beehiiv is an all-in-one platform for creating, growing, and monetizing newsletters. It provides a website, an ad network, and paid subscription features, making it a complete solution for newsletter creators.",
    grablinkAdvantage:
      "While Beehiiv is focused on the newsletter ecosystem, GrabLink is dedicated to maximizing your on-site conversions. Our beautiful, customizable forms are designed to be embedded anywhere, capturing more leads from your existing traffic. If you already have a website, GrabLink is the perfect tool to grow your email list.",
    faq: [
      {
        question: "Is GrabLink a replacement for Beehiiv?",
        answer:
          "GrabLink is not a direct replacement for Beehiiv if you need a full newsletter platform with a built-in website and ad network. However, if you already have a website and need a powerful tool for on-site lead capture, GrabLink is the perfect complement to your existing setup and a better choice for that specific purpose.",
      },
      {
        question: "Can I use GrabLink with Beehiiv?",
        answer:
          "Yes, you can use GrabLink to create and embed high-converting forms on your website and then send the collected leads to your Beehiiv account using our integrations.",
      },
    ],
  },
};

/**
 * Type definition for page props with async params
 */
type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Generate static parameters for all pSEO pages
 * @returns Array of slug parameters for static generation
 */
export async function generateStaticParams() {
  return Object.keys(psecData).map((slug) => ({
    slug,
  }));
}

/**
 * Generate metadata for each pSEO page
 * @param params - Page parameters containing the slug
 * @returns Metadata object with title and description
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = psecData[slug];

  if (!pageData) {
    return {};
  }

  return {
    title: pageData.title,
    description: pageData.description,
  };
}

/**
 * Programmatic SEO page component
 * @param params - Page parameters containing the slug
 * @returns JSX element for the comparison page
 */
export default async function PSECPage({ params }: PageProps) {
  const { slug } = await params;
  const pageData = psecData[slug];

  if (!pageData) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pageData.faq
      ? pageData.faq.map((item: { question: string; answer: string }) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        }))
      : [],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            {pageData.title}
          </h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What is {pageData.competitorName}?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {pageData.competitorDescription}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Why GrabLink is the Better Alternative
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {pageData.grablinkAdvantage}
            </p>
          </section>

          {pageData.faq && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              {pageData.faq.map(
                (item: { question: string; answer: string }, index: number) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {item.question}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ),
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

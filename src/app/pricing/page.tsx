import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";
import type { Metadata } from "next";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Pricing | GrabLink",
  description:
    "Explore our pricing plans and choose the one that's right for you.",
};

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: "https://grablink.xyz/pricing",
    name: "Pricing | GrabLink",
    description:
      "Explore our pricing plans and choose the one that's right for you.",
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}

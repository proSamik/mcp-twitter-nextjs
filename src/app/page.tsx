import { HeroSection } from "@/components/hero-section";
import { InteractiveDemoSection } from "@/components/landing/interactive-demo-section";
import { DemoVideoSection } from "@/components/landing/demo-video-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FooterSection } from "@/components/landing/footer-section";
import { FloatingNavDemo } from "@/components/landing/floating-nav-demo";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Twitter Manager | AI-Powered Twitter/X Management Platform",
  description:
    "The ultimate Twitter/X management platform with Claude MCP integration. Schedule tweets, manage multiple accounts, analyze performance, and automate your social media presence.",
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://mcp-twitter.com",
    name: "MCP Twitter Manager",
    description:
      "The ultimate Twitter/X management platform with Claude MCP integration. Schedule tweets, manage multiple accounts, analyze performance, and automate your social media presence.",
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FloatingNavDemo />
      <HeroSection />
      <HowItWorksSection />
      <InteractiveDemoSection />
      <FeaturesSection />
      <DemoVideoSection />
      <ComparisonSection />
      <PricingSection />
      <CTASection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}

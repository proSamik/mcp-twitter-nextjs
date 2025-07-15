import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | GrabLink",
  description:
    "Read our terms of service to understand the rules of using our platform.",
};

export default function TermsOfServicePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: "https://grablink.xyz/terms-of-service",
    name: "Terms of Service | GrabLink",
    description:
      "Read our terms of service to understand the rules of using our platform.",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Terms of Service
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Last updated: June 28, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to GrabLink.xyz (&quot;Service,&quot;
                &quot;Platform,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;). These Terms of Service (&quot;Terms&quot;)
                govern your use of our lead magnet automation platform and
                related services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using GrabLink, you agree to be bound by these
                Terms and our Privacy Policy. If you disagree with any part of
                these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                GrabLink is a lead magnet platform that enables creators to:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>Create and manage lead magnet forms</li>
                <li>Automate email delivery through Useplunk integration</li>
                <li>Track visitor analytics and engagement metrics</li>
                <li>Build and manage email audiences</li>
                <li>Monitor lead generation performance</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Our platform integrates with third-party services including
                Google OAuth for authentication, Polar.sh for payments, and
                Useplunk for email automation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. User Accounts and Registration
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use our Service, you must:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>Be at least 18 years old or have parental consent</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You may register using Google OAuth or email/password
                authentication. Account deletion requests can be made by
                contacting dev.samikc@gmail.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Acceptable Use Policy
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree NOT to use the Service to:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>
                  Send spam, unsolicited emails, or violate anti-spam laws
                </li>
                <li>Collect email addresses without proper consent</li>
                <li>Create misleading or deceptive lead magnets</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malware, viruses, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the platform for illegal or unethical purposes</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Violation of this policy may result in immediate account
                suspension or termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Third-Party Service Integration
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using GrabLink, you acknowledge and agree to the terms of
                service and privacy policies of our integrated third-party
                services:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>
                  <strong>Google OAuth:</strong> Used for secure authentication
                </li>
                <li>
                  <strong>Polar.sh:</strong> Handles all payment processing and
                  billing
                </li>
                <li>
                  <strong>Useplunk:</strong> Processes email automation and
                  delivery
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We are not responsible for the availability, functionality, or
                policies of these third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Payment Terms and Billing
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Payment processing is handled exclusively by Polar.sh. Our
                current pricing structure includes:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>
                  <strong>Free Plan:</strong> Limited features with usage
                  restrictions
                </li>
                <li>
                  <strong>Lifetime Plan:</strong> One-time payment for unlimited
                  access
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                All payments are processed securely by Polar.sh according to
                their terms of service. Refunds are subject to Polar.sh&apos;s
                refund policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Data Ownership and Usage Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Your Data:</strong> You retain ownership of all content
                and data you create or upload to the platform, including lead
                magnet content and collected email addresses.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Our Rights:</strong> You grant us a limited license to
                process your data solely to provide our services, including:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>Displaying your lead magnets to visitors</li>
                <li>Processing email submissions through Useplunk</li>
                <li>Generating analytics and performance reports</li>
                <li>Providing customer support</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We do not claim ownership of your content and will not use it
                for purposes outside of providing our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. GDPR and Privacy Compliance
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                As a creator using GrabLink, you are responsible for:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>
                  Obtaining proper consent from visitors before collecting their
                  email addresses
                </li>
                <li>
                  Providing clear privacy notices on your lead magnet forms
                </li>
                <li>
                  Complying with GDPR, CCPA, and other applicable privacy laws
                </li>
                <li>Honoring visitor requests for data deletion or access</li>
                <li>
                  Ensuring your lead magnets comply with advertising standards
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We provide tools to help with compliance, but ultimate
                responsibility rests with you as the data controller for your
                lead magnets.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Service Availability and Limitations
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We strive to maintain high service availability but cannot
                guarantee:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>100% uptime or uninterrupted service</li>
                <li>Compatibility with all devices or browsers</li>
                <li>Availability of third-party integrations</li>
                <li>Data backup or recovery in all circumstances</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any
                aspect of the service with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Intellectual Property Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The GrabLink platform, including its design, code, features, and
                branding, is protected by intellectual property laws and remains
                our exclusive property.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You may not copy, modify, distribute, or create derivative works
                of our platform without explicit written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Limitation of Liability
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To the maximum extent permitted by law, GrabLink shall not be
                liable for:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages resulting from third-party service failures</li>
                <li>User-generated content or lead magnet performance</li>
                <li>
                  Compliance failures related to your use of collected data
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Our total liability shall not exceed the amount paid by you for
                the service in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Indemnification
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold GrabLink harmless from any
                claims, damages, or expenses arising from your use of the
                service, violation of these terms, or infringement of
                third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Account Termination
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Either party may terminate the service relationship:
              </p>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>
                  <strong>By You:</strong> At any time by contacting
                  dev.samikc@gmail.com
                </li>
                <li>
                  <strong>By Us:</strong> For violation of terms, illegal
                  activity, or abuse
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Upon termination, your access will be suspended, and data may be
                deleted according to our retention policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. Dispute Resolution
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Any disputes arising from these terms shall be resolved through
                binding arbitration or in courts of competent jurisdiction. You
                waive the right to participate in class action lawsuits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                15. Changes to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. Material
                changes will be communicated via email with 30 days&apos;
                notice. Continued use after changes constitutes acceptance of
                new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                16. Governing Law
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by applicable laws and regulations. Any
                legal proceedings shall be conducted in English.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                17. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> dev.samikc@gmail.com
                </p>
                <p className="text-gray-700">
                  <strong>Website:</strong> grablink.xyz
                </p>
                <p className="text-gray-700">
                  <strong>Response Time:</strong> We aim to respond within 5
                  business days
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                18. Severability
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If any provision of these Terms is found to be unenforceable,
                the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                19. Entire Agreement
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms, together with our Privacy Policy, constitute the
                entire agreement between you and GrabLink regarding the use of
                our service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

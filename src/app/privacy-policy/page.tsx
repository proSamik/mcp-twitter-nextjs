import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | GrabLink",
  description: "Read our privacy policy to understand how we handle your data.",
};

export default function PrivacyPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: "https://grablink.xyz/privacy-policy",
    name: "Privacy Policy | GrabLink",
    description:
      "Read our privacy policy to understand how we handle your data.",
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">Last updated: June 28, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to GrabLink.xyz (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;). This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you visit our
              website and use our lead magnet automation services. GrabLink is a
              platform that helps creators build lead magnet forms and automate
              email audience management through third-party integrations.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We are committed to protecting your privacy and complying with the
              General Data Protection Regulation (GDPR) and other applicable
              data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Data Controller
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The data controller for your personal information is GrabLink.xyz.
              For any privacy-related inquiries, you can contact us at
              dev.samikc@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              3.1 Creator Account Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create a creator account on GrabLink, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Email address (primary identifier)</li>
              <li>Full name</li>
              <li>Profile image (from Google OAuth)</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              3.2 Lead Magnet Visitor Analytics
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              For visitors to lead magnet forms created by our users, we
              collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>
                Email addresses (submitted voluntarily in exchange for
                resources)
              </li>
              <li>Geographic location (IP-based, for analytics purposes)</li>
              <li>Visit timestamps and duration</li>
              <li>Device and browser information</li>
              <li>Page interaction analytics</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              3.3 Payment Information
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Payment processing is handled entirely by Polar.sh. We do not
              store payment card details or banking information on our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Legal Basis for Processing (GDPR)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We process your personal data based on the following legal
              grounds:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Consent:</strong> For email marketing and non-essential
                analytics
              </li>
              <li>
                <strong>Contract:</strong> To provide our lead magnet platform
                services
              </li>
              <li>
                <strong>Legitimate Interest:</strong> For platform security,
                fraud prevention, and service improvement
              </li>
              <li>
                <strong>Legal Obligation:</strong> To comply with applicable
                laws and regulations
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. How We Use Your Information
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              5.1 For Creators
            </h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Authenticate and maintain your account</li>
              <li>Process payments through Polar.sh</li>
              <li>Provide customer support</li>
              <li>Send important service updates and notifications</li>
              <li>Improve our platform and develop new features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              5.2 For Lead Magnet Visitors
            </h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Deliver requested resources via automated email through Useplunk
              </li>
              <li>Provide analytics to creators about form performance</li>
              <li>Track user engagement for optimization purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Third-Party Services and Data Sharing
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We integrate with the following third-party services. By using
              GrabLink, you also agree to their respective privacy policies:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.1 Google OAuth
            </h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Used solely for authentication purposes</li>
              <li>We access only your email, name, and profile picture</li>
              <li>Subject to Google&apos;s Privacy Policy</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.2 Polar.sh
            </h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>
                Handles all payment processing and subscription management
              </li>
              <li>We receive only payment status notifications</li>
              <li>Subject to Polar.sh&apos;s Privacy Policy</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.3 Useplunk
            </h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Processes email automation for lead magnet delivery</li>
              <li>
                Visitor email addresses are sent to Useplunk for automated
                responses
              </li>
              <li>
                We do not store emails permanently; they are processed through
                Useplunk
              </li>
              <li>Subject to Useplunk&apos;s Privacy Policy</li>
            </ul>

            <p className="text-gray-700 leading-relaxed">
              <strong>Important:</strong> We do not sell, rent, or trade your
              personal information to third parties for marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Data Retention
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Creator accounts:</strong> Retained until account
                deletion is requested
              </li>
              <li>
                <strong>Analytics data:</strong> Retained for performance
                optimization
              </li>
              <li>
                <strong>Email addresses:</strong> Processed through Useplunk and
                not permanently stored by us
              </li>
              <li>
                <strong>Payment data:</strong> Retained by Polar.sh according to
                their policies
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Your Rights (GDPR)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under GDPR, you have the following rights regarding your personal
              data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>
                <strong>Right of Access:</strong> Request a copy of your
                personal data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Correct inaccurate or
                incomplete data
              </li>
              <li>
                <strong>Right to Erasure:</strong> Request deletion of your
                personal data
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> Limit how we use
                your data
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Receive your data in
                a structured format
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing based on
                legitimate interests
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent for
                consent-based processing
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, contact us at dev.samikc@gmail.com. We
              will respond within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures including
              encryption in transit and at rest, secure authentication
              protocols, regular security assessments, and access controls.
              However, no method of transmission over the internet is 100%
              secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be processed in countries outside the European
              Economic Area (EEA). We ensure appropriate safeguards are in place
              for such transfers, including adequacy decisions and standard
              contractual clauses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Cookies and Tracking
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies for authentication and functionality.
              Analytics cookies are used with your consent to improve our
              services. You can manage cookie preferences through your browser
              settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for children under 16 years of age.
              We do not knowingly collect personal information from children
              under 16. If you become aware that a child has provided us with
              personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Changes to This Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy to reflect changes in our
              practices or applicable laws. We will notify users of material
              changes via email and update the &quot;last updated&quot; date.
              Continued use of our services after changes constitutes
              acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              14. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For any questions about this Privacy Policy, to exercise your
              rights, or to request account deletion, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> dev.samikc@gmail.com
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong> grablink.xyz
              </p>
              <p className="text-gray-700">
                <strong>Response Time:</strong> We aim to respond within 30 days
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              15. Supervisory Authority
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you are not satisfied with our response to your privacy
              concerns, you have the right to lodge a complaint with your local
              data protection supervisory authority or get in touch with us at
              dev.samikc@gmail.com, so that we can improve our services.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

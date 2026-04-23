import React, { useEffect } from "react";

const setMetaTag = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const PrivacyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | RoomBridge Pakistan";
    setMetaTag(
      "description",
      "Read the RoomBridge Privacy Policy for Pakistan users to understand how we collect, use, protect, and process personal data.",
    );
    setMetaTag(
      "keywords",
      "RoomBridge privacy policy, data protection, personal data, room rental privacy",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary py-14 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-white/75 text-sm md:text-base">
            Effective Date: April 18, 2026
          </p>
        </div>
      </section>

      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto bg-white rounded-card border border-border shadow-card p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              1. Information We Collect
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We may collect account data (name, email, phone), profile
              information, listing details, booking activity, and messages
              exchanged within the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              2. How We Use Information
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We use information to provide platform features, improve security,
              process requests, communicate service updates, and support legal
              and moderation requirements under applicable Pakistani law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              3. Data Sharing
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We do not sell personal data. We may share data with service
              providers required to operate RoomBridge (for example, hosting,
              media, and communication providers) and where required by
              Pakistani law, regulatory process, or lawful authority.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-lg font-bold text-primary mb-2">
              4. Cookies and Sessions
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              RoomBridge uses essential cookies/session mechanisms for login,
              security, and platform functionality. Disabling cookies may affect
              normal service behavior.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              5. Data Security
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We apply technical and organizational safeguards to protect data.
              No internet-based system can guarantee absolute security, but we
              continuously improve controls and monitoring.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              6. Data Location and Transfers
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your data may be processed on servers in Pakistan or in other
              jurisdictions used by our service providers. Where transfers are
              needed, we apply reasonable safeguards consistent with applicable
              law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              7. Your Rights
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              You can request correction or deletion of account information,
              subject to legal and operational obligations. Contact our support
              team for privacy-related requests.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              8. Policy Updates
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We may revise this policy from time to time. Updates are posted on
              this page with the latest effective date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">9. Contact</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              For privacy questions, contact us at hello@roombridge.pk.
            </p>
          </section>

          <p className="text-xs text-text-secondary border-t border-border pt-4">
            Disclaimer: This page is provided for general information and is
            not legal advice.
          </p>
        </article>
      </section>
    </div>
  );
};

export default PrivacyPage;

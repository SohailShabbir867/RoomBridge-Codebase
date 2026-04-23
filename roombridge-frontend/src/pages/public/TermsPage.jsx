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

const TermsPage = () => {
  useEffect(() => {
    document.title = "Terms and Conditions | RoomBridge Pakistan";
    setMetaTag(
      "description",
      "Read RoomBridge Terms and Conditions for users in Pakistan, including account use, listings, bookings, and legal responsibilities.",
    );
    setMetaTag(
      "keywords",
      "RoomBridge terms, terms and conditions, rental platform terms, Pakistan room rental",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary py-14 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Terms and Conditions
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
              1. Acceptance of Terms
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              By accessing or using RoomBridge, you agree to these Terms and
              Conditions. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              2. User Accounts
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              You are responsible for maintaining account security and ensuring
              information provided is accurate and up to date. You must be
              legally allowed to use this service under applicable Pakistani
              law and must have legal capacity to enter into agreements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              3. Listings and Content
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Owners are responsible for listing accuracy, lawful content, and
              compliance with Pakistani local regulations. RoomBridge may
              review, reject,
              or remove content that violates platform policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              4. Bookings and Communication
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Booking requests and in-app messaging are provided to facilitate
              communication between users. RoomBridge is not a party to private
              agreements between owners and seekers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              5. Prohibited Activities
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Users must not post fraudulent information, harass others,
              distribute harmful content, or attempt unauthorized access to
              systems or accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              6. Limitation of Liability
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              RoomBridge provides the platform on an "as is" basis. To the
              maximum extent permitted by law, RoomBridge is not liable for
              indirect losses, disputes, or damages arising from user
              interactions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              7. Governing Law and Jurisdiction
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              These terms are governed by the laws of Pakistan. Any dispute
              relating to the use of RoomBridge will be subject to the courts
              of Pakistan, unless otherwise required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">
              8. Updates to Terms
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We may update these terms from time to time. Continued use after
              updates means you accept the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-2">9. Contact</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              For legal questions regarding these terms, contact us at
              hello@roombridge.pk.
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

export default TermsPage;

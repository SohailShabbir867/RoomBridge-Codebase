import React from "react";
import { Link } from "react-router-dom";
import {
  RiBookmark3Line,
  RiTimeLine,
  RiArrowRightSLine,
  RiShieldCheckLine,
  RiUserLine,
  RiHome4Line,
  RiMessage2Line,
  RiBanLine,
  RiAlertLine,
  RiScalesLine,
  RiRefreshLine,
  RiMailLine,
  RiInformationLine,
} from "react-icons/ri";
import { useSEO } from "../../hooks/useSEO";

const TermsPage = () => {
  useSEO({
    title: "Terms and Conditions | RoomBridge Pakistan",
    description:
      "Read RoomBridge's Terms and Conditions — Pakistan's trusted room rental and roommate matching platform. Understand your rights, responsibilities, and legal obligations when using roombridge.site.",
    keywords:
      "RoomBridge terms and conditions, room rental platform Pakistan, roommate matching terms, online rental agreement Pakistan, room for rent Pakistan terms, roombridge.site legal, rental platform rules Pakistan, find room Pakistan, roommate finder Pakistan",
  });

  const SECTIONS = [
    {
      id: "acceptance",
      icon: <RiShieldCheckLine className="text-[#FFAB69] text-xl" />,
      title: "1. Acceptance of Terms",
      text: "By accessing, browsing, or using RoomBridge — including roombridge.site, our mobile interfaces, and any associated services — you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions. These terms constitute a binding legal agreement between you and RoomBridge. If you do not agree with any part of these terms, you must immediately discontinue use of the platform. Your continued use of RoomBridge following any updates to these terms constitutes your acceptance of the revised agreement.",
    },
    {
      id: "eligibility",
      icon: <RiUserLine className="text-[#FFAB69] text-xl" />,
      title: "2. User Eligibility and Accounts",
      text: "To use RoomBridge, you must be at least 18 years of age and legally capable of entering into a binding contract under the laws of Pakistan. By creating an account, you confirm that all information you provide — including your name, contact details, and identity — is accurate, complete, and current. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. RoomBridge reserves the right to suspend or permanently terminate accounts found to contain false, misleading, or incomplete information, or accounts that violate these terms in any manner. You agree to notify RoomBridge immediately at hello@roombridge.site if you suspect any unauthorized access to your account.",
    },
    {
      id: "listings",
      icon: <RiHome4Line className="text-[#FFAB69] text-xl" />,
      title: "3. Listings, Content, and Room Rentals",
      text: "RoomBridge is Pakistan's dedicated platform for connecting room seekers with property owners and roommates. Property owners and landlords who list rooms or accommodations on RoomBridge are solely responsible for the accuracy, legality, and completeness of their listings. All listed properties must comply with applicable Pakistani law, local municipal regulations, and housing codes. Listings must not contain misleading information, inflated pricing, discriminatory language, or content that violates the rights of any individual or group. RoomBridge reserves the right to review, edit, suspend, or permanently remove any listing that violates our content policies or applicable law. RoomBridge does not guarantee the availability, safety, or suitability of any listed property and encourages users to conduct in-person verification before finalizing any rental agreement.",
    },
    {
      id: "bookings",
      icon: <RiMessage2Line className="text-[#FFAB69] text-xl" />,
      title: "4. Booking Requests and In-App Communication",
      text: "RoomBridge provides in-app messaging and booking request features solely to facilitate initial communication between room seekers and property owners in Pakistan. These tools do not constitute a formal tenancy agreement, lease contract, or any legally binding commitment between parties. RoomBridge is not a party to any private agreement, transaction, or dispute that may arise between users. Any rental agreement, payment terms, or occupancy conditions agreed upon between a room seeker and property owner are entirely the responsibility of those parties and must comply with the Tenancy Act of Pakistan and applicable local regulations. RoomBridge strongly recommends that all rental agreements be documented in writing and reviewed by a qualified legal professional.",
    },
    {
      id: "prohibited",
      icon: <RiBanLine className="text-[#FFAB69] text-xl" />,
      title: "5. Prohibited Activities",
      text: "Users of RoomBridge are strictly prohibited from engaging in the following activities: posting false, fraudulent, or misleading listings or profile information; impersonating any individual, organization, or authority; engaging in harassment, threats, abuse, or discriminatory conduct toward any user; uploading or distributing harmful, illegal, obscene, or defamatory content; scraping, copying, or reproducing platform data without express written consent from RoomBridge; attempting to gain unauthorized access to platform systems, databases, or user accounts; using RoomBridge to facilitate illegal sub-letting, money laundering, or any other unlawful activity; and circumventing or manipulating platform features, algorithms, or security systems. Violation of these prohibitions may result in immediate account termination, reporting to relevant Pakistani authorities, and potential legal action.",
    },
    {
      id: "liability",
      icon: <RiAlertLine className="text-[#FFAB69] text-xl" />,
      title: "6. Limitation of Liability",
      text: "RoomBridge provides its platform, services, and technology on an \"as is\" and \"as available\" basis, without warranties of any kind — express or implied — including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. RoomBridge does not guarantee the accuracy of user-generated content, the suitability of any property, or the conduct of any user. To the maximum extent permitted under the laws of Pakistan, RoomBridge shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the platform, including property disputes, rental fraud, personal injury, financial loss, or data breaches resulting from user actions. Your sole remedy for dissatisfaction with the platform or its services is to discontinue use.",
    },
    {
      id: "intellectual",
      icon: <RiInformationLine className="text-[#FFAB69] text-xl" />,
      title: "7. Intellectual Property",
      text: "All content, branding, trademarks, logos, interface designs, source code, and technology on roombridge.site are the exclusive intellectual property of RoomBridge and are protected under applicable Pakistani and international intellectual property laws. You are granted a limited, non-exclusive, non-transferable, and revocable license to access and use the platform for its intended purposes only. You may not copy, reproduce, distribute, modify, create derivative works of, publicly display, or commercially exploit any part of the RoomBridge platform without prior written permission. User-generated content such as listing descriptions, photos, and reviews remains the responsibility of the uploading user; however, by submitting content to RoomBridge, you grant us a non-exclusive, royalty-free license to display and use that content for platform operations and promotional purposes.",
    },
    {
      id: "governing",
      icon: <RiScalesLine className="text-[#FFAB69] text-xl" />,
      title: "8. Governing Law and Jurisdiction",
      text: "These Terms and Conditions are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, including but not limited to the Contract Act 1872, the Electronic Transactions Ordinance 2002, and the Prevention of Electronic Crimes Act (PECA) 2016. Any dispute, controversy, or claim arising out of or relating to these terms or your use of RoomBridge shall be subject to the exclusive jurisdiction of the competent courts of Pakistan. Users agree to attempt resolution of disputes amicably before initiating formal legal proceedings. RoomBridge reserves the right to seek injunctive or equitable relief in any court of competent jurisdiction where necessary to protect its intellectual property or platform integrity.",
    },
    {
      id: "updates",
      icon: <RiRefreshLine className="text-[#FFAB69] text-xl" />,
      title: "9. Updates to These Terms",
      text: "RoomBridge reserves the right to revise, amend, or update these Terms and Conditions at any time to reflect changes in our services, legal requirements, or platform policies. When material changes are made, we will update the effective date displayed at the top of this page and may notify users via email or in-app notification. Your continued use of RoomBridge following the posting of updated terms constitutes your acceptance of those changes. We encourage you to review this page periodically to stay informed of your rights and obligations. If you do not agree with any revised terms, you must discontinue use of the platform immediately.",
    },
    {
      id: "contact",
      icon: <RiMailLine className="text-[#FFAB69] text-xl" />,
      title: "10. Contact and Legal Inquiries",
      text: "If you have any questions, concerns, or legal inquiries regarding these Terms and Conditions, your account, or your rights as a user of RoomBridge, please contact our support team at hello@roombridge.site. We are committed to responding to all legitimate legal queries within a reasonable timeframe. For formal legal correspondence, please mark your communication as 'Legal Notice — RoomBridge Terms' to ensure it is directed to the appropriate team. Our team is available to assist room seekers, property owners, and other stakeholders in understanding their obligations and rights under this agreement.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] font-sans pb-16">

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pt-20 pb-24 text-white bg-[#012D1D]">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06] bg-[#FFAB69] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04] bg-[#8E4E14] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-5">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-white/10 bg-white/5 text-[#FFAB69]">
            <RiBookmark3Line className="text-sm" /> Legal Service Agreement
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Please read these terms carefully before using RoomBridge — Pakistan's trusted platform
            for room rentals and roommate matching. By using roombridge.site, you agree to the
            following legally binding terms.
          </p>
          <p className="text-white/50 text-xs font-semibold flex items-center justify-center gap-1.5">
            <RiTimeLine className="text-base" /> Effective Date: April 18, 2026 &nbsp;·&nbsp; Last Updated: July 13, 2026
          </p>
        </div>
      </section>

      {/* ─── SEO Intro Section ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-[#012D1D] font-serif text-xl font-bold mb-3">
            RoomBridge Platform Terms — Room Rental &amp; Roommate Matching in Pakistan
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed font-medium">
            RoomBridge is Pakistan's leading online platform for finding rooms for rent, connecting
            roommates, and listing residential properties. Whether you are a room seeker searching
            for affordable accommodation in Lahore, Karachi, Islamabad, or any other city, or a
            property owner listing rooms for rent, these Terms and Conditions govern your use of
            our platform and services. Please read them carefully. They define your rights,
            responsibilities, and the legal framework that protects all parties using roombridge.site.
          </p>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ─── Sticky Sidebar ─── */}
          <aside className="lg:col-span-4 hidden lg:block sticky top-24">
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-[#012D1D] font-serif text-lg font-bold border-b border-gray-100 pb-3">
                Document Sections
              </h2>
              <nav className="flex flex-col gap-1 text-xs" aria-label="Terms sections">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-gray-500 hover:text-[#012D1D] hover:bg-[#F9F7F2] transition-all"
                  >
                    <span>{sec.title.slice(3)}</span>
                    <RiArrowRightSLine className="text-base opacity-60" />
                  </a>
                ))}
              </nav>
              {/* Quick Info Box */}
              <div className="bg-[#012D1D]/5 rounded-2xl p-4 mt-2">
                <p className="text-[#012D1D] text-xs font-bold mb-1">Need Help?</p>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Questions about these terms? Contact us at{" "}
                  <a
                    href="mailto:hello@roombridge.site"
                    className="text-[#012D1D] underline font-bold"
                  >
                    hello@roombridge.site
                  </a>
                </p>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <Link
                  to="/privacy"
                  className="flex items-center gap-2 text-xs font-bold text-[#012D1D] hover:text-[#FFAB69] transition-colors"
                >
                  <RiShieldCheckLine />
                  View Privacy Policy
                  <RiArrowRightSLine className="ml-auto" />
                </Link>
              </div>
            </div>
          </aside>

          {/* ─── Policy Content ─── */}
          <article
            className="lg:col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-6 sm:p-10 space-y-8"
            itemScope
            itemType="https://schema.org/WebPage"
          >
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-[#012D1D] font-serif text-2xl font-bold" itemProp="name">
                Terms of Use — RoomBridge Pakistan
              </h2>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed font-medium" itemProp="description">
                Welcome to RoomBridge, Pakistan's smart room rental and roommate matching platform.
                These Terms and Conditions apply to all users — including room seekers, property
                owners, and landlords — who access or use roombridge.site, our mobile interfaces,
                or any related services. By using our platform, you enter into a legal agreement
                with RoomBridge and agree to abide by the terms set out below.
              </p>
            </div>

            {SECTIONS.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="scroll-mt-24 space-y-3"
                itemProp="articleSection"
              >
                <h3 className="text-base font-extrabold text-[#012D1D] tracking-tight flex items-center gap-2">
                  {sec.icon}
                  {sec.title}
                </h3>
                <div className="bg-[#F9F7F2] rounded-2xl p-5 border border-gray-100/80">
                  <p className="text-gray-600 text-sm leading-[1.85] font-medium">
                    {sec.text}
                  </p>
                </div>
              </section>
            ))}

            {/* ─── Summary Table ─── */}
            <div className="border-t border-gray-100 pt-8 space-y-4">
              <h3 className="text-[#012D1D] font-serif text-lg font-bold">Quick Reference Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#012D1D] text-white">
                      <th className="text-left p-3 rounded-tl-xl font-bold">Topic</th>
                      <th className="text-left p-3 rounded-tr-xl font-bold">Key Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Platform", "roombridge.site — Room Rental & Roommate Matching in Pakistan"],
                      ["Who Can Use", "Adults 18+ with legal capacity under Pakistani law"],
                      ["User Responsibility", "Accurate listings, truthful profiles, safe communication"],
                      ["RoomBridge Role", "Technology platform only — not a party to rental agreements"],
                      ["Governing Law", "Laws of the Islamic Republic of Pakistan"],
                      ["Disputes", "Competent courts of Pakistan"],
                      ["Contact", "hello@roombridge.site"],
                    ].map(([topic, point], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F9F7F2]"}>
                        <td className="p-3 font-bold text-[#012D1D]">{topic}</td>
                        <td className="p-3 text-gray-600">{point}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Disclaimer ─── */}
            <div className="border-t border-gray-100 pt-6 space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Legal Disclaimer</p>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                This page is provided for informational purposes and reflects RoomBridge's platform
                policies. It does not constitute formal legal advice. For matters involving tenancy
                law, property disputes, or compliance under Pakistani regulations, we recommend
                consulting a qualified legal professional. RoomBridge is a technology platform
                facilitating connections between room seekers and property owners in Pakistan and
                does not act as a real estate agent, broker, or legal representative.
              </p>
              <p className="text-xs text-gray-400 font-medium">
                &copy; {new Date().getFullYear()} RoomBridge. All rights reserved. roombridge.site
              </p>
            </div>

          </article>
        </div>
      </section>

    </div>
  );
};

export default TermsPage;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiShieldCheckLine,
  RiTimeLine,
  RiArrowRightSLine,
  RiLockPasswordLine,
  RiUserSharedLine,
  RiDatabase2Line,
  RiQuestionAnswerLine,
  RiMailLine,
  RiMapPinLine,
} from "react-icons/ri";
import { useSEO } from "../../hooks/useSEO";

const PrivacyPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  // SEO Meta & JSON-LD Structured Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does RoomBridge protect personal data for room rentals in Pakistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "RoomBridge enforces SSL encryption, password hashing, and secure token authentication under the Prevention of Electronic Crimes Act (PECA 2016) to ensure user data, room listing records, and messages remain secure across Pakistan."
        }
      },
      {
        "@type": "Question",
        "name": "Is my identity and contact information shared with property owners before booking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. RoomBridge protects seeker privacy. Direct contact details are shared only when a booking request is officially confirmed or initiated via our secure in-app messaging system."
        }
      },
      {
        "@type": "Question",
        "name": "Can international students and expatriates use RoomBridge safely?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! RoomBridge adheres to international privacy standards including GDPR principles, ensuring transparent data handling, right to deletion, and strict consent controls for overseas and local users."
        }
      },
      {
        "@type": "Question",
        "name": "How can I request deletion of my RoomBridge account and personal data?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can request account and listing data deletion anytime by sending an email to contact.roombridge@gmail.com. We process deletion requests within 5 business days."
        }
      }
    ]
  };

  useSEO({
    title: "Privacy Policy | RoomBridge Pakistan Room Rental & Roommate Protection",
    description: "Read RoomBridge's official Privacy Policy. Discover how we protect personal data, room listings, lifestyle preferences, and user privacy for room rentals across Pakistan and internationally.",
    keywords: "RoomBridge privacy policy, room rental privacy Pakistan, student hostel security Lahore, roommate finder data protection, PECA 2016 compliance, verified room listings Pakistan, GDPR room rental",
    canonical: "https://roombridge.site/privacy-policy",
    schema: faqSchema
  });

  const SECTIONS = [
    {
      id: "scope",
      title: "1. Scope & Applicability",
      icon: <RiShieldCheckLine className="text-[#FFAB69] text-xl" />,
      content: [
        "This Privacy Policy applies to all individuals, student accommodation seekers, property owners, and international visitors accessing roombridge.site or associated mobile interfaces across Pakistan (Lahore, Karachi, Islamabad, Rawalpindi, Bahawalpur, Faisalabad, Multan, Peshawar) and overseas.",
        "RoomBridge is committed to operating with complete transparency, preserving user privacy, and ensuring compliance with the Prevention of Electronic Crimes Act 2016 (PECA), Electronic Transactions Ordinance 2002, and global privacy principles (including GDPR)."
      ]
    },
    {
      id: "collect",
      title: "2. Information We Collect",
      icon: <RiDatabase2Line className="text-[#FFAB69] text-xl" />,
      content: [
        "To provide accurate roommate matching and verified room listings, RoomBridge collects essential data directly provided by users during account setup and interaction:"
      ],
      bullets: [
        "Account & Verification Data: Full name, email address, mobile phone number, role (Seeker, Owner, Admin), and encrypted password credentials.",
        "Lifestyle & Roommate Preferences: Sleep schedule, study/work habits, dietary preferences, smoking choices, cleanliness scale, and university or company affiliation.",
        "Listing Information: Property address, neighborhood details, monthly rent rate, deposit terms, amenity checklists, and uploaded room photos.",
        "Communication & Usage: In-app chat logs between seekers and landlords, reported listing tickets, and room alert email preferences."
      ]
    },
    {
      id: "usage",
      title: "3. How We Use Your Data",
      icon: <RiUserSharedLine className="text-[#FFAB69] text-xl" />,
      content: [
        "We handle personal data strictly for legitimate operational purposes to connect room seekers with compatible roommates and verified property owners:"
      ],
      bullets: [
        "Smart Matching Algorithm: Calculating percentage compatibility scores between room seekers based on lifestyle questionnaire responses.",
        "Booking & Reservation Facilitation: Allowing room seekers to submit structured booking requests and enable safe owner communication.",
        "Automated Room Alerts: Notifying subscribed users when new verified rooms matching their budget and city criteria become available.",
        "Trust & Safety Enforcement: Conducting automated and manual review of listings to prevent rental fraud and fake profiles."
      ]
    },
    {
      id: "security",
      title: "4. Data Security & Technical Safeguards",
      icon: <RiLockPasswordLine className="text-[#FFAB69] text-xl" />,
      content: [
        "Security is embedded into every layer of the RoomBridge platform architecture. We utilize industry-standard TLS encryption, secure httpOnly session cookies, bcrypt password hashing, and CSRF token defenses.",
        "While digital transmissions cannot guarantee 100% immunity, our dedicated infrastructure safeguards personal user data against unauthorized access, leakages, or unlawful alteration."
      ]
    },
    {
      id: "cookies",
      title: "5. Cookies & Local Storage",
      icon: <RiDatabase2Line className="text-[#FFAB69] text-xl" />,
      content: [
        "RoomBridge utilizes essential functional cookies to keep users securely logged in during their sessions and maintain search filter state. We do not use intrusive third-party cross-site tracker cookies.",
        "Users can clear cookies through browser settings at any time; however, disabling essential cookies may impact authentication features on roombridge.site."
      ]
    },
    {
      id: "rights",
      title: "6. User Privacy Rights & Controls",
      icon: <RiShieldCheckLine className="text-[#FFAB69] text-xl" />,
      content: [
        "Regardless of whether you are located in Pakistan or internationally, RoomBridge grants you explicit control over your personal information:"
      ],
      bullets: [
        "Access & Rectification: View and update your profile, preferences, or listings via your user dashboard at any time.",
        "Data Erasure: Submit a formal request to permanently delete your account, listings, and messages from our servers.",
        "Alert Unsubscribe: Manage or cancel email room alert dispatches with a single click."
      ]
    }
  ];

  const FAQS = [
    {
      q: "How does RoomBridge protect personal data for room rentals in Pakistan?",
      a: "RoomBridge enforces SSL encryption, password hashing, and secure token authentication under the Prevention of Electronic Crimes Act (PECA 2016) to ensure user data, room listing records, and messages remain secure across Pakistan."
    },
    {
      q: "Is my identity and contact information shared with property owners before booking?",
      a: "No. RoomBridge protects seeker privacy. Direct contact details are shared only when a booking request is officially confirmed or initiated via our secure in-app messaging system."
    },
    {
      q: "Can international students and expatriates use RoomBridge safely?",
      a: "Yes! RoomBridge adheres to international privacy standards including GDPR principles, ensuring transparent data handling, right to deletion, and strict consent controls for overseas and local users."
    },
    {
      q: "How can I request deletion of my RoomBridge account and personal data?",
      a: "You can request account and listing data deletion anytime by sending an email to contact.roombridge@gmail.com. We process deletion requests within 5 business days."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] font-sans pb-16">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pt-20 pb-24 text-white bg-[#012D1D]">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06] bg-[#FFAB69] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04] bg-[#8E4E14] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-white/10 bg-white/5 text-[#FFAB69]">
            <RiShieldCheckLine className="text-sm" /> RoomBridge Legal Framework
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-tight">
            Privacy Policy & Data Security
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Your trust and privacy are paramount. Discover how RoomBridge safeguards room rental
            listings, roommate preferences, and user data across Pakistan and internationally.
          </p>
          <p className="text-white/50 text-xs font-semibold flex items-center justify-center gap-1.5">
            <RiTimeLine className="text-base" /> Effective Date: April 18, 2026 &nbsp;·&nbsp; Last Updated: July 31, 2026
          </p>
        </div>
      </section>

      {/* ─── SEO Overview Card ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 sm:p-8 space-y-3">
          <h2 className="text-[#012D1D] font-serif text-xl sm:text-2xl font-bold">
            Data Protection Standards for Room Rentals & Roommate Finder in Pakistan
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed font-medium">
            RoomBridge (roombridge.site) is Pakistan’s leading digital platform connecting university students,
            working professionals, and families with verified rooms for rent and compatible roommates in Lahore,
            Karachi, Islamabad, Rawalpindi, Bahawalpur, and beyond. This document sets out our privacy commitment under
            Pakistani statutory laws (PECA 2016) and international privacy frameworks.
          </p>
        </div>
      </section>

      {/* ─── Main Content Grid ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-4 hidden lg:block sticky top-24">
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-[#012D1D] font-serif text-lg font-bold border-b border-gray-100 pb-3">
                Policy Sections
              </h3>
              <nav className="flex flex-col gap-1 text-xs">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-gray-600 hover:text-[#012D1D] hover:bg-[#F9F7F2] transition-all"
                  >
                    <span>{sec.title.slice(3)}</span>
                    <RiArrowRightSLine className="text-base opacity-60" />
                  </a>
                ))}
                <a
                  href="#faq-section"
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-gray-600 hover:text-[#012D1D] hover:bg-[#F9F7F2] transition-all"
                >
                  <span>Frequently Asked Questions</span>
                  <RiArrowRightSLine className="text-base opacity-60" />
                </a>
              </nav>

              <div className="border-t border-gray-100 pt-4">
                <Link
                  to="/terms-and-conditions"
                  className="flex items-center justify-between text-xs font-bold text-[#012D1D] hover:text-[#FFAB69] transition-colors"
                >
                  <span>View Terms & Conditions</span>
                  <RiArrowRightSLine />
                </Link>
              </div>
            </div>
          </aside>

          {/* Policy Text & FAQ */}
          <article className="lg:col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-6 sm:p-10 space-y-8">
            {SECTIONS.map((sec) => (
              <section key={sec.id} id={sec.id} className="scroll-mt-24 space-y-3">
                <h3 className="text-lg font-extrabold text-[#012D1D] tracking-tight flex items-center gap-2">
                  {sec.icon}
                  {sec.title}
                </h3>
                <div className="bg-[#F9F7F2] rounded-2xl p-5 border border-gray-100/80 space-y-3">
                  {sec.content.map((p, idx) => (
                    <p key={idx} className="text-gray-600 text-sm leading-relaxed font-medium">
                      {p}
                    </p>
                  ))}
                  {sec.bullets && (
                    <ul className="list-disc pl-5 text-gray-600 text-sm space-y-2 font-medium">
                      {sec.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            {/* ─── Frequently Asked Questions ─── */}
            <section id="faq-section" className="scroll-mt-24 border-t border-gray-100 pt-8 space-y-4">
              <div className="flex items-center gap-2">
                <RiQuestionAnswerLine className="text-[#FFAB69] text-2xl" />
                <h3 className="text-xl font-serif font-bold text-[#012D1D]">
                  Frequently Asked Questions (Privacy & Data Security)
                </h3>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div
                      key={index}
                      className="border border-gray-200/80 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left text-sm font-bold text-[#012D1D] bg-[#F9F7F2] hover:bg-[#F0EBE1] transition-colors"
                      >
                        <span>{faq.q}</span>
                        <RiArrowRightSLine
                          className={`text-lg transition-transform duration-200 ${
                            isOpen ? "rotate-90 text-[#8E4E14]" : "text-gray-400"
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="p-4 bg-white text-xs sm:text-sm text-gray-600 leading-relaxed font-medium border-t border-gray-100">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── Contact Desk ─── */}
            <div className="border-t border-gray-100 pt-6 bg-[#012D1D]/5 rounded-2xl p-5 space-y-2">
              <h4 className="text-sm font-bold text-[#012D1D] flex items-center gap-2">
                <RiMailLine className="text-[#8E4E14]" /> Privacy & Compliance Contact Desk
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                If you have queries, data deletion requests, or privacy concerns regarding roombridge.site, please reach out to us:
              </p>
              <div className="text-xs text-[#012D1D] font-bold space-y-1">
                <p className="flex items-center gap-1.5">
                  <RiMailLine /> contact.roombridge@gmail.com
                </p>
                <p className="flex items-center gap-1.5">
                  <RiMapPinLine /> Khanpur, Rahim Yar Khan, Punjab, Pakistan
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;

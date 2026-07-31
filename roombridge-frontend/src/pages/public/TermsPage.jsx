import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiBookmark3Line,
  RiTimeLine,
  RiArrowRightSLine,
  RiShieldCheckLine,
  RiUserLine,
  RiHome4Line,
  RiMessage2Line,
  RiProhibited2Line,
  RiAlertLine,
  RiScalesLine,
  RiRefreshLine,
  RiMailLine,
  RiQuestionAnswerLine,
} from "react-icons/ri";
import { useSEO } from "../../hooks/useSEO";

const TermsPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  // SEO Meta & JSON-LD Structured Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What laws govern RoomBridge room rental terms in Pakistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "RoomBridge terms are governed under the laws of the Islamic Republic of Pakistan, including the Contract Act 1872, Electronic Transactions Ordinance 2002, and provincial tenancy regulation frameworks."
        }
      },
      {
        "@type": "Question",
        "name": "Are RoomBridge booking requests legally binding tenancy contracts?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Booking requests on RoomBridge facilitate initial communication between room seekers and property owners. Parties are advised to execute formal written lease contracts under Pakistani tenancy laws before move-in."
        }
      },
      {
        "@type": "Question",
        "name": "Who is eligible to create an account and list rooms on RoomBridge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Individuals aged 18 years or older with full legal capacity can register as room seekers or property owners. Listings must be accurate, non-discriminatory, and physically verified."
        }
      },
      {
        "@type": "Question",
        "name": "How does RoomBridge deal with fraudulent listings or policy violations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "RoomBridge immediately removes fake or unverified listings, bans offending accounts, and reports serious fraud to Pakistani law enforcement authorities."
        }
      }
    ]
  };

  useSEO({
    title: "Terms & Conditions | RoomBridge Pakistan Room Rental Platform",
    description: "Read RoomBridge's Terms and Conditions. Learn your rights, rules, landlord obligations, and legal standards when searching for room rentals or roommates on roombridge.site.",
    keywords: "RoomBridge terms and conditions, room rental terms Pakistan, student hostel rules Lahore, roommate matching legal agreement, tenancy act Pakistan, roombridge.site legal, online room booking rules",
    canonical: "https://roombridge.site/terms-and-conditions",
    schema: faqSchema
  });

  const SECTIONS = [
    {
      id: "acceptance",
      icon: <RiShieldCheckLine className="text-[#FFAB69] text-xl" />,
      title: "1. Acceptance of Agreement",
      text: "By accessing, browsing, or creating an account on RoomBridge (roombridge.site) — whether from Pakistan or internationally — you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any provision herein, you must immediately cease using the platform."
    },
    {
      id: "eligibility",
      icon: <RiUserLine className="text-[#FFAB69] text-xl" />,
      title: "2. User Registration & Eligibility",
      text: "Users must be at least 18 years old and possess full legal authority to enter into contracts under Pakistani law. You agree that all details submitted during profile or listing creation — including name, university/workplace status, contact numbers, and identification — are completely truthful and current."
    },
    {
      id: "listings",
      icon: <RiHome4Line className="text-[#FFAB69] text-xl" />,
      title: "3. Property Listing Standards & Owner Duties",
      text: "Landlords and property owners who list rooms, flats, or hostel accommodations on RoomBridge are solely responsible for ensuring listing accuracy, physical availability, and compliance with local municipal housing codes in Pakistan. Listings must not contain deceptive pricing, fake photos, or discriminatory restrictions. RoomBridge reserves the right to unpublish non-compliant listings."
    },
    {
      id: "bookings",
      icon: <RiMessage2Line className="text-[#FFAB69] text-xl" />,
      title: "4. Booking Requests & Communication",
      text: "RoomBridge provides structured booking request and in-app chat systems to assist initial connections between room seekers and property owners. RoomBridge does not act as a landlord, tenancy agent, or legal party to individual rental contracts. Room seekers and owners must independently verify property conditions and sign standard rental deeds under local Pakistani Tenancy Acts."
    },
    {
      id: "prohibited",
      icon: <RiProhibited2Line className="text-[#FFAB69] text-xl" />,
      title: "5. Prohibited Conduct & Fraud Prevention",
      text: "Users must not post fraudulent listings, impersonate other individuals, upload malicious files, scrape platform content, or engage in harassment. Any attempt to commit financial fraud, subleasing scams, or spam will result in immediate profile suspension and reporting to law enforcement."
    },
    {
      id: "liability",
      icon: <RiAlertLine className="text-[#FFAB69] text-xl" />,
      title: "6. Limitation of Liability",
      text: "RoomBridge is provided on an 'as is' and 'as available' basis. To the maximum extent permitted by Pakistani law, RoomBridge disclaims all warranties regarding listing accuracy or tenant conduct. RoomBridge is not liable for private tenancy disputes, security deposit disagreements, or physical property damages."
    },
    {
      id: "governing",
      icon: <RiScalesLine className="text-[#FFAB69] text-xl" />,
      title: "7. Governing Law & Jurisdiction",
      text: "These terms are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, including the Contract Act 1872 and Electronic Transactions Ordinance 2002. Any legal claims or disputes shall be submitted exclusively to the competent courts of Pakistan."
    },
    {
      id: "updates",
      icon: <RiRefreshLine className="text-[#FFAB69] text-xl" />,
      title: "8. Amendments & Updates",
      text: "RoomBridge reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to roombridge.site with an updated effective date."
    }
  ];

  const FAQS = [
    {
      q: "What laws govern RoomBridge room rental terms in Pakistan?",
      a: "RoomBridge terms are governed under the laws of the Islamic Republic of Pakistan, including the Contract Act 1872, Electronic Transactions Ordinance 2002, and provincial tenancy regulation frameworks."
    },
    {
      q: "Are RoomBridge booking requests legally binding tenancy contracts?",
      a: "No. Booking requests on RoomBridge facilitate initial communication between room seekers and property owners. Parties are advised to execute formal written lease contracts under Pakistani tenancy laws before move-in."
    },
    {
      q: "Who is eligible to create an account and list rooms on RoomBridge?",
      a: "Individuals aged 18 years or older with full legal capacity can register as room seekers or property owners. Listings must be accurate, non-discriminatory, and physically verified."
    },
    {
      q: "How does RoomBridge deal with fraudulent listings or policy violations?",
      a: "RoomBridge immediately removes fake or unverified listings, bans offending accounts, and reports serious fraud to Pakistani law enforcement authorities."
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
            <RiBookmark3Line className="text-sm" /> Legal Service Agreement
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-tight">
            Terms & Conditions
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Please read these terms carefully. They govern your use of roombridge.site for finding
            rooms for rent, listing properties, and connecting with compatible roommates.
          </p>
          <p className="text-white/50 text-xs font-semibold flex items-center justify-center gap-1.5">
            <RiTimeLine className="text-base" /> Effective Date: April 18, 2026 &nbsp;·&nbsp; Last Updated: July 31, 2026
          </p>
        </div>
      </section>

      {/* ─── Overview Section ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 sm:p-8 space-y-3">
          <h2 className="text-[#012D1D] font-serif text-xl sm:text-2xl font-bold">
            Platform Regulations — Room Rentals & Roommate Matching in Pakistan
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed font-medium">
            RoomBridge provides a modern, technology-driven ecosystem designed to make finding shared rooms,
            student hostels, and compatible roommates seamless and secure. Whether you are searching for housing near
            universities in Lahore, Islamabad, or Karachi, or listing rental units as a property owner, these Terms and
            Conditions protect all parties on roombridge.site.
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
                Document Sections
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
                  to="/privacy-policy"
                  className="flex items-center justify-between text-xs font-bold text-[#012D1D] hover:text-[#FFAB69] transition-colors"
                >
                  <span>View Privacy Policy</span>
                  <RiArrowRightSLine />
                </Link>
              </div>
            </div>
          </aside>

          {/* Terms Content & FAQ */}
          <article className="lg:col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-6 sm:p-10 space-y-8">
            {SECTIONS.map((sec) => (
              <section key={sec.id} id={sec.id} className="scroll-mt-24 space-y-3">
                <h3 className="text-base sm:text-lg font-extrabold text-[#012D1D] tracking-tight flex items-center gap-2">
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

            {/* ─── Summary Reference Table ─── */}
            <div className="border-t border-gray-100 pt-8 space-y-4">
              <h3 className="text-[#012D1D] font-serif text-lg font-bold">Quick Summary Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#012D1D] text-white">
                      <th className="text-left p-3 rounded-tl-xl font-bold">Subject</th>
                      <th className="text-left p-3 rounded-tr-xl font-bold">Key Terms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Website", "roombridge.site — Verified Room Rental & Roommate Matching in Pakistan"],
                      ["Eligibility", "Adults 18+ with legal contract capacity under Pakistani law"],
                      ["Room Owners", "Must submit accurate descriptions, real photos, and fair rental pricing"],
                      ["Seekers", "Must present truthful profile info and respect property guidelines"],
                      ["Jurisdiction", "Governed by Pakistani law and competent local courts"],
                      ["Support Desk", "contact.roombridge@gmail.com"]
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

            {/* ─── Frequently Asked Questions ─── */}
            <section id="faq-section" className="scroll-mt-24 border-t border-gray-100 pt-8 space-y-4">
              <div className="flex items-center gap-2">
                <RiQuestionAnswerLine className="text-[#FFAB69] text-2xl" />
                <h3 className="text-xl font-serif font-bold text-[#012D1D]">
                  Frequently Asked Questions (Terms & Regulations)
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

            {/* ─── Legal Disclaimer ─── */}
            <div className="border-t border-gray-100 pt-6 space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Legal Disclaimer</p>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                This document is provided for informational and contractual purposes governing platform access.
                For formal tenancy agreements, rental deed execution, or local property disputes in Pakistan,
                parties should seek independent legal counsel.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;

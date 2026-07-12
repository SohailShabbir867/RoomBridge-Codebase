import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  RiShieldCheckLine,
  RiTimeLine,
  RiArrowRightSLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { useSEO } from "../../hooks/useSEO";

const PrivacyPage = () => {
  useSEO({
    title: "Privacy Policy | RoomBridge Pakistan",
    description: "Read the RoomBridge Privacy Policy for Pakistan users to understand how we collect, use, protect, and process personal data on roombridge.site.",
    keywords: "RoomBridge privacy policy, data protection, personal data, room rental privacy, roombridge.site"
  });

  const SECTIONS = [
    {
      id: "collect",
      title: "1. Information We Collect",
      paragraphs: [
        "We collect personal information that you provide directly to us when using the RoomBridge platform. This occurs during account registration, profile setup, listing creation, or when communicating with other users.",
        "Specifically, the types of data we collect include:"
      ],
      bullets: [
        "Account Credentials: Full name, email address, password, phone number, and account role (Seeker, Owner, or Admin).",
        "Profile & Match Information: User bios, university details, room preferences, and roommate compatibility answers.",
        "Listings Data: Room addresses, rent pricing, descriptions, facilities, and uploaded photos (restricted to 4 photos per listing).",
        "Activity & Messages: Chat history, user reports, and newsletter/room alert subscription history."
      ]
    },
    {
      id: "use",
      title: "2. How We Use Information",
      paragraphs: [
        "The information we collect is processed to run, improve, and secure RoomBridge.site, ensuring matching safety for roommates and tenants.",
        "We utilize this data for the following purposes:"
      ],
      bullets: [
        "Core App Service: Facilitating roommate matches, computing compatibility ratings, and managing booking reservations.",
        "Communications & Updates: Distributing automated room alerts (when new listings match your criteria) and system notification updates.",
        "Safety & Verification: Conducting manual listing reviews, maintaining security logs, and managing platform guidelines."
      ]
    },
    {
      id: "sharing",
      title: "3. Data Sharing & Disclosure",
      paragraphs: [
        "RoomBridge.site is not in the business of selling user data. We share information only in specific circumstances to enable smooth operations:"
      ],
      bullets: [
        "Direct User Contacts: Sharing listing details and landlord/seeker details when bookings are requested or approved.",
        "Third-Party Services: External hosting, media management (Cloudinary), or secure transactional mailing integrations.",
        "Legal Mandates: Cooperating with Pakistani law enforcement agencies, or in response to regulatory audits under the Prevention of Electronic Crimes Act (PECA)."
      ]
    },
    {
      id: "cookies",
      title: "4. Cookies and Local Sessions",
      paragraphs: [
        "We utilize functional cookies and session tokens to preserve authentication sessions."
      ],
      bullets: [
        "Authentication Cookies: Keeping your profile logged in securely without re-entering credentials on every tab.",
        "Security Measures: Cross-Site Request Forgery (CSRF) tokens to protect forms from spoofing."
      ]
    },
    {
      id: "security",
      title: "5. Data Security & Storage",
      paragraphs: [
        "We implement server-side safeguards to protect user records against unauthorized access, disclosure, or alteration.",
        "While we apply SSL encryption and secure password hashing, no network transfer can be completely bulletproof. We recommend using unique passwords and enabling alert notifications."
      ]
    },
    {
      id: "location",
      title: "6. Data Location & Retention",
      paragraphs: [
        "Your data is stored and processed securely. We retain account data as long as your profile is active.",
        "You may request deletion or deactivation of your account and listing records at any time by contacting support."
      ]
    },
    {
      id: "rights",
      title: "7. Your Choices & Privacy Rights",
      paragraphs: [
        "Users have total control over their data footprint:"
      ],
      bullets: [
        "Data Access: Reviewing your active profile metadata, saved properties, and listings.",
        "Alert Management: Instantly subscribing or unsubscribing from our footer alert dispatch system.",
        "Account Purges: Submitting a request to clean personal logs and listing histories."
      ]
    },
    {
      id: "updates",
      title: "8. Policy Updates",
      paragraphs: [
        "We reserve the right to modify this privacy policy to reflect platform updates or legal shifts. Any revisions will be accompanied by an updated effective date at the top."
      ]
    },
    {
      id: "contact",
      title: "9. Contact Information",
      paragraphs: [
        "For questions, concerns, or data inquiries regarding this Privacy Policy, please reach out to our privacy compliance desk:"
      ],
      bullets: [
        "Email Address: contact.roombridge@gmail.com",
        "Mailing Address: Khanpur, Rahim Yar Khan, Punjab, Pakistan"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] font-sans pb-16">
      
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pt-20 pb-24 text-white bg-[#012D1D]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06] bg-[#FFAB69] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04] bg-[#8E4E14] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-white/10 bg-white/5 text-[#FFAB69]">
            <RiShieldCheckLine className="text-sm" /> Legal Framework
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-tight">
            Privacy Policy
          </h1>
          <p className="text-white/60 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5">
            <RiTimeLine className="text-base" /> Effective Date: April 18, 2026
          </p>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar index */}
          <aside className="lg:col-span-4 hidden lg:block sticky top-24">
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-[#012D1D] font-serif text-lg font-bold border-b border-gray-100 pb-3">
                Document Sections
              </h2>
              <nav className="flex flex-col gap-1 text-xs">
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
            </div>
          </aside>

          {/* Policy Text Card */}
          <article className="lg:col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-6 sm:p-10 space-y-8">
            
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-[#012D1D] font-serif text-2xl font-bold">
                Introduction
              </h2>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed font-medium">
                At RoomBridge, we prioritize the protection and security of your personal data. 
                This privacy policy describes how we collect, use, process, and protect your information 
                in compliance with the laws of Pakistan.
              </p>
            </div>

            {SECTIONS.map((sec) => (
              <section key={sec.id} id={sec.id} className="scroll-mt-24 space-y-3">
                <h3 className="text-lg font-extrabold text-[#012D1D] tracking-tight">
                  {sec.title}
                </h3>
                <div className="bg-[#F9F7F2] rounded-2xl p-5 border border-gray-50/50 space-y-3">
                  {sec.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-gray-600 text-sm leading-relaxed font-medium">
                      {p}
                    </p>
                  ))}
                  {sec.bullets && (
                    <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1.5 font-medium">
                      {sec.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            {/* Disclaimer */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Disclaimer
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">
                This page is provided for general information purposes only and does not constitute formal legal advice. 
                For legal advice or details regarding local compliance, consult with qualified legal professionals in Pakistan.
              </p>
            </div>

          </article>

        </div>
      </section>

    </div>
  );
};

export default PrivacyPage;

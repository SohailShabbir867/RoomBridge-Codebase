import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  RiShieldCheckLine,
  RiTimeLine,
  RiArrowRightSLine,
  RiExternalLinkLine,
} from "react-icons/ri";

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
      "Read the RoomBridge Privacy Policy for Pakistan users to understand how we collect, use, protect, and process personal data."
    );
    setMetaTag(
      "keywords",
      "RoomBridge privacy policy, data protection, personal data, room rental privacy"
    );
  }, []);

  const SECTIONS = [
    { id: "collect", title: "1. Information We Collect", text: "We may collect account data (name, email, phone), profile information, listing details, booking activity, and messages exchanged within the platform." },
    { id: "use", title: "2. How We Use Information", text: "We use information to provide platform features, improve security, process requests, communicate service updates, and support legal and moderation requirements under applicable Pakistani law." },
    { id: "sharing", title: "3. Data Sharing", text: "We do not sell personal data. We may share data with service providers required to operate RoomBridge (for example, hosting, media, and communication providers) and where required by Pakistani law, regulatory process, or lawful authority." },
    { id: "cookies", title: "4. Cookies and Sessions", text: "RoomBridge uses essential cookies/session mechanisms for login, security, and platform functionality. Disabling cookies may affect normal service behavior." },
    { id: "security", title: "5. Data Security", text: "We apply technical and organizational safeguards to protect data. No internet-based system can guarantee absolute security, but we continuously improve controls and monitoring." },
    { id: "location", title: "6. Data Location and Transfers", text: "Your data may be processed on servers in Pakistan or in other jurisdictions used by our service providers. Where transfers are needed, we apply reasonable safeguards consistent with applicable law." },
    { id: "rights", title: "7. Your Rights", text: "You can request correction or deletion of account information, subject to legal and operational obligations. Contact our support team for privacy-related requests." },
    { id: "updates", title: "8. Policy Updates", text: "We may revise this policy from time to time. Updates are posted on this page with the latest effective date." },
    { id: "contact", title: "9. Contact Support", text: "For privacy questions, contact us at hello@roombridge.pk." }
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
                <div className="bg-[#F9F7F2] rounded-2xl p-5 border border-gray-50/50">
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    {sec.text}
                  </p>
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

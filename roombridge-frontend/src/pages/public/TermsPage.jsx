import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  RiBookmark3Line,
  RiTimeLine,
  RiArrowRightSLine,
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

const TermsPage = () => {
  useEffect(() => {
    document.title = "Terms and Conditions | RoomBridge Pakistan";
    setMetaTag(
      "description",
      "Read RoomBridge Terms and Conditions for users in Pakistan, including account use, listings, bookings, and legal responsibilities."
    );
    setMetaTag(
      "keywords",
      "RoomBridge terms, terms and conditions, rental platform terms, Pakistan room rental"
    );
  }, []);

  const SECTIONS = [
    { id: "acceptance", title: "1. Acceptance of Terms", text: "By accessing or using RoomBridge, you agree to these Terms and Conditions. If you do not agree, please do not use the platform." },
    { id: "accounts", title: "2. User Accounts", text: "You are responsible for maintaining account security and ensuring information provided is accurate and up to date. You must be legally allowed to use this service under applicable Pakistani law and must have legal capacity to enter into agreements." },
    { id: "listings", title: "3. Listings and Content", text: "Owners are responsible for listing accuracy, lawful content, and compliance with Pakistani local regulations. RoomBridge may review, reject, or remove content that violates platform policies." },
    { id: "bookings", title: "4. Bookings and Communication", text: "Booking requests and in-app messaging are provided to facilitate communication between users. RoomBridge is not a party to private agreements between owners and seekers." },
    { id: "prohibited", title: "5. Prohibited Activities", text: "Users must not post fraudulent information, harass others, distribute harmful content, or attempt unauthorized access to systems or accounts." },
    { id: "liability", title: "6. Limitation of Liability", text: "RoomBridge provides the platform on an \"as is\" basis. To the maximum extent permitted by law, RoomBridge is not liable for indirect losses, disputes, or damages arising from user interactions." },
    { id: "governing", title: "7. Governing Law and Jurisdiction", text: "These terms are governed by the laws of Pakistan. Any dispute relating to the use of RoomBridge will be subject to the courts of Pakistan, unless otherwise required by applicable law." },
    { id: "updates", title: "8. Updates to Terms", text: "We may update these terms from time to time. Continued use after updates means you accept the revised terms." },
    { id: "contact", title: "9. Contact Support", text: "For legal questions regarding these terms, contact us at hello@roombridge.site." }
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
            <RiBookmark3Line className="text-sm" /> Service Agreement
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-tight">
            Terms & Conditions
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
                Terms of Use
              </h2>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed font-medium">
                Welcome to RoomBridge. Please read these Terms and Conditions carefully. 
                They govern your access and use of our platform, services, apps, and website.
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

export default TermsPage;

import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  RiTimeLine,
  RiArrowLeftLine,
  RiShareLine,
  RiTwitterXLine,
  RiFacebookBoxLine,
  RiWhatsappLine,
  RiFileCopyLine,
  RiCheckLine,
  RiQuestionAnswerLine,
  RiHome4Line,
  RiShieldCheckLine,
  RiArrowRightLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import { useSEO } from "../../hooks/useSEO";
import { BLOG_POSTS } from "../../data/blogData";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const post = BLOG_POSTS.find((p) => p.slug === slug);

  // Fallback if slug not found
  if (!post) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-sm space-y-4">
          <h2 className="text-2xl font-serif font-bold text-[#012D1D]">Article Not Found</h2>
          <p className="text-sm text-gray-500">The housing guide or blog article you requested does not exist.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#012D1D] text-white text-xs font-bold"
          >
            <RiArrowLeftLine /> Back to Blog Hub
          </Link>
        </div>
      </div>
    );
  }

  // Related Articles
  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 2);

  // Structured Data (BlogPosting Schema)
  const postingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "image": post.coverImage,
    "datePublished": "2026-07-28",
    "author": {
      "@type": "Person",
      "name": post.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "RoomBridge",
      "logo": {
        "@type": "ImageObject",
        "url": "https://roombridge.site/favicon.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://roombridge.site/blog/${post.slug}`
    }
  };

  useSEO({
    title: `${post.title} | RoomBridge Housing Guides`,
    description: post.summary,
    keywords: post.keywords.join(", "),
    canonical: `https://roombridge.site/blog/${post.slug}`,
    ogImage: post.coverImage,
    ogType: "article",
    schema: postingSchema
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Article link copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] font-sans pb-16">
      {/* ─── Top Breadcrumb Bar ─── */}
      <div className="bg-[#012D1D] text-white/70 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-semibold">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{post.title}</span>
        </div>
      </div>

      {/* ─── Article Header ─── */}
      <section className="bg-[#012D1D] text-white pt-10 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/10 text-[#FFAB69]">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif leading-tight">
            {post.title}
          </h1>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed font-medium">
            {post.subtitle}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
              />
              <div className="text-xs">
                <p className="font-bold text-white">{post.author.name}</p>
                <p className="text-white/60">{post.author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/60 font-semibold">
              <span className="flex items-center gap-1">
                <RiTimeLine className="text-sm text-[#FFAB69]" /> {post.readTime}
              </span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Cover Image ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="rounded-[24px] overflow-hidden shadow-xl aspect-[16/9] border-4 border-white">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Article Body */}
          <article className="lg:col-span-12 bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8">
            
            {/* Intro Summary Callout */}
            <div className="bg-[#F9F7F2] rounded-2xl p-5 border-l-4 border-[#8E4E14] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E4E14]">Article Summary</h3>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {post.summary}
              </p>
            </div>

            {/* Sections */}
            {post.content.map((sec, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#012D1D]">
                  {sec.heading}
                </h2>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-line">
                  {sec.body}
                </p>
              </section>
            ))}

            {/* Internal Link Banner */}
            <div className="bg-[#012D1D] rounded-2xl p-6 text-white space-y-3">
              <div className="flex items-center gap-2">
                <RiHome4Line className="text-[#FFAB69] text-xl" />
                <h3 className="font-serif text-lg font-bold">Find Verified Rooms in Your City</h3>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                Browse verified room listings for students and professionals across major cities in Pakistan.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Lahore", "Islamabad", "Karachi", "Rawalpindi"].map((city) => (
                  <Link
                    key={city}
                    to={`/explore?city=${city}`}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#8E4E14] text-xs font-bold transition-colors"
                  >
                    Rooms in {city} →
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQs */}
            {post.faqs && post.faqs.length > 0 && (
              <section className="border-t border-gray-100 pt-8 space-y-4">
                <div className="flex items-center gap-2">
                  <RiQuestionAnswerLine className="text-[#FFAB69] text-2xl" />
                  <h3 className="text-xl font-serif font-bold text-[#012D1D]">Frequently Asked Questions</h3>
                </div>
                <div className="space-y-3">
                  {post.faqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div key={index} className="border border-gray-200/80 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="w-full flex items-center justify-between p-4 text-left text-sm font-bold text-[#012D1D] bg-[#F9F7F2]"
                        >
                          <span>{faq.q}</span>
                          <RiArrowRightLine className={`transform transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="p-4 bg-white text-xs sm:text-sm text-gray-600 font-medium">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Social Share Bar */}
            <div className="border-t border-gray-100 pt-6 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <RiShareLine /> Share Article
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1"
                >
                  {copied ? <RiCheckLine className="text-emerald-600" /> : <RiFileCopyLine />} Copy Link
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm text-gray-700"
                >
                  <RiTwitterXLine />
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-sm text-emerald-700"
                >
                  <RiWhatsappLine />
                </a>
              </div>
            </div>

          </article>
        </div>

        {/* ─── Related Articles ─── */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 space-y-6">
            <h3 className="text-xl font-serif font-bold text-[#012D1D]">Related Housing Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-4 group"
                >
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#8E4E14]">{rel.category}</span>
                    <h4 className="text-sm font-bold text-[#012D1D] group-hover:text-[#8E4E14] transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <RiTimeLine /> {rel.readTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;

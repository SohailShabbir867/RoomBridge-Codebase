import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiBookOpenLine,
  RiTimeLine,
  RiArrowRightLine,
  RiSearchLine,
  RiPriceTag3Line,
  RiShieldCheckLine,
  RiUser3Line,
} from "react-icons/ri";
import { useSEO } from "../../hooks/useSEO";
import { BLOG_POSTS } from "../../data/blogData";

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Safety & Renting Guides", "Student Housing", "Roommate Finder"];

  // Filter posts
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS[0];

  // Structured Data Schema for Blog
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "RoomBridge Housing & Roommate Guides Pakistan",
    "description": "Expert room rental guides, student hostel comparisons, and roommate matching advice for Pakistan.",
    "url": "https://roombridge.site/blog",
    "publisher": {
      "@type": "Organization",
      "name": "RoomBridge",
      "logo": {
        "@type": "ImageObject",
        "url": "https://roombridge.site/favicon.svg"
      }
    }
  };

  useSEO({
    title: "RoomBridge Blog — Room Rental & Student Housing Guides in Pakistan",
    description: "Explore authoritative guides on finding safe rooms for rent, cheap student hostels near PU, NUST, COMSATS, and roommate matching strategies in Pakistan.",
    keywords: "room for rent Pakistan blog, student housing guides Lahore, room rental safety tips, roommate finder Pakistan guide, hostel booking Islamabad",
    canonical: "https://roombridge.site/blog",
    schema: blogSchema
  });

  return (
    <div className="min-h-screen bg-[#F5F0E6] font-sans pb-16">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pt-20 pb-20 text-white bg-[#012D1D]">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06] bg-[#FFAB69] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04] bg-[#8E4E14] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-5">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-white/10 bg-white/5 text-[#FFAB69]">
            <RiBookOpenLine className="text-sm" /> Knowledge & Guides Hub
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-tight">
            RoomBridge Insights & Guides
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Your comprehensive resource for verified room rentals, student hostel comparisons near universities,
            safety checklists, and compatible roommate matching across Pakistan.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto mt-6">
            <div className="relative flex items-center">
              <RiSearchLine className="absolute left-4 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search topics (e.g. Lahore hostels, NUST, safe rental)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFAB69] shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Filter Pills ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-center flex-wrap gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#012D1D] text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Featured Post Spotlight ─── */}
      {selectedCategory === "All" && !searchQuery && featuredPost && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto relative overflow-hidden">
              <img
                src={featuredPost.coverImage}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-4 left-4 bg-[#012D1D] text-[#FFAB69] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Featured Guide
              </span>
            </div>
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                  <span className="text-[#8E4E14]">{featuredPost.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <RiTimeLine /> {featuredPost.readTime}
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#012D1D] leading-tight hover:text-[#8E4E14] transition-colors">
                  <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  {featuredPost.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={featuredPost.author.avatar}
                    alt={featuredPost.author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-[#012D1D]">{featuredPost.author.name}</p>
                    <p className="text-gray-400">{featuredPost.date}</p>
                  </div>
                </div>
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#012D1D] hover:text-[#8E4E14] transition-colors"
                >
                  Read Article <RiArrowRightLine />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Articles Grid ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#012D1D] mb-6">
          {searchQuery ? `Search Results (${filteredPosts.length})` : "Latest Housing & Renting Articles"}
        </h2>

        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 space-y-3">
            <p className="text-gray-500 font-medium">No articles found matching your query.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-xs font-bold text-[#012D1D] underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-3 left-3 bg-[#012D1D]/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <RiTimeLine /> {post.readTime}
                      </span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#012D1D] leading-snug group-hover:text-[#8E4E14] transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">
                      {post.summary}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-gray-50 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-gray-700">{post.author.name}</span>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-xs font-bold text-[#012D1D] hover:text-[#FFAB69] flex items-center gap-1"
                  >
                    Read <RiArrowRightLine />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ─── SEO Target Keywords Footer Pill Bar ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <RiPriceTag3Line /> Popular Search Cities & Housing Tags
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            {[
              "Rooms for Rent Lahore",
              "Student Hostels Islamabad",
              "Roommate Finder Karachi",
              "Co-Living Rawalpindi",
              "Affordable Hostel Bahawalpur",
              "Girls Hostel Near NUST",
              "Hostels PU Lahore",
              "Verified Room Listings Pakistan"
            ].map((tag, idx) => (
              <Link
                key={idx}
                to={`/explore?keyword=${encodeURIComponent(tag)}`}
                className="bg-[#F9F7F2] hover:bg-[#F0EBE1] px-3 py-1.5 rounded-lg text-gray-700 hover:text-[#012D1D] transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;

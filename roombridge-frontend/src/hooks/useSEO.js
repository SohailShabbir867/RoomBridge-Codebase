import { useEffect } from "react";

/**
 * Reusable React Hook to update page SEO meta tags and structured data dynamically.
 * @param {Object} seoOptions
 * @param {string} seoOptions.title - Page title
 * @param {string} seoOptions.description - Meta description
 * @param {string} seoOptions.keywords - Meta keywords
 * @param {string} [seoOptions.canonical] - Canonical URL
 * @param {string} [seoOptions.ogImage] - Open Graph image URL
 * @param {string} [seoOptions.ogType] - Open Graph type (default: 'website')
 * @param {Object|Array} [seoOptions.schema] - JSON-LD Schema.org object
 */
export const useSEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = "website",
  schema,
}) => {
  useEffect(() => {
    // 1. Document Title
    if (title) {
      document.title = title.includes("RoomBridge") ? title : `${title} — RoomBridge`;
    }

    // Helper function to set or create meta elements
    const setMetaTag = (attrName, attrVal, contentVal) => {
      if (!contentVal) return;
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute("content", contentVal);
    };

    // 2. Meta Tags
    setMetaTag("name", "description", description);
    setMetaTag("name", "keywords", keywords);

    // 3. Open Graph Metadata
    const fullTitle = title ? (title.includes("RoomBridge") ? title : `${title} — RoomBridge`) : undefined;
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", ogType);
    if (ogImage) setMetaTag("property", "og:image", ogImage);
    const currentUrl = canonical || window.location.href;
    setMetaTag("property", "og:url", currentUrl);

    // 4. Twitter Card Metadata
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    if (ogImage) setMetaTag("name", "twitter:image", ogImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonical);
    } else if (canonicalLink) {
      canonicalLink.setAttribute("href", window.location.href);
    }

    // 6. JSON-LD Schema Injection
    let schemaScript = document.getElementById("json-ld-schema");
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.id = "json-ld-schema";
        schemaScript.type = "application/ld+json";
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema, null, 2);
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [title, description, keywords, canonical, ogImage, ogType, schema]);
};


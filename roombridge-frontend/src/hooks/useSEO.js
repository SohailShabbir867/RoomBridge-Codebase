import { useEffect } from "react";

/**
 * Reusable React Hook to update page SEO meta tags dynamically.
 * @param {Object} seoOptions - Title, description, and keywords options.
 */
export const useSEO = ({ title, description, keywords }) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} — RoomBridge`;
    }

    // Handle Meta Description
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement("meta");
      descEl.setAttribute("name", "description");
      document.head.appendChild(descEl);
    }
    if (description) {
      descEl.setAttribute("content", description);
    }

    // Handle Meta Keywords
    let keyEl = document.querySelector('meta[name="keywords"]');
    if (!keyEl) {
      keyEl = document.createElement("meta");
      keyEl.setAttribute("name", "keywords");
      document.head.appendChild(keyEl);
    }
    if (keywords) {
      keyEl.setAttribute("content", keywords);
    }

    // Handle Open Graph Title
    let ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl && title) {
      ogTitleEl.setAttribute("content", `${title} — RoomBridge`);
    }

    // Handle Open Graph Description
    let ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl && description) {
      ogDescEl.setAttribute("content", description);
    }
  }, [title, description, keywords]);
};

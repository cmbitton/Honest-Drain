const SITE_URL_TOKEN = "__SITE_URL__";

function permalink(data) {
  if (data.draft) return false;
  return `/blog/${data.page.fileSlug}/index.html`;
}

function publicUrl(data) {
  return `/blog/${data.page.fileSlug}/`;
}

function dateOnly(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function imageType(value) {
  const extension = String(value || "").split(".").pop().toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/png";
}

module.exports = {
  layout: "layouts/blog-post.njk",
  eleventyComputed: {
    permalink,
    metaTitle: (data) => `${data.title} | Honest Drain`,
    canonical: (data) => `${SITE_URL_TOKEN}${publicUrl(data)}`,
    robots: (data) => (data.draft ? "noindex,nofollow" : "index,follow"),
    ogTitle: (data) => data.title,
    ogDescription: (data) => data.description,
    ogType: "article",
    ogUrl: (data) => `${SITE_URL_TOKEN}${publicUrl(data)}`,
    ogImage: (data) => data.image,
    ogImageAlt: (data) => data.imageAlt,
    ogImageType: (data) => imageType(data.image),
    sitemap: (data) => data.draft ? false : ({
      order: 40,
      lastmod: dateOnly(data.updated || data.date),
      changefreq: "monthly",
      priority: "0.7"
    }),
    schema: (data) => {
      if (data.draft) return [];
      const url = `${SITE_URL_TOKEN}${publicUrl(data)}`;
      return [
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL_TOKEN}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL_TOKEN}/blog/` },
            { "@type": "ListItem", position: 3, name: data.title, item: url }
          ]
        }),
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          headline: data.title,
          description: data.description,
          image: data.image ? `${SITE_URL_TOKEN}${data.image}` : undefined,
          datePublished: dateOnly(data.date),
          dateModified: dateOnly(data.updated || data.date),
          author: { "@type": "Organization", name: data.author || "Honest Drain Team" },
          publisher: {
            "@type": "Organization",
            name: "Honest Drain",
            logo: { "@type": "ImageObject", url: `${SITE_URL_TOKEN}/assets/brand/honest-drain-logo.png` }
          }
        })
      ];
    }
  }
};

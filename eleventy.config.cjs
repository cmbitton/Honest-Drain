const site = require("./src/_data/site.cjs");

const SITE_URL_TOKEN = "__SITE_URL__";
const SITE_URL = site.url;
const SITE_URL_BASE = SITE_URL.replace(/\/+$/, "");
const PATH_PREFIX = normalizePathPrefix(process.env.PATH_PREFIX);

function normalizePathPrefix(prefix) {
  if (!prefix || prefix === "/") return "/";
  return `/${String(prefix).replace(/^\/+|\/+$/g, "")}/`;
}

function resolveSiteUrl(value) {
  if (value == null) return value;
  return String(value).replaceAll(SITE_URL_TOKEN, SITE_URL_BASE);
}

function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00Z`);
  }
  return new Date(value);
}

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ assets: "assets" });
  eleventyConfig.addPassthroughCopy({ ".nojekyll": ".nojekyll" });

  eleventyConfig.addFilter("isActive", function (currentUrl, targetUrl) {
    if (!currentUrl || !targetUrl) return false;
    if (targetUrl === "/") return currentUrl === "/";
    return currentUrl === targetUrl || currentUrl.startsWith(targetUrl);
  });

  eleventyConfig.addFilter("sitemapPages", function (pages) {
    return pages
      .filter((entry) => entry.data.sitemap !== false && entry.data.sitemap)
      .sort((a, b) => {
        const aOrder = a.data.sitemap.order ?? 9999;
        const bOrder = b.data.sitemap.order ?? 9999;
        return aOrder - bOrder;
      });
  });

  eleventyConfig.addFilter("resolveSiteUrl", resolveSiteUrl);

  eleventyConfig.addFilter("postDate", function (value) {
    const date = toDate(value);
    if (!isValidDate(date)) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(date);
  });

  eleventyConfig.addFilter("isoDate", function (value) {
    const date = toDate(value);
    if (!isValidDate(date)) return "";
    return date.toISOString();
  });

  eleventyConfig.addFilter("rfc822Date", function (value) {
    const date = toDate(value);
    if (!isValidDate(date)) return "";
    return date.toUTCString();
  });

  eleventyConfig.addFilter("excludeUrl", function (items, currentUrl) {
    return (items || []).filter((item) => item.url !== currentUrl);
  });

  eleventyConfig.addFilter("limit", function (items, count) {
    return (items || []).slice(0, count);
  });

  eleventyConfig.addCollection("blogPosts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/blog/posts/*.md")
      .filter((post) => !post.data.draft)
      .sort((a, b) => toDate(b.data.date) - toDate(a.data.date));
  });

  eleventyConfig.addFilter("absoluteUrl", function (url) {
    const resolvedUrl = resolveSiteUrl(url);
    if (!resolvedUrl) return resolvedUrl;
    if (/^https?:\/\//i.test(resolvedUrl)) return resolvedUrl;
    return new URL(String(resolvedUrl).replace(/^\//, ""), SITE_URL).toString();
  });

  return {
    pathPrefix: PATH_PREFIX,
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md"]
  };
};

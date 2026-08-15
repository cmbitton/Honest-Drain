# Honest Drain Demo

Static demo website for Honest Drain, built with Eleventy.

## Development

Editable source lives in `src/`. Eleventy builds the deployable static site into `_site/`.

Install dependencies once:

```sh
npm install
```

Run a local dev server:

```sh
npm run dev
```

Build the static site:

```sh
npm run build
```

The generated site is written to `_site/`.

## Shared Site Pieces

- `src/_data/site.cjs` — business name, phone, footer copy, and deploy URL constants
- `src/_data/navigation.json` — primary nav, mega menus, and footer links
- `src/_includes/partials/head.njk` — shared metadata, assets, OpenGraph, and JSON-LD output
- `src/_includes/partials/header.njk` — one central header/nav
- `src/_includes/partials/footer.njk` — one central footer
- `src/_includes/layouts/base.njk` — shared page shell
- `src/sitemap.xml.njk` — generated XML sitemap from page front matter

## Cloudflare Pages

This site builds to plain HTML, CSS, and JavaScript, so the deployed site stays static.

Recommended Cloudflare Pages settings:

- Framework preset: `Eleventy`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `_site`
- Root directory: repository root
- Environment variable: `SITE_URL=https://example.com/` using the final production domain

If `SITE_URL` is not set, the build uses Cloudflare's `CF_PAGES_URL` when available. Local builds fall back to the project Pages URL placeholder in `src/_data/site.cjs`.

## GitHub Pages

This site builds to plain HTML, CSS, and JavaScript, so the deployed site stays static.

Recommended GitHub Pages settings:

- Source: `GitHub Actions`
- Workflow: `.github/workflows/deploy.yml`

The GitHub Pages workflow sets `SITE_URL` and `PATH_PREFIX` for the current demo URL. Cloudflare Pages should not set `PATH_PREFIX`.

## Site Structure

- `/` — home (`index.html`)
- `/drain-and-sewer-services/` — residential service hub with sub-pages for drain cleaning, hydro jetting, inspection, sewer repair, exterior drains, septic, and more
- `/commercial-service/` — commercial service hub with sub-pages for floor drains, storm drains, hydro jetting, sewer service, and maintenance programs
- `about.html`, `faq.html`, `contact.html`, `common-clogs.html`, `why-honest-drain.html`, `site-map.html`
- `sitemap.xml`, `robots.txt`, `404.html`

Each service URL resolves to a directory with an `index.html`, so the URLs read like `/drain-and-sewer-services/drain-cleaning/emergency-drain-cleaning/`.

## SEO

- Canonical URLs, OpenGraph tags, and JSON-LD on every page
- BreadcrumbList JSON-LD on sub-pages
- Service / OfferCatalog JSON-LD on service pages
- LocalBusiness and WebSite JSON-LD on the home page
- FAQPage JSON-LD on the FAQ page
- BlogPosting JSON-LD, article sharing metadata, and an RSS feed for blog posts

## Editing the Blog

The blog uses [Pages CMS](https://app.pagescms.org), a browser-based editor for the Markdown files in this repository. There is no separate content database: edits are committed to GitHub and the existing Pages deployment rebuilds the site automatically.

One-time setup for the repository owner:

1. Sign in at `https://app.pagescms.org` with GitHub.
2. Install the Pages CMS GitHub App for this repository.
3. Invite the editor to the GitHub repository if they are not already a collaborator.
4. Have the editor sign in to Pages CMS with their GitHub account and open this repository.

The editor can then create, revise, upload images for, publish, and unpublish posts under **Blog posts**. New posts start as drafts; turn off **Keep as draft** to publish. Saving a change commits it to GitHub and triggers the normal deployment.

Blog-related source:

- `.pages.yml` — fields and media settings shown in the editor
- `src/blog/posts/` — Markdown post files
- `assets/images/blog/` — images uploaded in the editor
- `src/blog/index.njk` — public post listing
- `src/_includes/layouts/blog-post.njk` — public post design
- `src/feed.xml.njk` — RSS feed at `/feed.xml`

## Demo Notes

- Phone is `(401) 593-5553`; update `src/_data/site.cjs` if it ever changes.
- The contact page uses the embedded Jobber work request form.
- Real business details, service areas, testimonials, and original photography should be added before launch.

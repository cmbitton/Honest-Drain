# Honest Drain Demo

Static demo website for Honest Drain.

## GitHub Pages

This site is built with plain HTML, CSS, and JavaScript, so it can be hosted from the repository root with GitHub Pages.

Recommended GitHub Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

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
- LocalBusiness (Plumber) and WebSite JSON-LD on the home page
- FAQPage JSON-LD on the FAQ page

## Demo Notes

- Phone is `(401) 593-5553`; update the `tel:` and display strings in the HTML/JS if it ever changes.
- The contact form is frontend-only until connected to a form service or backend.
- Real business details, service areas, testimonials, and original photography should be added before launch.

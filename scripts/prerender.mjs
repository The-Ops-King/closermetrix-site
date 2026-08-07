import puppeteer from 'puppeteer';
import { preview } from 'vite';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

const routes = ['/', '/how-it-works', '/faq', '/temp', '/onboarding', '/onboarding/tldv', '/onboarding/fathom'];

const SITE = 'https://closermetrix.com';

// Per-route head overrides. Routes not listed keep the defaults from index.html.
const meta = {
  '/temp': {
    title: 'CloserMetrix — Turn Every Sales Call Into Better Business Decisions',
    description:
      'The Sales Intelligence Layer for high-ticket sales teams. Every recorded sales call becomes accurate CRM updates, manager visibility, marketing insights and a monthly Sales Integrity Audit.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'CloserMetrix',
      applicationCategory: 'BusinessApplication',
      url: `${SITE}/temp`,
      offers: {
        '@type': 'Offer',
        price: '1000',
        priceCurrency: 'USD',
        description:
          'Unlimited call processing, CRM updates, weekly reports, monthly Integrity Audit.',
      },
      featureList: [
        'CRM Updates',
        'Call Notes',
        'Pain Points',
        'Goals',
        'Objections',
        'Next Steps',
        'Pipeline Updates',
        'Manager Notifications',
        'Weekly Reports',
        'Monthly Integrity Audit',
      ],
    },
  },
};

/*
 * Sections animate in with Framer Motion `whileInView`, which leaves them at
 * opacity 0 until they've been scrolled past. Walk the whole page first so the
 * captured HTML shows the finished state rather than a half-faded one.
 */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const height = document.body.scrollHeight;
    for (let y = 0; y < height; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

async function applyMeta(page, route) {
  const config = meta[route];
  if (!config) return;

  await page.evaluate((cfg, site, path) => {
    document.title = cfg.title;

    const setMeta = (selector, attr, value) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [key, val] = selector.replace(/[[\]"]/g, '').split('=');
        el.setAttribute(key.replace('meta', '').trim(), val);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', cfg.description);
    setMeta('meta[property="og:title"]', 'content', cfg.title);
    setMeta('meta[property="og:description"]', 'content', cfg.description);
    setMeta('meta[property="og:url"]', 'content', site + path);
    setMeta('meta[name="twitter:title"]', 'content', cfg.title);
    setMeta('meta[name="twitter:description"]', 'content', cfg.description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = site + path;

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ ...cfg.jsonLd, description: cfg.description });
    document.head.appendChild(ld);
  }, config, SITE, route);
}

async function prerender() {
  console.log('Starting prerender...');

  // Start Vite preview server
  const server = await preview({
    preview: { port: 4173, strictPort: true },
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const route of routes) {
    const page = await browser.newPage();
    const url = `http://localhost:4173${route}`;

    console.log(`Prerendering ${route}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for content to render (Framer Motion animations)
    await page.waitForSelector('main', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 2000));

    await scrollThrough(page);
    await applyMeta(page, route);

    // Get the fully rendered HTML
    const html = await page.content();

    // Determine output path
    const outPath =
      route === '/'
        ? resolve(distDir, 'index.html')
        : resolve(distDir, route.slice(1), 'index.html');

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, 'utf-8');
    console.log(`  Wrote ${outPath}`);

    await page.close();
  }

  await browser.close();
  server.httpServer.close();
  console.log('Prerender complete!');
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});

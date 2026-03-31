import puppeteer from 'puppeteer';
import { preview } from 'vite';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

const routes = ['/', '/how-it-works', '/faq', '/onboarding', '/onboarding/tldv', '/onboarding/fathom'];

async function prerender() {
  console.log('Starting prerender...');

  // Start Vite preview server
  const server = await preview({
    preview: { port: 4173, strictPort: true },
  });

  const browser = await puppeteer.launch({ headless: 'new' });

  for (const route of routes) {
    const page = await browser.newPage();
    const url = `http://localhost:4173${route}`;

    console.log(`Prerendering ${route}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for content to render (Framer Motion animations)
    await page.waitForSelector('main', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 2000));

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

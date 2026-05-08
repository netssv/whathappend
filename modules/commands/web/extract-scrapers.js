/**
 * @module modules/commands/web/extract-scrapers.js
 * @description DOM injection scripts for the extract command.
 * Each function runs inside the active tab's page context via chrome.scripting.
 * They must be self-contained — no imports, no closures over external scope.
 */

export function scrapeEmails() {
    const html = document.documentElement.innerHTML;
    const re = /\b([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})\b/gi;
    let m = html.match(re) || [];
    const bad = ['.png','.jpg','.jpeg','.gif','.svg','.webp','.css','.js','.woff','.ttf'];
    m = m.filter(e => {
        const l = e.toLowerCase();
        if (bad.some(x => l.endsWith(x))) return false;
        if (/^\d+@\d+\.\d+$/.test(e)) return false;
        if (/@[0-9]+(\.[0-9x]+)*(-[a-z0-9]+)?$/.test(l)) return false;
        if (l.includes('u002f')) return false;
        return true;
    });
    return [...new Set(m.map(e => e.toLowerCase()))];
}

export function scrapePhones() {
    const results = new Set();
    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        const n = a.getAttribute('href').replace('tel:', '').trim().replace(/[^\d+]/g, '');
        if (n.length >= 7) results.add(a.getAttribute('href').replace('tel:', '').trim());
    });
    const re = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]\d{3,4}(?:[\s.-]\d{2,4})?/g;
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let nd;
    while ((nd = tw.nextNode())) {
        const t = nd.nodeValue; if (!t || t.trim().length < 7) continue;
        let m; while ((m = re.exec(t)) !== null) {
            const raw = m[0].trim(), digits = raw.replace(/\D/g, '');
            if (!/[-+().\s]/.test(raw)) continue;
            if (digits.length >= 7 && digits.length <= 15) {
                if (digits.length === 13 && (digits.startsWith('978') || digits.startsWith('979'))) continue;
                results.add(raw);
            }
        }
    }
    return Array.from(results);
}

export function scrapeLinks() {
    const seen = new Set(), links = [];
    document.querySelectorAll('[href], [src]').forEach(el => {
        const u = el.href || el.src;
        if (u && u.startsWith('http') && !seen.has(u)) { seen.add(u); links.push(u); }
    });
    document.querySelectorAll('[data-href], [data-url]').forEach(el => {
        const u = el.dataset.href || el.dataset.url;
        if (u && u.startsWith('http') && !seen.has(u)) { seen.add(u); links.push(u); }
    });
    return links;
}

export function scrapeImages() {
    const seen = new Set(), imgs = [];
    const add = u => { if (u && u.startsWith('http') && !u.startsWith('data:') && !seen.has(u)) { seen.add(u); imgs.push(u); } };
    document.querySelectorAll('img').forEach(el => {
        add(el.src); add(el.dataset.src); add(el.dataset.original);
        add(el.dataset.lazySrc); add(el.dataset.iurl);
        const ss = el.getAttribute('srcset') || el.dataset.srcset;
        if (ss) ss.split(',').forEach(s => add(s.trim().split(/\s+/)[0]));
    });
    document.querySelectorAll('picture source').forEach(el => {
        const ss = el.getAttribute('srcset');
        if (ss) ss.split(',').forEach(s => add(s.trim().split(/\s+/)[0]));
    });
    document.querySelectorAll('[style*="background"]').forEach(el => {
        const m = el.style.backgroundImage?.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/);
        if (m) add(m[1]);
    });
    return imgs;
}

export function scrapeDocs() {
    const exts = ['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.csv','.txt','.rtf','.odt','.ods'];
    const seen = new Set(), docs = [];
    document.querySelectorAll('a[href]').forEach(a => {
        const u = a.href;
        if (u && exts.some(e => u.toLowerCase().includes(e)) && !seen.has(u)) { seen.add(u); docs.push(u); }
    });
    return docs;
}

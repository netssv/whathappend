// ===================================================================
//  Signature Tables for Tech Stack Detection
// ===================================================================

export const CMS_SIGNATURES = [
    { id: "wordpress",   name: "WordPress",    patterns: ["wp-content/", "wp-includes/", "wp-json", "/xmlrpc.php", "wordpress.org"] },
    { id: "shopify",     name: "Shopify",      patterns: ["cdn.shopify.com", "shopify.theme", "myshopify.com", "shopify-buy"] },
    { id: "wix",         name: "Wix",          patterns: ["static.wixstatic.com", "wix-code-sdk", "x-wix-", "parastorage.com"] },
    { id: "squarespace", name: "Squarespace",  patterns: ["squarespace.com", "static1.squarespace.com", "sqsp-", "squarespace-cdn"] },
    { id: "drupal",      name: "Drupal",       patterns: ["sites/default/files", "drupal.settings", "/core/misc/drupal.js", "drupal.org"] },
    { id: "joomla",      name: "Joomla",       patterns: ["/media/jui/", "/components/com_", "joomla!", "/administrator/"] },
    { id: "webflow",     name: "Webflow",      patterns: ["webflow.com", "wf-page", "w-webflow", "assets-global.website-files.com"] },
    { id: "ghost",       name: "Ghost",        patterns: ["ghost.org", "ghost-", "content/themes", "ghost.io"] },
    { id: "hubspot-cms", name: "HubSpot CMS",  patterns: ["hs-sites.com", "hubs.ly", "hubspot.net/hub"] },
    { id: "magento",     name: "Magento",      patterns: ["mage/", "magento", "varien/", "skin/frontend"] },
    { id: "prestashop",  name: "PrestaShop",   patterns: ["prestashop", "presta", "modules/ps_", "/themes/classic/"] },
    { id: "bitrix",      name: "1C-Bitrix",    patterns: ["/bitrix/", "bx-core", "bitrix/js", "bitrix_sessid"] },
    { id: "vtex",        name: "VTEX",         patterns: ["vtex.com", "vteximg.com", "vtexcommerce", "vtex-io"] },
];

export const FRAMEWORK_SIGNATURES = [
    { id: "react",    name: "React",     patterns: ["__react_devtools", "react-dom", "_reactrootcontainer", "react.production", "react-app"] },
    { id: "vue",      name: "Vue.js",    patterns: ["__vue__", "vue.js", "vue.min.js", "vue@", "vue.runtime", "vue-router"] },
    { id: "nextjs",   name: "Next.js",   patterns: ["__next_data__", "_next/static", "next/dist", "next-head-count"] },
    { id: "nuxt",     name: "Nuxt",      patterns: ["__nuxt__", "_nuxt/", "nuxt.js", "nuxt.config", "nuxt-link"] },
    { id: "angular",  name: "Angular",   patterns: ["ng-version", "angular.js", "ng-app", "angular.min.js", "ng-controller"] },
    { id: "svelte",   name: "Svelte",    patterns: ["__svelte", "svelte-", "svelte.dev", "sveltekit"] },
    { id: "jquery",   name: "jQuery",    patterns: ["jquery.min.js", "jquery.fn", "jquery/", "jquery.com", "jquery-migrate"] },
    { id: "bootstrap",name: "Bootstrap", patterns: ["bootstrap.min.css", "bootstrap.min.js", "bootstrap.bundle", "getbootstrap.com"] },
    { id: "tailwind", name: "Tailwind CSS", patterns: ["tailwindcss", "tailwind.min.css", "tw-"] },
    { id: "gatsby",   name: "Gatsby",    patterns: ["gatsby-", "gatsby.js", "___gatsby", "page-data/"] },
    { id: "astro",    name: "Astro",     patterns: ["astro-", "astro.build", "/_astro/"] },
    { id: "remix",    name: "Remix",     patterns: ["__remixcontext", "remix.run", "_remix"] },
    { id: "gtm-dl",   name: "GTM dataLayer", patterns: ["datalayer", "datalayer.push", "gtag(", "google_tag_data"] },
];

export const SERVER_SIGNATURES = [
    { id: "nginx",       name: "Nginx",         headerKey: "server", patterns: ["nginx"] },
    { id: "apache",      name: "Apache",        headerKey: "server", patterns: ["apache"] },
    { id: "cloudflare",  name: "Cloudflare",    headerKey: "server", patterns: ["cloudflare"], altHeaders: ["cf-ray", "cf-cache-status"] },
    { id: "litespeed",   name: "LiteSpeed",     headerKey: "server", patterns: ["litespeed"], altHeaders: ["x-litespeed-cache"] },
    { id: "iis",         name: "Microsoft IIS", headerKey: "server", patterns: ["microsoft-iis"] },
    { id: "vercel",      name: "Vercel",        headerKey: "server", patterns: ["vercel"], altHeaders: ["x-vercel-id"] },
    { id: "netlify",     name: "Netlify",       headerKey: "server", patterns: ["netlify"], altHeaders: ["x-nf-request-id"] },
    { id: "heroku",      name: "Heroku",        headerKey: null,     patterns: [], altHeaders: ["via"], altPatterns: ["vegur"] },
    { id: "aws",         name: "AWS",           headerKey: "server", patterns: ["amazons3", "awselb", "cloudfront"], altHeaders: ["x-amz-cf-id", "x-amzn-requestid"] },
    { id: "gcp",         name: "Google Cloud",  headerKey: "server", patterns: ["gws", "gse"], altHeaders: ["x-goog-", "via"] },
    { id: "caddy",       name: "Caddy",         headerKey: "server", patterns: ["caddy"] },
];

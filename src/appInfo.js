// Name and public links of the app, shown in the header and the "About" window.
export const APP_NAME = 'DuoAstro';
export const GITHUB_URL = 'https://github.com/briseida23/astro-app';
// Donation page (monobank Base). While empty, the "Support the project" link and block are hidden
// on the site; the local dev server shows them with a placeholder link, to see how they look.
const DONATE_PAGE = '';
export const DONATE_URL = DONATE_PAGE || (import.meta.env.DEV ? 'https://base.monobank.ua/' : '');

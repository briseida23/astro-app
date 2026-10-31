// Rectification tries hundreds of birth times; here it runs off the page's thread so the page stays responsive.
// The ephemeris starts loading at once; messages wait for it.
const ready = import('../utils/ephemeris');

self.onmessage = async ({ data }) => {
  const { rectify } = await ready;
  const { id, birth, from, to, stepSeconds, events, options } = data;
  self.postMessage({ id, results: rectify(birth, from, to, stepSeconds, events, options) });
};

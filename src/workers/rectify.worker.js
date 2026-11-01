// Rectification tries hundreds of birth times; here it runs off the page's thread so the page stays responsive.
// The ephemeris starts loading at once; messages wait for it.
const ready = import('../utils/ephemeris');

// One run per direction arc asked for (several to compare them): { [arc]: results }.
self.onmessage = async ({ data }) => {
  const { rectify } = await ready;
  const { id, birth, from, to, stepSeconds, events, options, arcs } = data;
  const byArc = Object.fromEntries(arcs.map((arc) => [arc, rectify(birth, from, to, stepSeconds, events, { ...options, arc })]));
  self.postMessage({ id, byArc });
};

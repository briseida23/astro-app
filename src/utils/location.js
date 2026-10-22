/** Browser position as { latitude, longitude }; rejects if denied or unavailable. */
function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      reject,
      { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

/** "City, Country" for coordinates, or null if the lookup fails. */
async function reverseGeocode(latitude, longitude, lang) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${lang}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const name = [data.city || data.locality, data.countryName].filter(Boolean).join(', ');
    return name || null;
  } catch {
    return null;
  }
}

/**
 * The user's current place: coordinates, the browser's time zone and a readable name
 * (coordinates when the name lookup fails).
 */
export async function detectCurrentPlace(lang) {
  const { latitude, longitude } = await currentPosition();
  const place = (await reverseGeocode(latitude, longitude, lang)) ?? `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
  return {
    latitude,
    longitude,
    place,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

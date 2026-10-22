# Astrology Web App

A tropical astrology web app: natal charts, transits with step-by-step dynamics, aspect tables,
aspect figures (including figures that transits complete with natal planets), asteroids and
fictitious points. Interface in Ukrainian, Russian and English.

All calculations run in the browser (Swiss Ephemeris compiled to WebAssembly), so the site is
static and needs no backend.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run lint
```

## Data and services

- Planetary positions: [Swiss Ephemeris](https://www.astro.com/swisseph/) via
  [`@swisseph/browser`](https://www.npmjs.com/package/@swisseph/browser) (built-in Moshier ephemeris).
- Asteroids and fictitious points: `public/ephe/seas_18.se1` and `public/ephe/seorbel.txt`
  from the Swiss Ephemeris distribution.
- City search: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
  (free for non-commercial use).
- Reverse geocoding of the current location: [BigDataCloud](https://www.bigdatacloud.com/)
  client-side API.

## License

[GNU Affero General Public License v3.0](LICENSE). Swiss Ephemeris is used under its AGPL
licensing option, so the full source code of this app is published here.

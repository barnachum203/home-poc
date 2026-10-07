# Home map POC

A focused Angular POC for visually confirming a home-insurance address on a Google satellite map. The experience is Hebrew-first and RTL, responsive, keyboard accessible, and supports reduced motion.

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm install
npm start
```

Open [http://localhost:4200/home-map-poc](http://localhost:4200/home-map-poc). The root URL redirects to the same page.

Build the production bundle with:

```bash
npm run build
```

## Google Cloud setup

Enable these APIs in the Google Cloud project associated with the key:

- **Maps JavaScript API**, for the satellite map and browser-side geocoder
- **Geocoding API**, because the POC resolves a submitted address rather than using Places autocomplete

Add the browser API key to `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_BROWSER_KEY',
};
```

Do not commit a real key. In Google Cloud, restrict the key to the Maps JavaScript API and Geocoding API, and add HTTP referrer restrictions for `http://localhost:4200/*` plus the intended deployment domains.

## Implementation notes

- The feature route is lazy-loaded, and the `<app-property-map>` component is only rendered after a valid geocoding result.
- The Google Maps JavaScript API script is injected only when the user submits an address. A blank key, load failure, no result, invalid coordinates, and geocoding errors each show a friendly inline message.
- The map starts at zoom 15 in satellite mode and steps to zoom 19 before showing the marker pulse and confirmation panel.
- Rejecting an address returns to the input without refreshing. Confirming it reveals the Home Insights preview.
- `MOCK_HOME_INSIGHTS` is presentation-only data and is explicitly separate from Google data.
- Analytics hooks currently log `home_map_shown`, `home_map_address_confirmed`, and `home_map_address_rejected` to the console with TODO markers for a real adapter.

## POC limitations

- Address lookup is submit-based geocoding, not Places autocomplete.
- The API key is a compile-time environment value for this isolated POC. A real application should use its established configuration and secret-management conventions.
- Home Insights are illustrative mock values and must not be used for underwriting or customer decisions.
- Automated tests were not scaffolded for this small POC; validation currently consists of strict Angular compilation and a production build.

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
  features: {
    streetView: true,
    propertyMapSelection: true,
  },
};
```

Set `features.streetView` to `false` to disable the Street View lookup and remove its map toggle completely. When enabled, Street View uses the existing Maps JavaScript API; the separate Street View Static API is not required for this implementation.

Set `features.propertyMapSelection` to `false` to remove map-based property correction. This flag is independent from Street View.

Do not commit a real key. In Google Cloud, restrict the key to the Maps JavaScript API and Geocoding API, and add HTTP referrer restrictions for `http://localhost:4200/*` plus the intended deployment domains.

## Implementation notes

- The feature route is lazy-loaded, and the `<app-property-map>` component is only rendered after a valid geocoding result.
- The Google Maps JavaScript API script is injected only when the user submits an address. A blank key, load failure, no result, invalid coordinates, and geocoding errors each show a friendly inline message.
- The map starts at zoom 15 in satellite mode and steps to zoom 19 before showing the marker pulse and confirmation panel.
- When the feature flag is enabled, the map searches for outdoor Street View imagery within 50 metres. If coverage exists, the customer can switch between satellite and street views; otherwise the satellite view remains available with a disabled coverage label.
- The Street View camera is aimed from the nearest panorama toward the property coordinates. Because the panorama can be nearby rather than directly outside the property, the UI describes it as a street view near the address.
- Rejecting an address returns to the input without refreshing. Confirming it reveals the Home Insights preview.
- When map selection is enabled, customers can click the building or drag the marker. The selected coordinates are reverse geocoded and offered for confirmation before the original location is replaced.
- `MOCK_HOME_INSIGHTS` is presentation-only data and is explicitly separate from Google data.
- Analytics hooks currently log the map, Street View, property-selection, confirmation, and rejection events to the console with TODO markers for a real adapter.

## POC limitations

- Address lookup is submit-based geocoding, not Places autocomplete.
- Street View coverage and image recency vary by address.
- Reverse geocoding returns the closest addressable location and cannot guarantee that a clicked roof represents an exact postal address or apartment.
- The API key is a compile-time environment value for this isolated POC. A real application should use its established configuration and secret-management conventions.
- Home Insights are illustrative mock values and must not be used for underwriting or customer decisions.
- Automated tests were not scaffolded for this small POC; validation currently consists of strict Angular compilation and a production build.

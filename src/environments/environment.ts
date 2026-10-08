import { generatedGoogleMapsApiKey } from './environment.generated';

export const environment = {
  production: false,
  googleMapsApiKey: generatedGoogleMapsApiKey,
  features: {
    streetView: true,
    propertyMapSelection: true,
  },
};

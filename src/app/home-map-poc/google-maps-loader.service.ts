import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PropertyLocation } from './property-location.model';

export type AddressLookupErrorCode =
  | 'MISSING_KEY'
  | 'LOAD_FAILED'
  | 'NOT_FOUND'
  | 'NO_COORDINATES'
  | 'GEOCODING_ERROR';

export class AddressLookupError extends Error {
  constructor(readonly code: AddressLookupErrorCode) {
    super(code);
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private readonly document = inject(DOCUMENT);
  private loadPromise?: Promise<void>;

  async geocodeAddress(address: string): Promise<PropertyLocation> {
    await this.load();

    try {
      const response = await new google.maps.Geocoder().geocode({ address, region: 'IL' });
      const result = response.results[0];
      if (!result) throw new AddressLookupError('NOT_FOUND');

      const lat = result.geometry?.location?.lat();
      const lng = result.geometry?.location?.lng();
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new AddressLookupError('NO_COORDINATES');
      }

      return {
        address: result.formatted_address,
        lat,
        lng,
        placeId: result.place_id,
      };
    } catch (error) {
      if (error instanceof AddressLookupError) throw error;
      if ((error as { code?: string })?.code === 'ZERO_RESULTS') {
        throw new AddressLookupError('NOT_FOUND');
      }
      throw new AddressLookupError('GEOCODING_ERROR');
    }
  }

  load(): Promise<void> {
    if (globalThis.google?.maps) return Promise.resolve();
    if (!environment.googleMapsApiKey.trim()) {
      return Promise.reject(new AddressLookupError('MISSING_KEY'));
    }
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const callbackName = '__homeMapPocReady';
      const callbackWindow = window as unknown as Window & Record<string, unknown>;
      const script = this.document.createElement('script');
      const cleanup = () => {
        window.clearTimeout(timeout);
        delete callbackWindow[callbackName];
      };
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new AddressLookupError('LOAD_FAILED'));
      }, 12_000);

      callbackWindow[callbackName] = () => {
        cleanup();
        resolve();
      };
      script.id = 'home-map-poc-google-maps';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        cleanup();
        this.loadPromise = undefined;
        reject(new AddressLookupError('LOAD_FAILED'));
      };
      script.src = 'https://maps.googleapis.com/maps/api/js?' + new URLSearchParams({
        key: environment.googleMapsApiKey,
        callback: callbackName,
        language: 'he',
        region: 'IL',
        v: 'weekly',
      });
      this.document.head.appendChild(script);
    });
    return this.loadPromise;
  }
}

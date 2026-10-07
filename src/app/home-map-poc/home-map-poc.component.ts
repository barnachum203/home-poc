import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddressLookupError, AddressLookupErrorCode, GoogleMapsLoaderService } from './google-maps-loader.service';
import { MOCK_HOME_INSIGHTS } from './mock-home-insights';
import { PropertyLocation } from './property-location.model';
import { PropertyMapComponent } from './property-map.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home-map-poc',
  imports: [FormsModule, PropertyMapComponent],
  templateUrl: './home-map-poc.component.html',
  styleUrl: './home-map-poc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeMapPocComponent {
  private readonly mapsLoader = inject(GoogleMapsLoaderService);
  private readonly addressInput = viewChild<ElementRef<HTMLInputElement>>('addressInput');

  protected address = '';
  protected readonly isLoading = signal(false);
  protected readonly location = signal<PropertyLocation | null>(null);
  protected readonly confirmed = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly mockInsights = MOCK_HOME_INSIGHTS;
  protected readonly streetViewEnabled = environment.features.streetView;

  protected async findHome(): Promise<void> {
    const address = this.address.trim();
    this.errorMessage.set('');
    if (address.length < 4) {
      this.errorMessage.set('כדאי להזין כתובת מלאה, כולל עיר.');
      return;
    }

    this.isLoading.set(true);
    this.location.set(null);
    this.confirmed.set(false);
    try {
      this.location.set(await this.mapsLoader.geocodeAddress(address));
    } catch (error) {
      const code = error instanceof AddressLookupError ? error.code : 'GEOCODING_ERROR';
      this.errorMessage.set(this.messageForError(code));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected confirmAddress(): void {
    this.confirmed.set(true);
    this.track('home_map_address_confirmed');
    window.setTimeout(() => document.querySelector('.insights')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  protected rejectAddress(): void {
    this.track('home_map_address_rejected');
    this.location.set(null);
    this.confirmed.set(false);
    this.errorMessage.set('');
    window.setTimeout(() => this.addressInput()?.nativeElement.focus());
  }

  protected onMapSettled(): void {
    this.track('home_map_shown');
  }

  protected onStreetViewShown(): void {
    this.track('home_street_view_shown');
  }

  private messageForError(code: AddressLookupErrorCode): string {
    return {
      MISSING_KEY: 'מפתח Google Maps עדיין לא הוגדר. אפשר למצוא הוראות בקובץ README.',
      LOAD_FAILED: 'לא הצלחנו לטעון את המפה. כדאי לבדוק את החיבור ולנסות שוב.',
      NOT_FOUND: 'לא מצאנו את הכתובת הזו. כדאי לבדוק את הפרטים ולנסות שוב.',
      NO_COORDINATES: 'מצאנו את הכתובת, אבל לא הצלחנו למקם אותה על המפה.',
      GEOCODING_ERROR: 'החיפוש לא הושלם כרגע. אפשר לנסות שוב בעוד רגע.',
    }[code];
  }

  private track(eventName: 'home_map_shown' | 'home_map_address_confirmed' | 'home_map_address_rejected' | 'home_street_view_shown'): void {
    // TODO(analytics): Replace with the application's analytics adapter.
    console.info(`[home-map-poc] ${eventName}`);
  }
}

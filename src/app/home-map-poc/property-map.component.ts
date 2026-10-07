import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { AddressLookupError, GoogleMapsLoaderService } from './google-maps-loader.service';
import { PropertyLocation } from './property-location.model';

@Component({
  selector: 'app-property-map',
  imports: [GoogleMap, MapMarker],
  templateUrl: './property-map.component.html',
  styleUrl: './property-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyMapComponent implements OnDestroy {
  private readonly mapsLoader = inject(GoogleMapsLoaderService);

  readonly location = input.required<PropertyLocation>();
  readonly confirmed = input(false);
  readonly streetViewEnabled = input(false);
  readonly propertySelectionEnabled = input(false);
  readonly addressConfirmed = output<void>();
  readonly addressRejected = output<void>();
  readonly mapSettled = output<void>();
  readonly streetViewShown = output<void>();
  readonly propertySelectionStarted = output<void>();
  readonly locationSelected = output<PropertyLocation>();

  protected readonly zoom = signal(15);
  protected readonly showConfirmation = signal(false);
  protected readonly viewMode = signal<'satellite' | 'street'>('satellite');
  protected readonly streetViewStatus = signal<'checking' | 'available' | 'unavailable'>(
    'checking',
  );
  protected readonly selectionMode = signal(false);
  protected readonly selectionLoading = signal(false);
  protected readonly selectionError = signal('');
  protected readonly suggestedLocation = signal<PropertyLocation | null>(null);
  protected readonly candidatePoint = signal<google.maps.LatLngLiteral | null>(null);
  protected readonly mapOptions: google.maps.MapOptions = {
    mapTypeId: 'satellite' as google.maps.MapTypeId,
    disableDefaultUI: true,
    clickableIcons: false,
    keyboardShortcuts: false,
    gestureHandling: 'cooperative',
  };
  protected readonly markerPosition = computed(
    () =>
      this.candidatePoint() ?? {
        lat: this.location().lat,
        lng: this.location().lng,
      },
  );
  protected readonly markerOptions = computed<google.maps.MarkerOptions>(() => ({
    title: this.selectionMode() ? 'גררו כדי לדייק את מיקום הבית' : 'הבית שנמצא',
    draggable: this.selectionMode(),
    animation: this.selectionMode() ? undefined : (2 as google.maps.Animation),
  }));

  private map?: google.maps.Map;
  private panorama?: google.maps.StreetViewPanorama;
  private streetViewData?: google.maps.StreetViewPanoramaData;
  private readonly streetViewContainer =
    viewChild<ElementRef<HTMLDivElement>>('streetViewContainer');
  private propertyCircle?: google.maps.Circle;
  private pulseAnimationFrame?: number;
  private readonly cameraTimers: number[] = [];
  private selectionRequestId = 0;

  protected onMapInitialized(map: google.maps.Map): void {
    this.map = map;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = this.location();
    map.setCenter({ lat: target.lat, lng: target.lng });
    if (this.streetViewEnabled()) {
      void this.findNearbyStreetView();
    }

    if (reduceMotion) {
      map.setZoom(19);
      this.zoom.set(19);
      this.finishCameraMove();
      return;
    }

    [16, 17, 18, 19].forEach((level, index) => {
      this.cameraTimers.push(
        window.setTimeout(
          () => {
            map.setZoom(level);
            this.zoom.set(level);
            if (level === 19) {
              this.cameraTimers.push(window.setTimeout(() => this.finishCameraMove(), 260));
            }
          },
          260 * (index + 1),
        ),
      );
    });
  }

  ngOnDestroy(): void {
    this.cameraTimers.forEach((timer) => window.clearTimeout(timer));
    if (this.pulseAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.pulseAnimationFrame);
    }
    this.propertyCircle?.setMap(null);
    this.panorama?.setVisible(false);
  }

  protected showSatellite(): void {
    this.viewMode.set('satellite');
    this.panorama?.setVisible(false);
    window.setTimeout(() => {
      if (!this.map) return;
      google.maps.event.trigger(this.map, 'resize');
      this.map.setCenter({ lat: this.location().lat, lng: this.location().lng });
    });
  }

  protected showStreetView(): void {
    if (this.streetViewStatus() !== 'available' || !this.streetViewData) return;

    this.viewMode.set('street');
    window.setTimeout(() => this.initializeStreetView());
    this.streetViewShown.emit();
  }

  protected beginPropertySelection(): void {
    this.showSatellite();
    this.selectionMode.set(true);
    this.selectionLoading.set(false);
    this.selectionError.set('');
    this.suggestedLocation.set(null);
    this.candidatePoint.set(null);
    this.map?.setOptions({ draggableCursor: 'crosshair' });
    this.propertySelectionStarted.emit();
  }

  protected cancelPropertySelection(): void {
    this.selectionRequestId += 1;
    this.selectionMode.set(false);
    this.selectionLoading.set(false);
    this.selectionError.set('');
    this.suggestedLocation.set(null);
    this.candidatePoint.set(null);
    this.map?.setOptions({ draggableCursor: null });
    this.map?.panTo({ lat: this.location().lat, lng: this.location().lng });
    this.propertyCircle?.setCenter({ lat: this.location().lat, lng: this.location().lng });
  }

  protected chooseAnotherPoint(): void {
    this.suggestedLocation.set(null);
    this.selectionError.set('');
  }

  protected acceptSuggestedLocation(): void {
    const suggestion = this.suggestedLocation();
    if (!suggestion) return;

    this.locationSelected.emit(suggestion);
    this.selectionMode.set(false);
    this.selectionLoading.set(false);
    this.selectionError.set('');
    this.suggestedLocation.set(null);
    this.candidatePoint.set(null);
    this.map?.setOptions({ draggableCursor: null });
    this.map?.panTo({ lat: suggestion.lat, lng: suggestion.lng });
    this.showPropertyCircle(suggestion);
    this.refreshStreetView(suggestion);
  }

  protected onMapClick(event: google.maps.MapMouseEvent): void {
    if (!this.selectionMode() || !event.latLng) return;
    void this.lookupSelectedPoint(event.latLng.toJSON());
  }

  protected onMarkerDragEnd(event: google.maps.MapMouseEvent): void {
    if (!this.selectionMode() || !event.latLng) return;
    void this.lookupSelectedPoint(event.latLng.toJSON());
  }

  private finishCameraMove(): void {
    this.showPropertyCircle();
    this.showConfirmation.set(true);
    this.mapSettled.emit();
  }

  private showPropertyCircle(location: PropertyLocation = this.location()): void {
    if (!this.map) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.pulseAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.pulseAnimationFrame);
    }
    this.propertyCircle?.setMap(null);
    this.propertyCircle = new google.maps.Circle({
      map: this.map,
      center: { lat: location.lat, lng: location.lng },
      radius: reduceMotion ? 10 : 4,
      clickable: false,
      fillColor: '#4c84ff',
      fillOpacity: reduceMotion ? 0.18 : 0.24,
      strokeColor: 'white',
      strokeOpacity: 0.95,
      strokeWeight: 2,
      zIndex: 2,
    });

    if (reduceMotion) return;

    const startedAt = performance.now();
    const animate = (timestamp: number) => {
      const progress = ((timestamp - startedAt) % 1800) / 1800;
      this.propertyCircle?.setOptions({
        radius: 4 + progress * 18,
        fillOpacity: 0.2 * (1 - progress),
        strokeOpacity: 0.9 * (1 - progress),
      });
      this.pulseAnimationFrame = window.requestAnimationFrame(animate);
    };
    this.pulseAnimationFrame = window.requestAnimationFrame(animate);
  }

  private async findNearbyStreetView(location: PropertyLocation = this.location()): Promise<void> {
    try {
      const response = await new google.maps.StreetViewService().getPanorama({
        location: { lat: location.lat, lng: location.lng },
        radius: 50,
        preference: google.maps.StreetViewPreference.BEST,
        sources: [google.maps.StreetViewSource.OUTDOOR],
      });

      if (!response.data?.location?.pano || !response.data.location.latLng) {
        this.streetViewStatus.set('unavailable');
        return;
      }

      this.streetViewData = response.data;
      this.streetViewStatus.set('available');
    } catch {
      this.streetViewStatus.set('unavailable');
    }
  }

  private initializeStreetView(): void {
    const container = this.streetViewContainer()?.nativeElement;
    const panoramaLocation = this.streetViewData?.location;
    if (!container || !panoramaLocation?.pano || !panoramaLocation.latLng) return;

    if (this.panorama) {
      this.panorama.setVisible(true);
      return;
    }

    this.panorama = new google.maps.StreetViewPanorama(container, {
      pano: panoramaLocation.pano,
      pov: {
        heading: this.headingToProperty(panoramaLocation.latLng),
        pitch: 0,
      },
      zoom: 1,
      addressControl: false,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      panControl: false,
      visible: true,
    });
  }

  private async lookupSelectedPoint(point: google.maps.LatLngLiteral): Promise<void> {
    const requestId = ++this.selectionRequestId;
    this.candidatePoint.set(point);
    this.suggestedLocation.set(null);
    this.selectionError.set('');
    this.selectionLoading.set(true);
    this.propertyCircle?.setCenter(point);

    try {
      const suggestion = await this.mapsLoader.reverseGeocodeLocation(point.lat, point.lng);
      if (requestId !== this.selectionRequestId || !this.selectionMode()) return;
      this.suggestedLocation.set(suggestion);
    } catch (error) {
      if (requestId !== this.selectionRequestId || !this.selectionMode()) return;
      this.selectionError.set(
        error instanceof AddressLookupError && error.code === 'NOT_FOUND'
          ? 'לא מצאנו כתובת ליד הנקודה הזו. נסו לבחור נקודה סמוכה.'
          : 'לא הצלחנו לזהות כתובת בנקודה הזו. אפשר לנסות שוב.',
      );
    } finally {
      if (requestId === this.selectionRequestId) this.selectionLoading.set(false);
    }
  }

  private refreshStreetView(location: PropertyLocation): void {
    if (!this.streetViewEnabled()) return;
    this.panorama?.setVisible(false);
    this.panorama = undefined;
    this.streetViewData = undefined;
    this.streetViewStatus.set('checking');
    void this.findNearbyStreetView(location);
  }

  private headingToProperty(from: google.maps.LatLng): number {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const fromLat = toRadians(from.lat());
    const toLat = toRadians(this.location().lat);
    const deltaLng = toRadians(this.location().lng - from.lng());
    const y = Math.sin(deltaLng) * Math.cos(toLat);
    const x =
      Math.cos(fromLat) * Math.sin(toLat) -
      Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }
}

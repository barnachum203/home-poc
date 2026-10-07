import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { PropertyLocation } from './property-location.model';

@Component({
  selector: 'app-property-map',
  imports: [GoogleMap, MapMarker],
  templateUrl: './property-map.component.html',
  styleUrl: './property-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyMapComponent {
  readonly location = input.required<PropertyLocation>();
  readonly confirmed = input(false);
  readonly addressConfirmed = output<void>();
  readonly addressRejected = output<void>();
  readonly mapSettled = output<void>();

  protected readonly zoom = signal(15);
  protected readonly showConfirmation = signal(false);
  protected readonly mapOptions: google.maps.MapOptions = {
    mapTypeId: 'satellite' as google.maps.MapTypeId,
    disableDefaultUI: true,
    clickableIcons: false,
    keyboardShortcuts: false,
    gestureHandling: 'cooperative',
  };
  protected readonly markerOptions: google.maps.MarkerOptions = {
    title: 'הבית שנמצא',
    animation: 2 as google.maps.Animation,
  };

  protected onMapInitialized(map: google.maps.Map): void {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = this.location();
    map.setCenter({ lat: target.lat, lng: target.lng });

    if (reduceMotion) {
      map.setZoom(19);
      this.zoom.set(19);
      this.finishCameraMove();
      return;
    }

    [16, 17, 18, 19].forEach((level, index) => {
      window.setTimeout(() => {
        map.setZoom(level);
        this.zoom.set(level);
        if (level === 19) window.setTimeout(() => this.finishCameraMove(), 260);
      }, 260 * (index + 1));
    });
  }

  private finishCameraMove(): void {
    this.showConfirmation.set(true);
    this.mapSettled.emit();
  }
}

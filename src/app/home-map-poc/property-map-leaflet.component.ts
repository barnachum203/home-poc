import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { PropertyLocation } from './property-location.model';

@Component({
  selector: 'app-property-map-leaflet',
  templateUrl: './property-map-leaflet.component.html',
  styleUrl: './property-map-leaflet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyMapLeafletComponent implements AfterViewInit, OnDestroy {
  readonly location = input.required<PropertyLocation>();
  readonly confirmed = input(false);
  readonly addressConfirmed = output<void>();
  readonly addressRejected = output<void>();
  readonly mapSettled = output<void>();

  protected readonly showConfirmation = signal(false);

  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map?: L.Map;
  private propertyCircle?: L.Circle;
  private pulseAnimationFrame?: number;
  private settleTimer?: number;
  private settled = false;

  ngAfterViewInit(): void {
    const target = this.location();
    const position = L.latLng(target.lat, target.lng);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.map = L.map(this.mapContainer().nativeElement, {
      attributionControl: true,
      center: position,
      doubleClickZoom: true,
      scrollWheelZoom: false,
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'topleft' }).addTo(this.map);

    L.marker(position, {
      alt: 'הבית שנמצא',
      icon: L.icon({
        iconUrl: '/leaflet-images/marker-icon.png',
        iconRetinaUrl: '/leaflet-images/marker-icon-2x.png',
        shadowUrl: '/leaflet-images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      keyboard: true,
      title: 'הבית שנמצא',
    }).addTo(this.map);

    this.propertyCircle = L.circle(position, {
      bubblingMouseEvents: false,
      color: '#ffffff',
      fillColor: '#4c84ff',
      fillOpacity: reduceMotion ? 0.18 : 0.22,
      interactive: false,
      radius: reduceMotion ? 10 : 4,
      weight: 2,
    }).addTo(this.map);

    window.requestAnimationFrame(() => this.map?.invalidateSize());

    if (reduceMotion) {
      this.map.setView(position, 19, { animate: false });
      this.finishCameraMove();
      return;
    }

    this.map.once('moveend', () => this.finishCameraMove());
    this.settleTimer = window.setTimeout(() => this.finishCameraMove(), 1800);
    window.setTimeout(() => this.map?.flyTo(position, 19, { duration: 1.15 }), 180);
    this.animatePropertyCircle();
  }

  ngOnDestroy(): void {
    if (this.pulseAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.pulseAnimationFrame);
    }
    if (this.settleTimer !== undefined) {
      window.clearTimeout(this.settleTimer);
    }
    this.map?.remove();
  }

  private finishCameraMove(): void {
    if (this.settled) return;
    this.settled = true;
    this.showConfirmation.set(true);
    this.mapSettled.emit();
  }

  private animatePropertyCircle(): void {
    const startedAt = performance.now();
    const animate = (timestamp: number) => {
      const progress = ((timestamp - startedAt) % 1800) / 1800;
      this.propertyCircle?.setRadius(4 + progress * 18);
      this.propertyCircle?.setStyle({
        fillOpacity: 0.2 * (1 - progress),
        opacity: 0.9 * (1 - progress),
      });
      this.pulseAnimationFrame = window.requestAnimationFrame(animate);
    };
    this.pulseAnimationFrame = window.requestAnimationFrame(animate);
  }
}

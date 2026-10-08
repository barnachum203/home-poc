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

const PROPERTY_MARKER = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
    <path d="M19 1C9.1 1 1 9.1 1 19c0 12.5 16.5 27.2 17.2 27.8.5.4 1.1.4 1.6 0C20.5 46.2 37 31.5 37 19 37 9.1 28.9 1 19 1Z" fill="#1658e8" stroke="#fff" stroke-width="2"/>
    <path d="m12.5 19 6.5-5.5 6.5 5.5v8h-13v-8Z" fill="#fff"/>
    <path d="M17 27v-5h4v5" fill="none" stroke="#1658e8" stroke-width="1.6"/>
  </svg>
`)}`;

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
  private cameraTimer?: number;
  private settleTimer?: number;
  private resizeObserver?: ResizeObserver;
  private settled = false;

  ngAfterViewInit(): void {
    const target = this.location();
    const position = L.latLng(target.lat, target.lng);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const mapElement = this.mapContainer().nativeElement;

    this.map = L.map(mapElement, {
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
        iconUrl: PROPERTY_MARKER,
        iconSize: [38, 48],
        iconAnchor: [19, 47],
        popupAnchor: [0, -42],
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

    this.resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => this.map?.invalidateSize({ animate: false, pan: false }));
    });
    this.resizeObserver.observe(mapElement);

    if (reduceMotion) {
      window.requestAnimationFrame(() => {
        this.map?.invalidateSize({ animate: false, pan: false });
        this.map?.setView(position, 19, { animate: false });
        this.finishCameraMove();
      });
      return;
    }

    this.settleTimer = window.setTimeout(() => this.finishCameraMove(), 1800);
    this.cameraTimer = window.setTimeout(() => {
      this.map?.invalidateSize({ animate: false, pan: false });
      this.map?.once('moveend', () => this.finishCameraMove());
      this.map?.flyTo(position, 19, { duration: 1.15 });
    }, 180);
    this.animatePropertyCircle();
  }

  ngOnDestroy(): void {
    if (this.pulseAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.pulseAnimationFrame);
    }
    if (this.settleTimer !== undefined) {
      window.clearTimeout(this.settleTimer);
    }
    if (this.cameraTimer !== undefined) {
      window.clearTimeout(this.cameraTimer);
    }
    this.resizeObserver?.disconnect();
    const map = this.map;
    this.map = undefined;
    map?.remove();
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

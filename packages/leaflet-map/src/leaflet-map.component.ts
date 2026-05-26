import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import type { Map as LeafletMap } from 'leaflet';

declare const L: typeof import('leaflet');

const DEFAULT_VIEW: { center: [number, number]; zoom: number } = {
  center: [54.5, -2.0],
  zoom: 6,
};

/**
 * Shared Leaflet map wrapper for the rail-projects workspace.
 *
 * Uses @Input / EventEmitter / ngAfterViewInit rather than signal-based or
 * inject()-based APIs. Those functions call assertInInjectionContext() at
 * class-field initialisation time; when the compiled .mjs is pre-bundled by
 * Vite it gets its own copy of @angular/core, causing NG0203 every time the
 * component is created inside a dynamically-rendered @if block. The decorator-
 * based equivalents and lifecycle hooks carry no such injection-context
 * requirement and work correctly across both code paths.
 */
@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div #mapContainer style="width: 100%; height: 100%; z-index: 1;"></div>',
  styles: [
    ':host { display: block; width: 100%; height: 100%; position: relative; }',
  ],
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  @Input() initialView: { center: [number, number]; zoom: number } = DEFAULT_VIEW;

  @Output() readonly mapReady = new EventEmitter<LeafletMap>();

  private mapInst: LeafletMap | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    if (typeof L === 'undefined') {
      console.error(
        'LeafletMapComponent: global `L` is not defined. Add leaflet to angular.json scripts.',
      );
      return;
    }
    const el = this.mapContainer.nativeElement;
    if (this.mapInst) this.mapInst.remove();

    this.mapInst = L.map(el).setView(this.initialView.center, this.initialView.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.mapInst);

    this.resizeObserver = new ResizeObserver(() => {
      if (this.mapInst) {
        requestAnimationFrame(() => this.mapInst!.invalidateSize());
      }
    });
    this.resizeObserver.observe(el);

    setTimeout(() => {
      if (this.mapInst) this.mapInst.invalidateSize();
    }, 150);

    this.mapReady.emit(this.mapInst);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mapInst) {
      this.mapInst.remove();
      this.mapInst = null;
    }
  }
}

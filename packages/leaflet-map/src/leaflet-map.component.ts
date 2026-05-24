import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  ViewChild,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import type { Map as LeafletMap } from 'leaflet';

declare const L: typeof import('leaflet');

/**
 * Default centre + zoom suit the GB rail use cases this workspace covers.
 * Override per-host via the `initialView` input if needed.
 */
const DEFAULT_VIEW: { center: [number, number]; zoom: number } = {
  center: [54.5, -2.0],
  zoom: 6,
};

/**
 * Shared Leaflet map wrapper for the rail-projects workspace.
 *
 * - Initialises the Leaflet map via `afterNextRender` so the container DOM
 *   exists before `L.map(...)` runs (matches Angular's zoneless-friendly
 *   lifecycle).
 * - Uses a `ResizeObserver` to call `invalidateSize()` whenever the
 *   container resizes (e.g. modal opens, sidebar collapses).
 * - Emits `mapReady` with the live `L.Map` instance so the host component
 *   can add markers, polylines, etc. against it.
 * - Cleans up the observer and the map on destroy.
 *
 * Consumers are expected to load Leaflet's CSS + the global `L` script
 * via `angular.json` (the same way every existing consumer does) — this
 * component intentionally does not bundle Leaflet itself.
 */
@Component({
  selector: 'app-leaflet-map',
  // NB: `standalone: true` is explicit here even though it's the default
  // in Angular 21+, because consumer Angular compilers don't infer it
  // for components imported from node_modules without baked-in metadata.
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div #mapContainer style="width: 100%; height: 100%; z-index: 1;"></div>',
  styles: [
    ':host { display: block; width: 100%; height: 100%; position: relative; }',
  ],
})
export class LeafletMapComponent implements OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  /** Optional override for the initial map centre + zoom. */
  readonly initialView = input<{ center: [number, number]; zoom: number }>(DEFAULT_VIEW);

  /** Emits once the map is initialised; carries the live `L.Map` instance. */
  readonly mapReady = output<LeafletMap>();

  private mapInst: LeafletMap | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly injector = inject(Injector);

  constructor() {
    afterNextRender(() => this.initMap(), { injector: this.injector });
  }

  private initMap(): void {
    if (typeof L === 'undefined') {
      console.error(
        'LeafletMapComponent: global `L` is not defined. Add leaflet to angular.json scripts (or import it before the map component renders).',
      );
      return;
    }
    const el = this.mapContainer.nativeElement;
    if (this.mapInst) this.mapInst.remove();

    const view = this.initialView();
    this.mapInst = L.map(el).setView(view.center, view.zoom);
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

    // One late invalidateSize() catches the case where the container is
    // inside a modal that animated open after init.
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

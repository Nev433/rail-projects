# rail-leaflet-map

Shared Angular Leaflet map wrapper for the rail-projects workspace. One canonical implementation of "render a Leaflet map sized to its container" that every project in the family imports.

## What it gives you

A single standalone Angular component (`<app-leaflet-map>`):

- Initialises Leaflet via `afterNextRender` (zoneless-friendly).
- Uses `ResizeObserver` to call `invalidateSize()` when the container resizes (modals, sidebars).
- Emits `mapReady` with the live `L.Map` instance so the host adds its own markers / polylines / layers.
- Cleans up the observer and the map on destroy.
- Default centre/zoom suits GB rail; override via the `initialView` input.

## Install (workspace `file:` ref)

```jsonc
// in <consumer>/client-ng/package.json
"dependencies": {
  "rail-leaflet-map": "file:../rail-projects/packages/leaflet-map"
}
```

Requires both repos checked out as siblings under `~/Developer/` per the workspace standard layout.

## Use

```ts
// in some-page.component.ts
import { Component } from '@angular/core';
import { LeafletMapComponent } from 'rail-leaflet-map';

@Component({
  selector: 'app-some-page',
  imports: [LeafletMapComponent],
  template: `
    <div style="height: 600px">
      <app-leaflet-map (mapReady)="onMapReady($event)" />
    </div>
  `,
})
export class SomePageComponent {
  onMapReady(map: import('leaflet').Map) {
    // add markers, polylines, fit bounds, etc.
  }
}
```

## Consumer requirements

The component intentionally does **not** bundle Leaflet itself — every existing consumer already loads Leaflet as a global script via `angular.json`:

```jsonc
// in angular.json -> projects.<name>.architect.build.options.scripts
"scripts": [
  "node_modules/leaflet/dist/leaflet.js"
],
"styles": [
  "node_modules/leaflet/dist/leaflet.css",
  // ...
]
```

That keeps Leaflet outside the Angular build's tree-shaking concerns.

## Build / distribution

This package ships **as TypeScript source** (no `dist/`, no build step). Consumer Angular builds compile the source as part of their own pipeline. Works because:

- The package's `main` / `exports` point at `src/index.ts`.
- Angular 17+ esbuild handles TS imports from `node_modules` cleanly.
- The component is plain standalone Angular — no AOT-specific tricks that need pre-compilation.

If/when this needs to be published to npm, switch to an `ng-packagr` build at that point.

## Related

- Workspace [CLAUDE.md](../../CLAUDE.md) — explains the `packages/` location, the `file:` ref distribution pattern, and the broader workspace conventions.
- [rail-id-client](https://github.com/Nev433/rail-id-client) — the workspace's other shared package (Rail-ID-Service HTTP client). Same `file:` ref distribution.

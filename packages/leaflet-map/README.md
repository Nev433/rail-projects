# rail-leaflet-map

Shared Angular Leaflet map wrapper for the rail-projects workspace. One canonical implementation of "render a Leaflet map sized to its container" that every project in the family imports.

**Status (May 2026): ng-packagr-built and adopted by railML-Timetable.** Other consumers can switch over opportunistically.

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
  "rail-leaflet-map": "file:../../rail-projects/packages/leaflet-map/dist"
}
```

⚠️ **Point at `/dist/`, not the package root.** `ng-packagr` writes the publishable package layout into `dist/` with its own `package.json` that has correct relative paths. `file:`-ref'ing the source root pulls in raw `.ts` files Angular's consumer compiler can't use.

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

`ng-packagr` builds an Angular Package Format (APF) bundle into `dist/`. Consumers `file:`-ref the `dist/` folder.

```bash
npm install        # also runs `npm run build` via the prepare script
npm run build      # ng-packagr -p ng-package.json
```

The `prepare` script means `file:`-ref consumers running `npm install` get a freshly-built `dist/` automatically.

If/when this is published to npm, point the publish at `dist/` (or use `npm publish` from inside `dist/`).

## Related

- Workspace [CLAUDE.md](../../CLAUDE.md) — explains the `packages/` location, the `file:` ref distribution pattern, and the broader workspace conventions.
- [rail-id-client](https://github.com/Nev433/rail-id-client) — the workspace's other shared package (Rail-ID-Service HTTP client). Same `file:` ref distribution.

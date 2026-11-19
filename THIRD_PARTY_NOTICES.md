# Third-party notices

LENTERA source code is licensed under Apache-2.0 (see `LICENSE`). The bundled
data and assets below keep their own licenses.

## Indonesian province geometry

- File: `src/modules/map/indonesia.geojson`
- Source: geoBoundaries, `IDN` ADM1, build `IDN-ADM1-65028918`
  (https://www.geoboundaries.org), derived from OpenStreetMap via
  Wambacher's boundary service.
- License: Open Data Commons Open Database License 1.0 (ODbL-1.0).
- Changes: filtered to Indonesian provinces, properties reduced to `state`,
  English province names translated to Indonesian, geometry simplified with a
  Douglas–Peucker tolerance of 0.012° and coordinates rounded to 3 decimals.
  The derived file remains available under ODbL-1.0.
- Attribution: © OpenStreetMap contributors, via geoBoundaries. Boundary data
  is schematic and not an official reference.

## Fonts and icons

- `lucide-react` icons: ISC License.
- UI typefaces are loaded from the system stack; no font files are bundled.

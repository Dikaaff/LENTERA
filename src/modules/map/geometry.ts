import raw from "./indonesia.geojson?raw";

type Ring = number[][];
type Polygon = Ring[];
interface Feature {
  properties: { state: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Polygon | Polygon[] };
}
interface Collection {
  features: Feature[];
}

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 420;

const project = ([lon, lat]: number[]) => [
  ((lon - 94) / 48) * MAP_WIDTH,
  ((6 - lat) / 17) * MAP_HEIGHT,
];

const ringPath = (ring: Ring) =>
  ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

const polygonPath = (polygon: Polygon) => polygon.map(ringPath).join(" ");

const geometryPath = (geometry: Feature["geometry"]) =>
  geometry.type === "Polygon"
    ? polygonPath(geometry.coordinates as Polygon)
    : (geometry.coordinates as Polygon[]).map(polygonPath).join(" ");

export interface RegionShape {
  name: string;
  path: string;
}

export const regions: RegionShape[] = (JSON.parse(raw) as Collection).features
  .map((feature) => ({
    name: feature.properties.state,
    path: geometryPath(feature.geometry),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const countByRegion = (rows: { region: string }[]) =>
  rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.region] = (counts[row.region] ?? 0) + 1;
    return counts;
  }, {});

export const shadeFor = (count: number, max: number) => {
  if (count === 0 || max === 0) return "var(--color-surface)";
  const ratio = Math.max(0.2, count / max);
  return `color-mix(in oklab, var(--color-amber) ${Math.round(ratio * 70)}%, var(--color-surface))`;
};

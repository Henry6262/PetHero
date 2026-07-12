import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import ukraineGeoJSON from "./geo/ukraine.json";
import russiaGeoJSON from "./geo/russia.json";

export const ukraineBoundary = ukraineGeoJSON as FeatureCollection<Polygon | MultiPolygon>;
export const russiaBoundary = russiaGeoJSON as FeatureCollection<Polygon | MultiPolygon>;

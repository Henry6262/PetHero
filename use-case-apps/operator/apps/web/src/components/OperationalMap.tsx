import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, NavigationControl, ScaleControl, Source } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { Asset, RouteWaypoint, Squadron, MissionZone, FusedTrack, SensorFeed } from "../types/data";
import type { TheaterSubSector, TheaterVector } from "@shared/theater";
import {
  toAssetGeoJSON,
  toFusedTrackEllipseGeoJSON,
  toFusedTrackGeoJSON,
  toFrontLineGeoJSON,
  toRawTrackGeoJSON,
  toRouteGeoJSON,
  toSquadronGeoJSON,
  toSquadronHeadingGeoJSON,
  toSubSectorGeoJSON,
  toVectorGeoJSON,
  toZoneGeoJSON,
} from "../lib/geo";
import { russiaBoundary, ukraineBoundary } from "../data/geo";

interface OperationalMapProps {
  squadrons: Squadron[];
  zones: MissionZone[];
  subSectors?: TheaterSubSector[];
  vectors?: TheaterVector[];
  fusedTracks?: FusedTrack[];
  rawFeeds?: SensorFeed[];
  route?: RouteWaypoint[];
  frontLine?: [number, number][];
  assets?: Asset[];
  onSelectSquadron?: (squadron: Squadron | null) => void;
  onSelectAsset?: (asset: Asset | null) => void;
  selectedSquadronId?: string | null;
  selectedAssetId?: string | null;
  focus?: { lat: number; lon: number } | null;
}

export default function OperationalMap({
  squadrons,
  zones,
  subSectors = [],
  vectors = [],
  fusedTracks = [],
  rawFeeds = [],
  route,
  frontLine,
  assets = [],
  onSelectSquadron,
  onSelectAsset,
  selectedSquadronId,
  selectedAssetId,
  focus,
}: OperationalMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);

  const bounds = useMemo(() => {
    // Operational view is the theater COP: frame the territorial picture first.
    // Local mission route/assets are rendered as overlays but do not pull the
    // viewport away from the theater, which is usually hundreds of km away.
    const lats: number[] = [];
    const lons: number[] = [];
    if (zones.length > 0) {
      zones.forEach((zone) => {
        zone.ring.forEach(([lon, lat]) => {
          lats.push(lat);
          lons.push(lon);
        });
      });
    }
    if (frontLine && frontLine.length > 0) {
      frontLine.forEach(([lon, lat]) => {
        lats.push(lat);
        lons.push(lon);
      });
    }
    // Fall back to squadrons only when no theater geometry is available.
    if (lats.length === 0) {
      if (squadrons.length === 0) return null;
      squadrons.forEach((s) => {
        lats.push(s.lat);
        lons.push(s.lon);
      });
    }
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
    };
  }, [squadrons, frontLine, zones]);

  const initialView = useMemo(() => {
    if (!bounds) return { latitude: 49, longitude: 35, zoom: 5 };
    const latSpan = Math.max(0.02, bounds.maxLat - bounds.minLat);
    const lonSpan = Math.max(0.02, bounds.maxLon - bounds.minLon);
    // Rough zoom heuristic; route detail gets priority when the span is small.
    const zoom = Math.min(16, Math.max(6, 8.5 - Math.log2(Math.max(latSpan, lonSpan))));
    return {
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLon + bounds.maxLon) / 2,
      zoom,
    };
  }, [bounds]);

  useEffect(() => {
    if (!focus || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [focus.lon, focus.lat],
      zoom: 14,
      speed: 1.2,
    });
  }, [focus]);

  const squadronFeatures = useMemo(
    () => toSquadronGeoJSON(squadrons, selectedSquadronId, hoveredId),
    [squadrons, selectedSquadronId, hoveredId]
  );

  const squadronHeadingFeatures = useMemo(
    () => toSquadronHeadingGeoJSON(squadrons),
    [squadrons]
  );

  const zoneFeatures = useMemo(() => toZoneGeoJSON(zones), [zones]);

  const rawFeatures = useMemo(() => toRawTrackGeoJSON(rawFeeds), [rawFeeds]);
  const fusedFeatures = useMemo(() => toFusedTrackGeoJSON(fusedTracks), [fusedTracks]);
  const fusedEllipseFeatures = useMemo(
    () => toFusedTrackEllipseGeoJSON(fusedTracks),
    [fusedTracks]
  );

  const routeFeatures = useMemo(() => (route ? toRouteGeoJSON(route) : null), [route]);
  const frontLineFeatures = useMemo(
    () => (frontLine ? toFrontLineGeoJSON(frontLine) : null),
    [frontLine]
  );
  const subSectorFeatures = useMemo(() => toSubSectorGeoJSON(subSectors), [subSectors]);
  const { arrows: vectorArrows, labels: vectorLabels } = useMemo(
    () => toVectorGeoJSON(vectors),
    [vectors]
  );
  const assetFeatures = useMemo(
    () => toAssetGeoJSON(assets, selectedAssetId, hoveredAssetId),
    [assets, selectedAssetId, hoveredAssetId]
  );

  const handleClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.find((f) => f.properties?.id);
    if (!feature) {
      onSelectSquadron?.(null);
      onSelectAsset?.(null);
      return;
    }
    const id = feature.properties.id as string;
    const layerId = feature.layer?.id as string | undefined;

    if (layerId === "asset-dots") {
      const asset = assets.find((a) => a.id === id) ?? null;
      onSelectAsset?.(asset && selectedAssetId === id ? null : asset);
      onSelectSquadron?.(null);
      return;
    }

    const squadron = squadrons.find((s) => s.id === id) ?? null;
    onSelectSquadron?.(squadron && selectedSquadronId === id ? null : squadron);
    onSelectAsset?.(null);
  };

  const handleMouseMove = (event: MapLayerMouseEvent) => {
    const feature = event.features?.find((f) => f.properties?.id);
    const id = (feature?.properties?.id as string) ?? null;
    const layerId = feature?.layer?.id as string | undefined;
    if (layerId === "asset-dots") {
      setHoveredAssetId(id);
      setHoveredId(null);
    } else {
      setHoveredId(id);
      setHoveredAssetId(null);
    }
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={initialView}
      style={{ width: "100%", height: "100%" }}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      interactiveLayerIds={["squadron-dots", "asset-dots"]}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHoveredId(null);
        setHoveredAssetId(null);
      }}
    >
      <NavigationControl position="top-left" />
      <ScaleControl position="bottom-right" />

      {/* Country boundaries for the primary belligerents — always visible reference. */}
      <Source id="ukraine-boundary" type="geojson" data={ukraineBoundary}>
        <Layer
          id="ukraine-border-glow"
          type="line"
          paint={{
            "line-color": "#00a8dc",
            "line-width": 8,
            "line-opacity": 0.25,
          }}
        />
        <Layer
          id="ukraine-border"
          type="line"
          paint={{
            "line-color": "#00a8dc",
            "line-width": 2.5,
            "line-opacity": 1,
          }}
        />
      </Source>

      <Source id="russia-boundary" type="geojson" data={russiaBoundary}>
        <Layer
          id="russia-border-glow"
          type="line"
          paint={{
            "line-color": "#ff3031",
            "line-width": 8,
            "line-opacity": 0.25,
          }}
        />
        <Layer
          id="russia-border"
          type="line"
          paint={{
            "line-color": "#ff3031",
            "line-width": 2.5,
            "line-opacity": 1,
          }}
        />
      </Source>

      <Source id="zones" type="geojson" data={zoneFeatures}>
        <Layer
          id="zone-fill"
          type="fill"
          paint={{
            "fill-color": ["get", "fillColor"],
            // Administrative affiliation: visible but reads as background claim.
            "fill-opacity": 0.14,
          }}
        />
        <Layer
          id="zone-border-glow"
          type="line"
          paint={{
            "line-color": ["get", "borderColor"],
            "line-width": 10,
            "line-opacity": 0.25,
          }}
        />
        <Layer
          id="zone-border"
          type="line"
          paint={{
            "line-color": ["get", "borderColor"],
            "line-width": 3,
            "line-opacity": 1,
          }}
        />
        <Layer
          id="zone-label"
          type="symbol"
          minzoom={5}
          layout={{
            "text-field": ["get", "label"],
            "text-size": 16,
            "text-anchor": "center",
            "text-allow-overlap": true,
          }}
          paint={{
            "text-color": ["get", "borderColor"],
            "text-halo-color": "#0b0f14",
            "text-halo-width": 2,
            "text-opacity": 0.9,
          }}
        />
      </Source>

      {subSectors.length > 0 && (
        <Source id="sub-sectors" type="geojson" data={subSectorFeatures}>
          <Layer
            id="sub-sector-fill"
            type="fill"
            minzoom={7}
            paint={{
              "fill-color": ["get", "fillColor"],
              "fill-opacity": 0.35,
            }}
          />
          <Layer
            id="sub-sector-border"
            type="line"
            minzoom={7}
            paint={{
              "line-color": ["get", "borderColor"],
              "line-width": 1.5,
              "line-opacity": 0.7,
              "line-dasharray": [4, 3],
            }}
          />
        </Source>
      )}

      {frontLineFeatures && (
        <Source id="front-line" type="geojson" data={frontLineFeatures}>
          {/* Thin contested line marker — the actual disputed area is rendered
              by the boundary-aligned sub-sectors above. */}
          <Layer
            id="front-line-glow"
            type="line"
            paint={{
              "line-color": "#fbbf24",
              "line-width": 8,
              "line-opacity": 0.25,
              "line-blur": 3,
            }}
          />
          <Layer
            id="front-line"
            type="line"
            paint={{
              "line-color": "#ffffff",
              "line-width": 2,
              "line-opacity": 0.9,
              "line-dasharray": [5, 4],
            }}
          />
          <Layer
            id="front-line-label"
            type="symbol"
            layout={{
              "text-field": "Line of Contact",
              "text-size": 13,
              "text-anchor": "center",
              "text-allow-overlap": true,
              "symbol-placement": "line",
              "text-offset": [0, -1.2],
            }}
            paint={{
              "text-color": "#fbbf24",
              "text-halo-color": "#0b0f14",
              "text-halo-width": 2,
            }}
          />
        </Source>
      )}

      {vectors.length > 0 && (
        <Source id="vector-arrows" type="geojson" data={vectorArrows}>
          <Layer
            id="vector-arrow-glow"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": 7,
              "line-opacity": 0.25,
              "line-blur": 3,
            }}
          />
          <Layer
            id="vector-arrow-fill"
            type="fill"
            paint={{
              "fill-color": ["get", "fillColor"],
              "fill-opacity": 0.5,
            }}
          />
          <Layer
            id="vector-arrow-border"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": 2.5,
              "line-opacity": 0.95,
            }}
          />
        </Source>
      )}

      {vectors.length > 0 && (
        <Source id="vector-labels" type="geojson" data={vectorLabels}>
          <Layer
            id="vector-label"
            type="symbol"
            layout={{
              "text-field": ["get", "label"],
              "text-size": 12,
              "text-anchor": "center",
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            }}
            paint={{
              "text-color": ["get", "color"],
              "text-halo-color": "#0b0f14",
              "text-halo-width": 2,
            }}
          />
        </Source>
      )}

      {routeFeatures && (
        <Source id="route" type="geojson" data={routeFeatures}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#f5e600",
              "line-width": 5,
              "line-opacity": 0.95,
              "line-dasharray": [4, 3],
            }}
          />
          <Layer
            id="route-waypoints"
            type="circle"
            paint={{
              "circle-color": "#f5e600",
              "circle-radius": 6,
              "circle-stroke-color": "#0b0f14",
              "circle-stroke-width": 2,
            }}
          />
        </Source>
      )}

      <Source id="fused-ellipses" type="geojson" data={fusedEllipseFeatures}>
        <Layer
          id="fused-ellipse-fill"
          type="fill"
          paint={{
            "fill-color": ["get", "fillColor"],
            "fill-opacity": 1,
          }}
        />
        <Layer
          id="fused-ellipse-border"
          type="line"
          paint={{
            "line-color": ["get", "borderColor"],
            "line-width": 1.5,
          }}
        />
      </Source>

      <Source id="raw-tracks" type="geojson" data={rawFeatures}>
        <Layer
          id="raw-track-dots"
          type="circle"
          paint={{
            "circle-color": ["get", "color"],
            "circle-radius": 4,
            "circle-opacity": 0.35,
            "circle-stroke-width": 0,
          }}
        />
      </Source>

      <Source id="squadrons" type="geojson" data={squadronFeatures}>
        {/* Dark halo so bright squadron pucks cut through same-color zones. */}
        <Layer
          id="squadron-halo"
          type="circle"
          paint={{
            "circle-color": "#0b0f14",
            "circle-radius": [
              "case",
              ["boolean", ["get", "selected"], false],
              26,
              ["boolean", ["get", "hovered"], false],
              21,
              14,
            ],
            "circle-opacity": 0.9,
            "circle-blur": 0.4,
          }}
        />
        {/* Glow ring so units pop against the basemap and zone fills. */}
        <Layer
          id="squadron-glow"
          type="circle"
          paint={{
            "circle-color": ["get", "color"],
            "circle-radius": [
              "case",
              ["boolean", ["get", "selected"], false],
              24,
              ["boolean", ["get", "hovered"], false],
              19,
              12,
            ],
            "circle-opacity": 0.35,
            "circle-blur": 0.6,
          }}
        />
        <Layer
          id="squadron-dot"
          type="circle"
          paint={{
            "circle-color": ["get", "color"],
            "circle-radius": [
              "case",
              ["boolean", ["get", "selected"], false],
              16,
              ["boolean", ["get", "hovered"], false],
              12,
              8,
            ],
            "circle-opacity": 1,
            "circle-stroke-color": [
              "case",
              ["boolean", ["get", "selected"], false],
              "#ffffff",
              "#0b0f14",
            ],
            "circle-stroke-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              2.5,
              1.5,
            ],
          }}
        />
        <Layer
          id="squadron-shape"
          type="symbol"
          layout={{
            "text-field": ["get", "shape"],
            "text-size": [
              "case",
              ["boolean", ["get", "selected"], false],
              14,
              ["boolean", ["get", "hovered"], false],
              11,
              8,
            ],
            "text-anchor": "center",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          }}
          paint={{
            "text-color": "#ffffff",
            "text-halo-color": "#0b0f14",
            "text-halo-width": 0.8,
          }}
        />
        <Layer
          id="squadron-labels"
          type="symbol"
          minzoom={9}
          layout={{
            "text-field": ["get", "callsign"],
            "text-size": 10,
            "text-offset": [0, 1.1],
            "text-anchor": "top",
            "text-allow-overlap": false,
          }}
          paint={{
            "text-color": "#e5e7eb",
            "text-halo-color": "#0b0f14",
            "text-halo-width": 1.5,
          }}
        />
      </Source>

      <Source id="squadron-headings" type="geojson" data={squadronHeadingFeatures}>
        <Layer
          id="squadron-heading-lines"
          type="line"
          minzoom={7}
          paint={{
            "line-color": ["get", "color"],
            "line-width": 2,
            "line-opacity": 0.8,
          }}
        />
      </Source>

      {assets.length > 0 && (
        <Source id="assets" type="geojson" data={assetFeatures}>
          <Layer
            id="asset-dots"
            type="circle"
            paint={{
              "circle-color": ["get", "color"],
              "circle-radius": [
                "case",
                ["boolean", ["get", "selected"], false],
                18,
                ["boolean", ["get", "hovered"], false],
                14,
                11,
              ],
              "circle-stroke-color": [
                "case",
                ["boolean", ["get", "selected"], false],
                "#ffffff",
                "rgba(0,0,0,0.5)",
              ],
              "circle-stroke-width": [
                "case",
                ["boolean", ["get", "selected"], false],
                3,
                1.5,
              ],
            }}
          />
          <Layer
            id="asset-labels"
            type="symbol"
            minzoom={9}
            layout={{
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-offset": [0, 1.4],
              "text-anchor": "top",
              "text-allow-overlap": false,
            }}
            paint={{
              "text-color": "#e5e7eb",
              "text-halo-color": "#0b0f14",
              "text-halo-width": 1.5,
            }}
          />
        </Source>
      )}

      <Source id="fused-tracks" type="geojson" data={fusedFeatures}>
        {/* Confidence halo — bigger for high-confidence tracks. */}
        <Layer
          id="fused-track-halo"
          type="circle"
          paint={{
            "circle-color": ["get", "color"],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "confidence"],
              0.5,
              10,
              1.0,
              18,
            ],
            "circle-opacity": 0.25,
            "circle-blur": 0.5,
          }}
        />
        <Layer
          id="fused-track-diamond"
          type="symbol"
          layout={{
            "text-field": ["get", "symbol"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["get", "confidence"],
              0.5,
              10,
              1.0,
              15,
            ],
            "text-anchor": "center",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          }}
          paint={{
            "text-color": ["get", "color"],
            "text-halo-color": "#0b0f14",
            "text-halo-width": 1.5,
          }}
        />
        <Layer
          id="fused-track-labels"
          type="symbol"
          minzoom={6}
          layout={{
            "text-field": ["concat", ["get", "id"], "\n", ["round", ["*", ["get", "confidence"], 100]], "%"],
            "text-size": 10,
            "text-offset": [0, 1.2],
            "text-anchor": "top",
            "text-allow-overlap": false,
          }}
          paint={{
            "text-color": "#e5e7eb",
            "text-halo-color": "#0b0f14",
            "text-halo-width": 1.5,
          }}
        />
      </Source>
    </Map>
  );
}

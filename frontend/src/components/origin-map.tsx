"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface OriginMapProps {
  /** Region name (e.g., "Esmeraldas, Ecuador") */
  region: string;
  /** Optional custom coordinates [lat, lng] */
  coordinates?: [number, number];
  /** Map height in pixels */
  height?: number;
  /** CSS class for the container */
  className?: string;
}

/**
 * Known coordinates for Ecuadorian cacao/coffee regions.
 * Used as fallback when the contract doesn't store GPS coordinates.
 */
const REGION_COORDINATES: Record<string, [number, number]> = {
  // Costa
  esmeraldas: [0.9592, -79.6539],
  "los rios": [-1.0225, -79.4608],
  "los ríos": [-1.0225, -79.4608],
  manabi: [-1.0547, -80.4545],
  manabí: [-1.0547, -80.4545],
  guayas: [-2.209, -79.9088],
  "el oro": [-3.2599, -79.9553],
  "santo domingo": [-0.2532, -79.1719],

  // Sierra
  loja: [-3.999, -79.2044],
  zamora: [-4.0686, -78.9536],
  "zamora chinchipe": [-4.0686, -78.9536],
  bolivar: [-1.5906, -79.0053],
  bolívar: [-1.5906, -79.0053],
  cotopaxi: [-0.6833, -78.5667],
  imbabura: [0.3518, -78.1224],

  // Amazonia
  napo: [-0.99, -77.8125],
  sucumbios: [0.0862, -76.8895],
  sucumbíos: [0.0862, -76.8895],
  orellana: [-0.4666, -76.9833],
  morona: [-2.3006, -78.1186],
  "morona santiago": [-2.3006, -78.1186],
  pastaza: [-1.4887, -78.0027],

  // Galápagos
  galapagos: [-0.7476, -90.3151],
  galápagos: [-0.7476, -90.3151],
};

/**
 * Default center: Ecuador
 */
const ECUADOR_CENTER: [number, number] = [-1.8312, -78.1834];
const DEFAULT_ZOOM = 7;
const REGION_ZOOM = 10;

/**
 * Resolve coordinates from a region string.
 * Tries exact match, then partial match on known regions.
 */
function resolveCoordinates(region: string): [number, number] | null {
  const lower = region.toLowerCase().trim();

  // Direct match
  if (REGION_COORDINATES[lower]) return REGION_COORDINATES[lower];

  // Try matching on the first part (before comma)
  const firstPart = lower.split(",")[0].trim();
  if (REGION_COORDINATES[firstPart]) return REGION_COORDINATES[firstPart];

  // Partial match: check if known region is contained in the input
  for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
    if (lower.includes(key) || key.includes(firstPart)) {
      return coords;
    }
  }

  return null;
}

/**
 * Interactive Leaflet map showing the origin of a batch.
 * Falls back to a general Ecuador overview if the region is unknown.
 */
export function OriginMap({
  region,
  coordinates,
  height = 300,
  className = "",
}: OriginMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const resolved = coordinates ?? resolveCoordinates(region);
    const center = resolved ?? ECUADOR_CENTER;
    const zoom = resolved ? REGION_ZOOM : DEFAULT_ZOOM;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    if (resolved) {
      // Custom green marker
      const icon = L.divIcon({
        html: `<div style="
          background: #16a34a;
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        "><span style="transform: rotate(45deg); font-size: 14px;">🌿</span></div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      L.marker(resolved, { icon })
        .addTo(map)
        .bindPopup(
          `<div style="text-align:center;">
            <strong>📍 Origen</strong><br/>
            <span>${region}</span>
          </div>`
        )
        .openPopup();
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [region, coordinates]);

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden border ${className}`}
      style={{ height, width: "100%" }}
    />
  );
}

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number) => void;
  draggable?: boolean;
  className?: string;
}

export function LocationMap({
  lat,
  lng,
  onLocationChange,
  draggable = false,
  className = "h-64 w-full rounded-lg"
}: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for callbacks to avoid stale closures in event listeners
  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Use provided coordinates or default to Kerala
    const initialLat = (lat && lat !== 0) ? lat : 10.8505;
    const initialLng = (lng && lng !== 0) ? lng : 76.2711;
    const zoom = (lat && lat !== 0) ? 15 : 7;

    // Initialize map
    const map = L.map(containerRef.current).setView([initialLat, initialLng], zoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add marker only if we have valid coordinates, OR if we want to show a starting marker
    const marker = L.marker([initialLat, initialLng], {
      icon: defaultIcon,
      draggable: draggable
    }).addTo(map);
    markerRef.current = marker;

    // Event listeners
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onLocationChangeRef.current?.(position.lat, position.lng);
    });

    map.on('click', (e) => {
      if (!marker.dragging?.enabled()) return;
      // Only allow click-to-move if draggable is true? 
      // The original code checked 'if (draggable)' outside.
      // We handle that via the effect below or check ref?
      // Let's use the prop passed to the closure, but that's stale?
      // Actually, let's just re-implement the drill:
      // logic was: if (draggable) setup listeners.
      // But if draggable changes, we need to remove listeners? Leaflet is tricky with removing anonymous listeners.
      // Easier: check draggableRef inside listener?
    });

    // We'll set up a robust click handler using the ref pattern as well if needed.
    // But simplistic approach:

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Init only

  // Handle draggable updates
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;

    const marker = markerRef.current;

    if (draggable) {
      marker.dragging?.enable();
      // Since we can't easily add/remove listeners without storing the function reference,
      // we might stick to always having the listener but checking condition inside.
    } else {
      marker.dragging?.disable();
    }
  }, [draggable]);

  // Handle click to move logic (needs to be aware of draggable)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const map = mapRef.current;
    const marker = markerRef.current;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (!draggable) return;
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationChangeRef.current?.(lat, lng);
    };

    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [draggable]);


  // Update map view and marker when lat/lng changes
  // Update map view and marker when lat/lng changes
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      // If 0,0 is passed (e.g. manual mode reset), don't fly to 0,0 in ocean
      // Check if valid
      if (lat !== 0 && lng !== 0) {
        mapRef.current.setView([lat, lng], 15);
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [lat, lng]);

  return (
    <div ref={containerRef} className={className} />
  );
}

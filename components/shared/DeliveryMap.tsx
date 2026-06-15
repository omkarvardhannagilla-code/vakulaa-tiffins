'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLng {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  restaurant: LatLng;
  customer: LatLng;
  /** 0 = at restaurant, 1 = arrived at customer */
  progress: number;
}

// Simple linear interpolation between the two points
function interpolate(a: LatLng, b: LatLng, t: number): [number, number] {
  return [a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t];
}

const restaurantIcon = L.divIcon({
  className: '',
  html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))">🏪</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const homeIcon = L.divIcon({
  className: '',
  html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))">📍</div>`,
  iconSize: [26, 30],
  iconAnchor: [13, 28],
});

const scootyIcon = L.divIcon({
  className: '',
  html: `<div style="
      width:40px;height:40px;border-radius:50%;
      background:#15803d;border:3px solid #fff;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 3px 10px rgba(0,0,0,.35);font-size:20px">🛵</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function DeliveryMap({ restaurant, customer, progress }: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const scootyRef = useRef<L.Marker | null>(null);

  // Initialise once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    L.marker([restaurant.lat, restaurant.lng], { icon: restaurantIcon })
      .addTo(map)
      .bindTooltip('Vakulaa Tiffins', { direction: 'top', offset: [0, -10] });

    L.marker([customer.lat, customer.lng], { icon: homeIcon })
      .addTo(map)
      .bindTooltip('Your location', { direction: 'top', offset: [0, -26] });

    // Dashed route line
    L.polyline(
      [
        [restaurant.lat, restaurant.lng],
        [customer.lat, customer.lng],
      ],
      { color: '#15803d', weight: 3, dashArray: '8 8', opacity: 0.7 }
    ).addTo(map);

    // Rider starts at the restaurant
    const start = interpolate(restaurant, customer, Math.min(Math.max(progress, 0), 1));
    const scooty = L.marker(start, { icon: scootyIcon, zIndexOffset: 1000 }).addTo(map);
    scootyRef.current = scooty;

    // Frame the whole journey
    const bounds = L.latLngBounds(
      [restaurant.lat, restaurant.lng],
      [customer.lat, customer.lng]
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
      scootyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the rider whenever progress changes
  useEffect(() => {
    if (!scootyRef.current) return;
    const t = Math.min(Math.max(progress, 0), 1);
    scootyRef.current.setLatLng(interpolate(restaurant, customer, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}

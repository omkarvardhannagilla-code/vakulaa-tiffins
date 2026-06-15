'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { X, MapPin, Loader2, Move } from 'lucide-react';
import { DeliveryLocation, RESTAURANT_LOCATION } from '@/types';
import { calculateDistance, estimateDeliveryTime } from '@/lib/utils';
import { isWithinDeliveryZone } from '@/lib/delivery-zone';
import toast from 'react-hot-toast';

// Map is client-only (Leaflet touches `window`), so load it with SSR disabled.
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-brand-mist/40">
      <Loader2 className="animate-spin text-brand-forest" size={20} />
    </div>
  ),
});

interface AddressModalProps {
  onClose: () => void;
  onSave: (location: DeliveryLocation) => void;
  autoDetect?: boolean;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await geo.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function AddressModal({ onClose, onSave, autoDetect }: AddressModalProps) {
  const [address, setAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  // Pin starts at the restaurant; user detects or drags to their spot.
  const [lat, setLat] = useState(RESTAURANT_LOCATION.lat);
  const [lng, setLng] = useState(RESTAURANT_LOCATION.lng);
  const [touched, setTouched] = useState(false);

  const deliverable = isWithinDeliveryZone(lat, lng);
  const distanceKm = calculateDistance(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, lat, lng);
  const deliveryMins = estimateDeliveryTime(lat, lng);

  // Auto-detect on open when arriving from the "Detect My Location" button
  useEffect(() => {
    if (autoDetect) handleDetect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDetect() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      return;
    }
    setIsDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;
      setLat(latitude);
      setLng(longitude);
      const detected = await reverseGeocode(latitude, longitude);
      setAddress(detected);
      setTouched(true);
      toast.success('Location detected! Drag the pin to fine-tune.');
    } catch {
      toast.error('Could not detect location. Drag the pin or type your address.');
    } finally {
      setIsDetecting(false);
    }
  }

  // When the pin is dragged/tapped, refresh the address text
  async function handlePinChange(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
    setTouched(true);
    const addr = await reverseGeocode(newLat, newLng);
    setAddress(addr);
  }

  function handleSave() {
    if (!address.trim()) {
      toast.error('Detect your location or enter an address');
      return;
    }
    if (!deliverable) {
      toast.error("Sorry, we can't deliver here!");
      return;
    }
    onSave({ address: address.trim(), lat, lng, isDetected: true });
    toast.success('Delivery spot saved!');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl text-brand-forest">Delivery Location</h3>
            <p className="text-xs text-gray-400 mt-0.5">Pin your exact drop-off spot</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <button
          onClick={handleDetect}
          disabled={isDetecting}
          className="w-full flex items-center gap-3 border-2 border-dashed border-brand-forest/30 rounded-xl p-3.5 mb-3 hover:border-brand-forest/60 hover:bg-brand-mist/50 transition-all disabled:opacity-60"
        >
          {isDetecting ? (
            <Loader2 size={20} className="text-brand-forest animate-spin" />
          ) : (
            <MapPin size={20} className="text-brand-forest" />
          )}
          <span className="text-sm font-medium text-brand-forest">
            {isDetecting ? 'Detecting location…' : 'Use my current location'}
          </span>
        </button>

        {/* Interactive map — drag the pin to confirm the exact spot */}
        <div className="h-56 rounded-xl overflow-hidden border border-gray-200 mb-2">
          <LocationMap lat={lat} lng={lng} onChange={handlePinChange} />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Move size={12} /> Drag the pin or tap the map to set your exact location
        </p>

        {touched && (
          deliverable ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4 text-sm text-green-800">
              ✅ We deliver here! ~{distanceKm.toFixed(1)} km away · approx <b>{deliveryMins} min</b>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4 text-sm text-red-700">
              😔 Sorry, we can't deliver here! We currently serve inside Hyderabad (ORR) and Chevella only.
            </div>
          )
        )}

        <div className="relative flex items-center mb-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="mx-3 text-xs text-gray-400 uppercase tracking-wider">address</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="e.g. Flat 301, Green Valley Apartments, Miyapur, Hyderabad – 500049"
          className="vakulaa-input resize-none mb-4"
          rows={3}
        />

        <button
          onClick={handleSave}
          disabled={touched && !deliverable}
          className="w-full bg-brand-forest text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-leaf transition-colors btn-plate disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Delivery Spot →
        </button>
      </motion.div>
    </div>
  );
}

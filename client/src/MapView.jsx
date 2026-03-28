import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { loadGoogleMapsScript } from "./loadGoogleMaps.js";

// Leaflet default marker icons (Vite bundling)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapView({ latitude, longitude, label }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const leafletMarker = useRef(null);
  const googleMap = useRef(null);
  const googleMarker = useRef(null);
  const [useLeaflet, setUseLeaflet] = useState(!googleKey);
  const [googleLoadError, setGoogleLoadError] = useState("");

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    if (!googleKey || useLeaflet) return;

    let cancelled = false;
    setGoogleLoadError("");

    loadGoogleMapsScript(googleKey)
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        if (!googleMap.current) {
          googleMap.current = new maps.Map(mapRef.current, {
            center: { lat: latitude, lng: longitude },
            zoom: 12,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          });
          googleMarker.current = new maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: googleMap.current,
            title: label || "Location",
          });
        } else {
          const pos = { lat: latitude, lng: longitude };
          googleMap.current.setCenter(pos);
          googleMap.current.setZoom(12);
          googleMarker.current.setPosition(pos);
          googleMarker.current.setTitle(label || "Location");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setGoogleLoadError(err.message || "Google Maps could not load");
        setUseLeaflet(true);
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, label, useLeaflet]);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    if (googleKey && !useLeaflet) return;

    const el = mapRef.current;
    if (!el) return;

    if (googleKey && useLeaflet && el.firstChild) {
      el.innerHTML = "";
    }
    if (useLeaflet) {
      googleMap.current = null;
      googleMarker.current = null;
    }

    if (!leafletMap.current) {
      leafletMap.current = L.map(el).setView([latitude, longitude], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(leafletMap.current);
      leafletMarker.current = L.marker([latitude, longitude]).addTo(leafletMap.current);
    } else {
      leafletMap.current.setView([latitude, longitude], 12);
      leafletMarker.current.setLatLng([latitude, longitude]);
    }
    leafletMarker.current.bindPopup(label || "Location").openPopup();
  }, [latitude, longitude, label, useLeaflet]);

  useEffect(() => {
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        leafletMarker.current = null;
      }
      if (mapRef.current && googleMap.current) {
        mapRef.current.innerHTML = "";
      }
      googleMap.current = null;
      googleMarker.current = null;
    };
  }, []);

  if (latitude == null || longitude == null) {
    return <p className="hint">Search a location to show the map.</p>;
  }

  return (
    <>
      {googleKey && !useLeaflet ? (
        <p className="hint">
          Map: <strong>Google Maps</strong>
        </p>
      ) : googleKey && useLeaflet && googleLoadError ? (
        <p className="error" role="alert">
          Google Maps: {googleLoadError}. Showing OpenStreetMap instead.
        </p>
      ) : (
        <p className="hint">
          Map: <strong>OpenStreetMap</strong> — add <code>VITE_GOOGLE_MAPS_API_KEY</code> in{" "}
          <code>client/.env</code> to use Google Maps (see README).
        </p>
      )}
      <div className="map-wrap" ref={mapRef} aria-label="Map" />
    </>
  );
}

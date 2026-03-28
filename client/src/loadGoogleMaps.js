let loadPromise = null;

/**
 * Loads the Maps JavaScript API once. Key must be a browser-restricted Maps JS API key.
 */
export function loadGoogleMapsScript(apiKey) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-app-google-maps="1"]');
    if (existing) {
      const done = () => {
        if (window.google?.maps?.Map) resolve(window.google.maps);
        else reject(new Error("Google Maps failed to initialize"));
      };
      if (window.google?.maps?.Map) {
        done();
        return;
      }
      existing.addEventListener("load", done);
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps script failed"))
      );
      return;
    }

    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
    s.async = true;
    s.defer = true;
    s.dataset.appGoogleMaps = "1";
    s.onload = () => {
      if (window.google?.maps?.Map) resolve(window.google.maps);
      else reject(new Error("Google Maps API not available after load"));
    };
    s.onerror = () => reject(new Error("Could not load Google Maps script (check key & billing)"));
    document.head.appendChild(s);
  });

  return loadPromise;
}

/**
 * @module modules/commands/util/geo-data.js
 * @description Geolocation presets and storage logic.
 */

export const PRESETS = {
    london:      { lat: 51.5074,  lng: -0.1278,   label: "London, UK" },
    nyc:         { lat: 40.7128,  lng: -74.0060,  label: "New York, USA" },
    india:       { lat: 20.5937,  lng: 78.9629,   label: "India" },
    tokyo:       { lat: 35.6762,  lng: 139.6503,  label: "Tokyo, Japan" },
    mexico:      { lat: 23.6345,  lng: -102.5528, label: "Mexico" },
    brazil:      { lat: -14.2350, lng: -51.9253,  label: "Brazil" },
    italy:       { lat: 41.8719,  lng: 12.5674,   label: "Italy" },
    philippines: { lat: 12.8797,  lng: 121.7740,  label: "Philippines" },
};

const CUSTOM_STORAGE_KEY = "wh_geo_custom";

/** Load user-saved custom locations from storage. */
export async function getCustomLocations() {
    try {
        const data = await chrome.storage.local.get(CUSTOM_STORAGE_KEY);
        return data[CUSTOM_STORAGE_KEY] || {};
    } catch (_) {
        return {};
    }
}

export async function saveCustomLocations(locs) {
    await chrome.storage.local.set({ [CUSTOM_STORAGE_KEY]: locs });
}

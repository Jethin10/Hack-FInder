import { Coordinates } from "../types";

export interface LocationOption {
  label: string;
  coordinates?: Coordinates;
}

export const LOCATION_OPTIONS: LocationOption[] = [
  { label: "Anywhere" },
  { label: "📍 Use My Location" },
  // India
  { label: "Delhi NCR", coordinates: { lat: 28.6139, lng: 77.209 } },
  { label: "Noida", coordinates: { lat: 28.5355, lng: 77.391 } },
  { label: "Bangalore", coordinates: { lat: 12.9716, lng: 77.5946 } },
  { label: "Mumbai", coordinates: { lat: 19.076, lng: 72.8777 } },
  { label: "Pune", coordinates: { lat: 18.5204, lng: 73.8567 } },
  { label: "Hyderabad", coordinates: { lat: 17.385, lng: 78.4867 } },
  { label: "Chennai", coordinates: { lat: 13.0827, lng: 80.2707 } },
  { label: "Kolkata", coordinates: { lat: 22.5726, lng: 88.3639 } },
  { label: "Jaipur", coordinates: { lat: 26.9124, lng: 75.7873 } },
  { label: "Ahmedabad", coordinates: { lat: 23.0225, lng: 72.5714 } },
  // USA
  { label: "San Francisco", coordinates: { lat: 37.7749, lng: -122.4194 } },
  { label: "New York", coordinates: { lat: 40.7128, lng: -74.006 } },
  { label: "Seattle", coordinates: { lat: 47.6062, lng: -122.3321 } },
  { label: "Austin", coordinates: { lat: 30.2672, lng: -97.7431 } },
  { label: "Boston", coordinates: { lat: 42.3601, lng: -71.0589 } },
  // Europe
  { label: "London", coordinates: { lat: 51.5074, lng: -0.1278 } },
  { label: "Berlin", coordinates: { lat: 52.52, lng: 13.405 } },
  { label: "Amsterdam", coordinates: { lat: 52.3676, lng: 4.9041 } },
  { label: "Paris", coordinates: { lat: 48.8566, lng: 2.3522 } },
  // Asia-Pacific
  { label: "Singapore", coordinates: { lat: 1.3521, lng: 103.8198 } },
  { label: "Tokyo", coordinates: { lat: 35.6762, lng: 139.6503 } },
  { label: "Sydney", coordinates: { lat: -33.8688, lng: 151.2093 } },
  // Canada
  { label: "Toronto", coordinates: { lat: 43.6532, lng: -79.3832 } },
  { label: "Vancouver", coordinates: { lat: 49.2827, lng: -123.1207 } },
];

export const LOCATION_COORDINATES_BY_LABEL = LOCATION_OPTIONS.reduce<
  Record<string, Coordinates | undefined>
>((accumulator, location) => {
  accumulator[location.label] = location.coordinates;
  return accumulator;
}, {});

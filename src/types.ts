import { TextContent } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Base Query Params for Flight Position endpoints
export interface BaseFlightPositionsQueryParams {
  bounds?: string | null;
  flights?: string | null;
  callsigns?: string | null;
  registrations?: string | null;
  painted_as?: string | null;
  operating_as?: string | null;
  airports?: string | null;
  routes?: string | null;
  aircraft?: string | null;
  altitude_ranges?: string | null;
  squawks?: string | null;
  categories?: string | null;
  data_sources?: string | null;
  airspaces?: string | null;
  gspeed?: string | null;
}

// Query Params for Live Flight Positions (Full & Light)
export interface LiveFlightPositionsQueryParams extends BaseFlightPositionsQueryParams {
  limit?: number | null;
}

// Query Params for Live Flight Position Count (No Limit)
export interface LiveFlightPositionsCountQueryParams extends BaseFlightPositionsQueryParams {}

// Query Params for Historic Flight Positions (Full & Light)
export interface HistoricFlightPositionsQueryParams extends LiveFlightPositionsQueryParams {
  timestamp: number; // Required
}

// Query Params for Historic Flight Position Count
export interface HistoricFlightPositionsCountQueryParams extends BaseFlightPositionsQueryParams {
  timestamp: number; // Required
}

// Flight Summary Query Params - Based on Zod schema in server.ts
export interface FlightSummaryQueryParams {
  flight_ids?: string | null;
  flight_datetime_from?: string | null;
  flight_datetime_to?: string | null;
  flights?: string | null;
  callsigns?: string | null;
  registrations?: string | null;
  painted_as?: string | null;
  operating_as?: string | null;
  airports?: string | null;
  routes?: string | null;
  aircraft?: string | null;
  sort?: 'asc' | 'desc' | null;
  limit?: number | null;
}

// Flight Summary Count Query Params
export interface FlightSummaryCountQueryParams {
  flight_ids?: string | null;
  flight_datetime_from?: string | null;
  flight_datetime_to?: string | null;
  flights?: string | null;
  callsigns?: string | null;
  registrations?: string | null;
  painted_as?: string | null;
  operating_as?: string | null;
  airports?: string | null;
  routes?: string | null;
  aircraft?: string | null;
}

// Common Count Response
export interface RecordCountResponse {
  record_count: number;
}

// Airline Info (Light - already exists, suitable for /light)
export interface AirlineInfo {
  icao: string;
  iata: string;
  name: string;
}

// Airport Info Light
export interface AirportInfoLight {
  name: string;
  iata: string;
  icao: string;
}

// Airport Info Full Nested Types
interface CountryInfo {
  code: string;
  name: string;
}

interface TimezoneInfo {
  name: string;
  offset: number;
}

// Airport Info Full
export interface AirportFullInfo {
  name: string;
  iata: string;
  icao: string;
  lon: number;
  lat: number;
  elevation: number;
  country: CountryInfo;
  city: string;
  state: string | null;
  timezone: TimezoneInfo;
}

// Flight Position Light (Existing 'FlightPosition' renamed)
export interface FlightPositionLight {
  fr24_id: string;
  hex: string;
  callsign: string;
  lat: number;
  lon: number;
  track: number;
  alt: number;
  gspeed: number;
  vspeed: number;
  squawk: string; // Note: API schema shows string, example shows number. Using string.
  timestamp: string; // ISO 8601 format
  source: string; // ADSB, MLAT, ESTIMATED
}

// Flight Position Full
export interface FlightPositionFull extends FlightPositionLight {
  flight: string;
  type: string;
  reg: string;
  painted_as: string;
  operating_as: string;
  orig_iata: string;
  orig_icao: string;
  dest_iata: string;
  dest_icao: string;
  eta: string; // ISO 8601 format
}

// Historic Flight Position Light (Same structure as Live Light)
export type HistoricFlightPositionLight = FlightPositionLight;

// Historic Flight Position Full (Same structure as Live Full)
export type HistoricFlightPositionFull = FlightPositionFull;

export interface FlightTracksQueryParams {
  flight_id: string; // Required, hex
}

// Flight Summary Full
export interface FlightSummaryFull {
  fr24_id: string;
  flight: string | null;
  callsign: string | null;
  operating_as: string | null;
  painted_as: string | null;
  type: string | null;
  reg: string | null;
  orig_icao: string | null;
  orig_iata: string | null;
  datetime_takeoff: string | null; // ISO 8601 format
  runway_takeoff: string | null;
  dest_icao: string | null;
  dest_iata: string | null;
  dest_icao_actual: string | null;
  dest_iata_actual: string | null;
  datetime_landed: string | null; // ISO 8601 format
  runway_landed: string | null;
  flight_time: number | null;
  actual_distance: number | null;
  circle_distance: number | null;
  category: string | null;
  hex: string | null;
  first_seen: string | null; // ISO 8601 format
  last_seen: string | null; // ISO 8601 format
  flight_ended?: boolean | null;
}

// Flight Summary Light
export interface FlightSummaryLight {
  fr24_id: string;
  flight: string | null;
  callsign: string | null;
  operating_as: string | null;
  painted_as: string | null;
  type: string | null;
  reg: string | null;
  orig_icao: string | null;
  datetime_takeoff: string | null; // ISO 8601 format
  dest_icao: string | null;
  dest_icao_actual: string | null;
  datetime_landed: string | null; // ISO 8601 format
  hex: string | null;
  first_seen: string | null; // ISO 8601 format
  last_seen: string | null; // ISO 8601 format
  flight_ended?: boolean | null;
}

// Flight Track Point
export interface FlightTrackPoint {
  timestamp: string; // ISO 8601 format
  lat: number;
  lon: number;
  alt: number;
  gspeed: number;
  vspeed: number;
  track: number;
  squawk: string;
  callsign: string;
  source: string;
}

// Flight Tracks Response
export interface FlightTracksResponse {
  fr24_id: string;
  tracks: FlightTrackPoint[];
}

// Legacy interfaces removed to avoid confusion

export interface FlightQueryParams {
  bounds?: string;
  flights?: string;
  callsigns?: string;
  registrations?: string;
  airports?: string;
  routes?: string;
  aircraft?: string;
  altitude_ranges?: string;
  categories?: string;
  limit?: number;
}

// Keep original AirlineQueryParams if needed
export interface AirlineQueryParams {
  icao: string;
}

// Keep original AirportQueryParams if needed
export interface AirportQueryParams {
  code: string;
}

// Keep original FlightPosition if it matches 'light' version
// Renaming it above to FlightPositionLight for clarity
/*
export interface FlightPosition {
  id: string; // Mapped to fr24_id
  callsign: string;
  registration: string; // Not in light
  latitude: number; // Mapped to lat
  longitude: number; // Mapped to lon
  altitude: number; // Mapped to alt
  heading: number; // Mapped to track
  speed: number; // Mapped to gspeed
  squawk: string;
  aircraft_type: string; // Not in light
  airline: string; // Not in light
  origin: string; // Not in light
  destination: string; // Not in light
}
*/

// Keep original AirportFullInfo if it matches 'light' version
// Renaming it above to AirportInfoLight for clarity
/*
export interface AirportFullInfo {
  code: string; // Not in light (use icao/iata)
  name: string;
  city: string; // Not in light
  country: string; // Not in light
  latitude: number; // Not in light
  longitude: number; // Not in light
  timezone: string; // Not in light
  type: string; // Not in light
}
*/ 
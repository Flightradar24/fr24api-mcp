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
export interface LiveFlightPositionsQueryParams extends BaseFlightPositionsQueryParams {
  limit?: number | null;
}
export interface LiveFlightPositionsCountQueryParams extends BaseFlightPositionsQueryParams {}
export interface HistoricFlightPositionsQueryParams extends LiveFlightPositionsQueryParams {
  timestamp: number; // Required
}
export interface HistoricFlightPositionsCountQueryParams extends BaseFlightPositionsQueryParams {
  timestamp: number; // Required
}
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
export interface RecordCountResponse {
  record_count: number;
}
export interface AirlineInfo {
  icao: string;
  iata: string;
  name: string;
}
export interface AirportInfoLight {
  name: string;
  iata: string;
  icao: string;
}
interface CountryInfo {
  code: string;
  name: string;
}

interface TimezoneInfo {
  name: string;
  offset: number;
}
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
export type HistoricFlightPositionLight = FlightPositionLight;
export type HistoricFlightPositionFull = FlightPositionFull;

export interface FlightTracksQueryParams {
  flight_id: string; // Required, hex
}
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
export interface FlightTracksResponse {
  fr24_id: string;
  tracks: FlightTrackPoint[];
}
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
export interface AirlineQueryParams {
  icao: string;
}
export interface AirportQueryParams {
  code: string;
}

// Historic Flight Events
export interface HistoricFlightEventsQueryParams {
  flight_ids: string; // Required, comma-separated fr24_ids (maximum 15 IDs)
  event_types: string; // Required, comma-separated event types or 'all'
}

export interface FlightEventDetails {
  gate_ident?: string | null;
  gate_lat?: number | null;
  gate_lon?: number | null;
  takeoff_runway?: string | null;
  landed_icao?: string | null;
  landed_runway?: string | null;
  exited_airspace?: string | null;
  exited_airspace_id?: string | null;
  entered_airspace?: string | null;
  entered_airspace_id?: string | null;
}

export interface FlightEvent {
  type: string; // gate_departure, takeoff, cruising, airspace_transition, descent, landed, gate_arrival
  timestamp: string; // ISO 8601 format
  lat?: number;
  lon?: number;
  alt?: number;
  gspeed?: number;
  details?: FlightEventDetails;
}

export interface HistoricFlightEventsFull {
  fr24_id: string;
  callsign: string;
  hex: string;
  operating_as: string;
  painted_as: string;
  orig_iata: string;
  orig_icao: string;
  dest_iata: string;
  dest_icao: string;
  events: FlightEvent[];
}

export interface HistoricFlightEventsLight {
  fr24_id: string;
  callsign: string;
  hex: string;
  events: FlightEvent[];
}

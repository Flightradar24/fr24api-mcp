import axios, { AxiosError } from 'axios';
import {
  AirlineInfo,
  AirportFullInfo,
  AirportInfoLight,
  FlightPositionLight,
  LiveFlightPositionsQueryParams,
  LiveFlightPositionsCountQueryParams,
  HistoricFlightPositionsQueryParams,
  HistoricFlightPositionsCountQueryParams,
  FlightTracksQueryParams,
  FlightPositionFull,
  RecordCountResponse,
  HistoricFlightPositionFull,
  HistoricFlightPositionLight,
  FlightSummaryFull,
  FlightSummaryLight,
  FlightTracksResponse,
  HistoricFlightEventsQueryParams,
  HistoricFlightEventsFull,
  HistoricFlightEventsLight
} from './types.js';

export class FR24Client {
  private readonly baseUrl = 'https://fr24api.flightradar24.com/api';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      console.log(`Making request to ${endpoint} with params: ${JSON.stringify(params)}`);
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: params,
        headers: {
          'Accept': 'application/json',
          'Accept-Version': 'v1',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      // Handle responses nested under 'data' key, except for count endpoints and single objects
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data as T;
      }
      // Handle count responses
      if (response.data && typeof response.data.record_count === 'number') {
        return response.data as T;
      }
      // Handle single object responses (like flight tracks, airport info, airline info)
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          return response.data as T;
      }
      // Fallback for unexpected structure
      return response.data as T;
    } catch (error) {
      const message = error instanceof AxiosError ? error.message : 'Unknown error';
      console.error(`API Request Failed: ${endpoint}`, error);
      throw new Error(`Failed request to ${endpoint}: ${message}`);
    }
  }

  // --- Live Flight Positions ---

  async getLivePositionsLight(params: LiveFlightPositionsQueryParams): Promise<FlightPositionLight[]> {
    return this.makeRequest<FlightPositionLight[]>('/live/flight-positions/light', params);
  }

  async getLivePositionsFull(params: LiveFlightPositionsQueryParams): Promise<FlightPositionFull[]> {
    return this.makeRequest<FlightPositionFull[]>('/live/flight-positions/full', params);
  }

  async getLivePositionsCount(params: LiveFlightPositionsCountQueryParams): Promise<RecordCountResponse> {
    return this.makeRequest<RecordCountResponse>('/live/flight-positions/count', params);
  }

  // --- Historic Flight Positions ---

  async getHistoricPositionsFull(params: HistoricFlightPositionsQueryParams): Promise<HistoricFlightPositionFull[]> {
    return this.makeRequest<HistoricFlightPositionFull[]>('/historic/flight-positions/full', params);
  }

  async getHistoricPositionsLight(params: HistoricFlightPositionsQueryParams): Promise<HistoricFlightPositionLight[]> {
    return this.makeRequest<HistoricFlightPositionLight[]>('/historic/flight-positions/light', params);
  }

  async getHistoricPositionsCount(params: HistoricFlightPositionsCountQueryParams): Promise<RecordCountResponse> {
    return this.makeRequest<RecordCountResponse>('/historic/flight-positions/count', params);
  }

  // --- Flight Summary ---

  async getFlightSummaryFull(params: Record<string, any>): Promise<FlightSummaryFull[]> {
    return this.makeRequest<FlightSummaryFull[]>('/flight-summary/full', params);
  }

  async getFlightSummaryLight(params: Record<string, any>): Promise<FlightSummaryLight[]> {
    return this.makeRequest<FlightSummaryLight[]>('/flight-summary/light', params);
  }

  async getFlightSummaryCount(params: Record<string, any>): Promise<RecordCountResponse> {
    return this.makeRequest<RecordCountResponse>('/flight-summary/count', params);
  }

  // --- Flight Tracks ---

  async getFlightTracks(params: FlightTracksQueryParams): Promise<FlightTracksResponse[]> {
    return this.makeRequest<FlightTracksResponse[]>('/flight-tracks', params);
  }

  // --- Historic Flight Events ---

  async getHistoricFlightEventsFull(params: HistoricFlightEventsQueryParams): Promise<HistoricFlightEventsFull[]> {
    return this.makeRequest<HistoricFlightEventsFull[]>('/historic/flight-events/full', params);
  }

  async getHistoricFlightEventsLight(params: HistoricFlightEventsQueryParams): Promise<HistoricFlightEventsLight[]> {
    return this.makeRequest<HistoricFlightEventsLight[]>('/historic/flight-events/light', params);
  }

  // --- Static Data --- (Airlines, Airports)

  // Existing method maps to /light
  async getAirlineInfo(icao: string): Promise<AirlineInfo> {
    return this.makeRequest<AirlineInfo>(`/static/airlines/${icao}/light`);
  }

  // Existing method maps to /light (after type rename)
  async getAirportInfoLight(code: string): Promise<AirportInfoLight> {
    return this.makeRequest<AirportInfoLight>(`/static/airports/${code}/light`);
  }

  // New method for /full
  async getAirportInfoFull(code: string): Promise<AirportFullInfo> {
    return this.makeRequest<AirportFullInfo>(`/static/airports/${ code}/full`);
  }
} 
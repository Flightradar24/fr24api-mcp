import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FR24Client } from './fr24-client.js';
import "mcps-logger/console";

// Helper function to remove null, undefined, and empty string properties from an object
function cleanParams<T extends Record<string, any>>(params: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in params) {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleaned[key] = params[key];
    }
  }
  return cleaned;
}

// Helper function to validate that at least one meaningful parameter is provided
function validateHasRequiredParams(params: Record<string, any>, excludeKeys: string[] = ['limit']): void {
  const meaningfulParams = Object.entries(params).filter(([key, value]) => 
    !excludeKeys.includes(key) && 
    value !== null && 
    value !== undefined && 
    value !== ''
  );
  
  if (meaningfulParams.length === 0) {
    throw new Error(`At least one parameter other than ${excludeKeys.join(', ')} must be provided and non-empty. Available parameters: ${Object.keys(params).filter(k => !excludeKeys.includes(k)).join(', ')}`);
  }
}

const baseFlightPositionsSchema = z.object({
  bounds: z.string().min(1).optional().describe('Coordinates defining an area. Order: north, south, west, east (comma-separated float values).'),
  flights: z.string().min(1).optional().describe('Flight numbers (comma-separated values, max 15).'),
  callsigns: z.string().min(1).optional().describe('Flight callsigns (comma-separated values, max 15).'),
  registrations: z.string().min(1).optional().describe('Aircraft registration numbers (comma-separated values, max 15).'),
  painted_as: z.string().min(1).optional().describe("Aircraft painted in an airline's livery (ICAO code, comma-separated, max 15)."),
  operating_as: z.string().min(1).optional().describe("Aircraft operating under an airline's call sign (ICAO code, comma-separated, max 15)."),
  airports: z.string().min(1).optional().describe('Airports (IATA/ICAO/ISO 3166-1 alpha-2) or countries. Use format: [direction:]<code>. Directions: inbound, outbound, both.'),
  routes: z.string().min(1).optional().describe('Flights between airports/countries (e.g., SE-US, ESSA-JFK). Max 15.'),
  aircraft: z.string().min(1).optional().describe('Aircraft ICAO type codes (comma-separated, max 15).'),
  altitude_ranges: z.string().min(1).optional().describe('Flight altitude ranges in feet (e.g., 0-3000, 5000-7000).'),
  squawks: z.string().min(1).optional().describe('Squawk codes in hex format (comma-separated).'),
  categories: z.string().min(1).optional().describe('Categories of Flights (comma-separated: P, C, M, J, T, H, B, G, D, V, O, N).'),
  data_sources: z.string().min(1).optional().describe('Source of information (comma-separated: ADSB, MLAT, ESTIMATED).'),
  airspaces: z.string().min(1).optional().describe('Flight information region in lower or upper airspace.'),
  gspeed: z.string().min(1).optional().describe('Flight ground speed in knots (single value or range, e.g., 120-140, 80).'),
  limit: z.number().optional().describe('Limit of results. Recommended, unless needed. Max 30000.')
});

const liveFlightPositionsSchema = baseFlightPositionsSchema;
const liveFlightPositionsCountSchema = baseFlightPositionsSchema;

const historicFlightPositionsSchema = baseFlightPositionsSchema.extend({
  timestamp: z.number().describe('Unix timestamp for the historical snapshot.'),
});

const historicFlightPositionsCountSchema = baseFlightPositionsSchema.extend({
  timestamp: z.number().describe('Unix timestamp for the historical snapshot.')
});

const flightSummaryToolParamsSchema = z.object({
  flight_datetime_from: z.string().min(1).describe('Start datetime (YYYY-MM-DDTHH:MM:SSZ). Requires flight_datetime_to. Cannot be used with flight_ids.'),
  flight_datetime_to: z.string().min(1).describe('End datetime (YYYY-MM-DDTHH:MM:SSZ). Requires flight_datetime_from. Cannot be used with flight_ids.'),
  flights: z.string().min(1).optional().describe('Flight numbers (comma-separated values, max 15).'),
  callsigns: z.string().min(1).optional().describe('Flight callsigns (comma-separated values, max 15).'),
  registrations: z.string().min(1).optional().describe('Aircraft registration numbers (comma-separated values, max 15).'),
  painted_as: z.string().min(1).optional().describe("Aircraft painted in an airline's livery (ICAO code, comma-separated, max 15)."),
  operating_as: z.string().min(1).optional().describe("Aircraft operating under an airline's call sign (ICAO code, comma-separated, max 15)."),
  airports: z.string().min(1).optional().describe('Airports (IATA/ICAO/ISO 3166-1 alpha-2) or countries. Use format: [direction:]<code>.'),
  routes: z.string().min(1).optional().describe('Flights between airports/countries (e.g., SE-US, ESSA-JFK). Max 15.'),
  aircraft: z.string().min(1).optional().describe('Aircraft ICAO type codes (comma-separated, max 15).'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sorting order by first_seen (default: asc).'),
  limit: z.number().optional().describe('Limit of results. Recommended, unless needed. Max 20000.')
});

const flightSummaryCountToolParamsSchema = z.object({
  flight_datetime_from: z.string().min(1).describe('Start datetime (YYYY-MM-DDTHH:MM:SSZ). Requires flight_datetime_to. Cannot be used with flight_ids.'),
  flight_datetime_to: z.string().min(1).describe('End datetime (YYYY-MM-DDTHH:MM:SSZ). Requires flight_datetime_from. Cannot be used with flight_ids.'),
  flights: z.string().min(1).optional().describe('Flight numbers (comma-separated values, max 15).'),
  callsigns: z.string().min(1).optional().describe('Flight callsigns (comma-separated values, max 15).'),
  registrations: z.string().min(1).optional().describe('Aircraft registration numbers (comma-separated values, max 15).'),
  painted_as: z.string().min(1).optional().describe("Aircraft painted in an airline's livery (ICAO code, comma-separated, max 15)."),
  operating_as: z.string().min(1).optional().describe("Aircraft operating under an airline's call sign (ICAO code, comma-separated, max 15)."),
  airports: z.string().min(1).optional().describe('Airports (IATA/ICAO/ISO 3166-1 alpha-2) or countries. Use format: [direction:]<code>.'),
  routes: z.string().min(1).optional().describe('Flights between airports/countries (e.g., SE-US, ESSA-JFK). Max 15.'),
  aircraft: z.string().min(1).optional().describe('Aircraft ICAO type codes (comma-separated, max 15).')
});

const flightTracksSchema = z.object({
  flight_id: z.string().min(1).describe('Flightradar24 ID of the flight (hexadecimal).')
});

const airlineInfoSchema = z.object({ icao: z.string().min(1).describe('Airline ICAO code.') });
const airportInfoLightSchema = z.object({ code: z.string().min(1).describe('Airport IATA or ICAO code.') });
const airportInfoFullSchema = z.object({ code: z.string().min(1).describe('Airport IATA or ICAO code.') });


/**
 * Creates and configures a Flightradar24 MCP server
 * @param apiKey The FR24 API key to use
 * @returns A configured McpServer instance
 */
export function createServer(apiKey: string): McpServer {
  const fr24Client = new FR24Client(apiKey);
  
  const server = new McpServer({
    name: 'Flightradar24 Gateway',
    version: '1.0.0'
  });

  // Register tools
  server.tool(
    'get_live_flights_positions_light',
    'Returns real-time aircraft flight movement information including latitude, longitude, speed, and altitude. IMPORTANT: At least one search parameter (other than limit) must be provided and non-empty. Choose from: bounds, flights, callsigns, registrations, painted_as, operating_as, airports, routes, aircraft, altitude_ranges, squawks, categories, data_sources, airspaces, gspeed.',
    liveFlightPositionsSchema.shape,
    async (params: z.infer<typeof liveFlightPositionsSchema>) => {
      try {
        validateHasRequiredParams(params, ['limit']);
        const cleaned = cleanParams(params);
        const result = await fr24Client.getLivePositionsLight(cleaned);
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${result.length} flights (light details):\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_live_flights_positions_full',
    'Returns real-time aircraft flight movement information including latitude, longitude, speed, and altitude alongside key flight and aircraft information such as origin, destination, callsign, registration and aircraft type. IMPORTANT: At least one search parameter (other than limit) must be provided and non-empty. Choose from: bounds, flights, callsigns, registrations, painted_as, operating_as, airports, routes, aircraft, altitude_ranges, squawks, categories, data_sources, airspaces, gspeed.',
    liveFlightPositionsSchema.shape,
    async (params: z.infer<typeof liveFlightPositionsSchema>) => {
       try {
        validateHasRequiredParams(params, ['limit']);
        const cleaned = cleanParams(params);
        const result = await fr24Client.getLivePositionsFull(cleaned);
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${result.length} flights (full details):\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_live_flights_count',
    'Returns the count of real-time aircraft flights matching the specified criteria. IMPORTANT: At least one search parameter (other than limit) must be provided and non-empty. Choose from: bounds, flights, callsigns, registrations, painted_as, operating_as, airports, routes, aircraft, altitude_ranges, squawks, categories, data_sources, airspaces, gspeed.',
    liveFlightPositionsCountSchema.shape,
    async (params: z.infer<typeof liveFlightPositionsCountSchema>) => {
      try {
        validateHasRequiredParams(params, ['limit']);
        const cleaned = cleanParams(params);
        const result = await fr24Client.getLivePositionsCount(cleaned);
        return {
          content: [{
            type: 'text' as const,
            text: `Live flight count: ${result.record_count}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_historic_flights_positions_full',
    'Returns historical aircraft flight movement information including latitude, longitude, speed, and altitude alongside key flight and aircraft information such as origin, destination, callsign, registration and aircraft type. FR24 API provides access to historical flight data, dating back to May 11, 2016, depending on the user\'s subscription plan. IMPORTANT: Timestamp is required, and at least one additional search parameter (other than limit) must be provided and non-empty.',
    historicFlightPositionsSchema.shape,
    async (params: z.infer<typeof historicFlightPositionsSchema>) => {
      try {
        validateHasRequiredParams(params, ['timestamp', 'limit']);
        const { timestamp, ...restParams } = params;
        const cleanedOptionalParams = cleanParams(restParams);
        const result = await fr24Client.getHistoricPositionsFull({ timestamp, ...cleanedOptionalParams });
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${result.length} historic flights (full details) at timestamp ${timestamp}:\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_historic_flights_positions_light',
    'Returns historical aircraft flight movement information including latitude, longitude, speed and altitude. FR24 API provides access to historical flight data, dating back to May 11, 2016, depending on the user\'s subscription plan. IMPORTANT: Timestamp is required, and at least one additional search parameter (other than limit) must be provided and non-empty.',
    historicFlightPositionsSchema.shape,
    async (params: z.infer<typeof historicFlightPositionsSchema>) => {
       try {
        validateHasRequiredParams(params, ['timestamp', 'limit']);
        const { timestamp, ...restParams } = params;
        const cleanedOptionalParams = cleanParams(restParams);
        const result = await fr24Client.getHistoricPositionsLight({ timestamp, ...cleanedOptionalParams });
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${result.length} historic flights (light details) at timestamp ${timestamp}:\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_historic_flights_count',
    'Returns number of historical aircraft flight positions. IMPORTANT: Timestamp is required, and at least one additional search parameter (other than limit) must be provided and non-empty.',
    historicFlightPositionsCountSchema.shape,
    async (params: z.infer<typeof historicFlightPositionsCountSchema>) => {
      try {
        validateHasRequiredParams(params, ['timestamp', 'limit']);
        const { timestamp, ...restParams } = params;
        const cleanedOptionalParams = cleanParams(restParams);
        const result = await fr24Client.getHistoricPositionsCount({ timestamp, ...cleanedOptionalParams });
        return {
          content: [{
            type: 'text' as const,
            text: `Historic flight count at timestamp ${timestamp}: ${result.record_count}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_flight_summary_full',
    'Returns comprehensive timings and locations of aircraft takeoffs and landings, including detailed flight, aircraft, and operator information. Both real-time and extensive historical data are available. Data is available starting from 2024-04-07 and will be extended further in the near future. IMPORTANT: flight_datetime_from and flight_datetime_to are required, and at least one additional search parameter (other than sort and limit) should be provided.',
    flightSummaryToolParamsSchema.shape,
    async (params: z.infer<typeof flightSummaryToolParamsSchema>) => {
      try {
        validateHasRequiredParams(params, ['flight_datetime_from', 'flight_datetime_to', 'sort', 'limit']);
        const cleaned = cleanParams(params);
        const result = await fr24Client.getFlightSummaryFull(cleaned);
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${result.length} flight summaries (full details):\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_flight_summary_light',
    'Returns key timings and locations of aircraft takeoffs and landings alongside all primary flight, aircraft, and operator information. Both real-time and historical data are available. Data is available starting from 2024-04-07 and will be extended further in the near future. IMPORTANT: flight_datetime_from and flight_datetime_to are required, and at least one additional search parameter (other than sort and limit) should be provided.',
    flightSummaryToolParamsSchema.shape,
    async (params: z.infer<typeof flightSummaryToolParamsSchema>) => {
       try {
        validateHasRequiredParams(params, ['flight_datetime_from', 'flight_datetime_to', 'sort', 'limit']);
        const cleaned = cleanParams(params);
        const result = await fr24Client.getFlightSummaryLight(cleaned);
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${result.length} flight summaries (light details):\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_flight_summary_count',
    'Returns the number of flights for a given flight summary query. IMPORTANT: flight_datetime_from and flight_datetime_to are required, and at least one additional search parameter should be provided.',
    flightSummaryCountToolParamsSchema.shape,
    async (params: z.infer<typeof flightSummaryCountToolParamsSchema>) => {
      try {
        validateHasRequiredParams(params, ['flight_datetime_from', 'flight_datetime_to']);
        const cleaned = cleanParams(params);
        const result = await fr24Client.getFlightSummaryCount(cleaned);
        console.log(`Flight summary count result: ${JSON.stringify(result, null, 2)}`);
        return {
          content: [{
            type: 'text' as const,
            text: `Flight summary count: ${result.record_count}`
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_flight_tracks',
    'Returns positional tracks of a specific flight. REQUIRED: flight_id must be provided and non-empty.',
    flightTracksSchema.shape,
    async (params: z.infer<typeof flightTracksSchema>) => {
      try {
        console.log(`Raw params received by handler: ${JSON.stringify(params)}`);
        const result = await fr24Client.getFlightTracks(params);
        const flightId = Array.isArray(result) && result.length > 0 ? result[0].fr24_id : 'unknown';
        return {
          content: [{
            type: 'text' as const,
            text: `Found track points for flight ${flightId}:\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_airline_info',
    'Returns airline name, ICAO and IATA codes. REQUIRED: icao code must be provided and non-empty.',
    airlineInfoSchema.shape,
    async (params: z.infer<typeof airlineInfoSchema>) => {
      const { icao } = params;
      try {
        console.log(`Raw params received by handler: ${JSON.stringify(params)}`);
        const airline = await fr24Client.getAirlineInfo(icao);
        return {
          content: [{
            type: 'text' as const,
            text: `Airline information (light):\n${JSON.stringify(airline, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error fetching airline info for ${icao}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_airport_info_light',
    'Returns airport name, ICAO and IATA codes. REQUIRED: code must be provided and non-empty.',
    airportInfoLightSchema.shape,
    async (params: z.infer<typeof airportInfoLightSchema>) => {
      const { code } = params;
      try {
        console.log(`Raw params received by handler: ${JSON.stringify(params)}`);
        const airport = await fr24Client.getAirportInfoLight(code);
        return {
          content: [{
            type: 'text' as const,
            text: `Airport information (light):\n${JSON.stringify(airport, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error fetching light airport info for ${code}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_airport_info_full',
    'Returns detailed airport information: full name, ICAO and IATA codes, localization, elevation, country, city, state, timezone details. REQUIRED: code must be provided and non-empty.',
    airportInfoFullSchema.shape,
    async (params: z.infer<typeof airportInfoFullSchema>) => {
      const { code } = params;
      try {
        console.log(`Raw params received by handler: ${JSON.stringify(params)}`);
        const airport = await fr24Client.getAirportInfoFull(code);
        return {
          content: [{
            type: 'text' as const,
            text: `Airport information (full):\n${JSON.stringify(airport, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error fetching full airport info for ${code}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );

  return server;
} 
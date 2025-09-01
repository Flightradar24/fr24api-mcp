import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FR24Client } from '../src/fr24-client.js';
import type { FlightPositionLight, RecordCountResponse, AirlineInfo, AirportInfoLight, AirportFullInfo, FlightTracksResponse, HistoricFlightEventsFull, HistoricFlightEventsLight } from '../src/types.js';

// Mock axios module
vi.mock('axios', () => {
  class MockAxiosError extends Error {}
  return {
    default: {
      get: vi.fn()
    },
    AxiosError: MockAxiosError
  };
});

// Import mocked axios for assertions and to use mocked AxiosError class
import axios, { AxiosError } from 'axios';

const mockedGet = (axios as unknown as { get: ReturnType<typeof vi.fn> }).get;

describe('FR24Client', () => {
  const apiKey = 'test-api-key';
  const client = new FR24Client(apiKey);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds required headers and passes params', async () => {
    const sample: FlightPositionLight[] = [
      {
        fr24_id: 'id1', hex: 'abc123', callsign: 'CALL1', lat: 1, lon: 2, track: 3, alt: 100, gspeed: 200, vspeed: 0, squawk: '7000', timestamp: '2024-01-01T00:00:00Z', source: 'ADSB'
      }
    ];
    mockedGet.mockResolvedValueOnce({ data: { data: sample } });

    const params = { bounds: '10,20,30,40', limit: 10 };
    const res = await client.getLivePositionsLight(params);
    expect(res).toEqual(sample);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    const [url, options] = mockedGet.mock.calls[0];
    expect(url).toBe('https://fr24api.flightradar24.com/api/live/flight-positions/light');
    expect(options.params).toEqual(params);
    expect(options.headers).toEqual({
      Accept: 'application/json',
      'Accept-Version': 'v1',
      Authorization: `Bearer ${apiKey}`
    });
  });

  it('handles list responses under data.data', async () => {
    const sample: FlightPositionLight[] = [
      {
        fr24_id: 'id2', hex: 'def456', callsign: 'CALL2', lat: 3, lon: 4, track: 5, alt: 110, gspeed: 210, vspeed: 1, squawk: '7001', timestamp: '2024-01-02T00:00:00Z', source: 'ADSB'
      }
    ];
    mockedGet.mockResolvedValueOnce({ data: { data: sample } });

    const res = await client.getLivePositionsFull({ limit: 1 });
    expect(res).toEqual(sample);
  });

  it('handles count responses', async () => {
    const sample: RecordCountResponse = { record_count: 42 };
    mockedGet.mockResolvedValueOnce({ data: sample });

    const res = await client.getHistoricPositionsCount({ timestamp: 1700000000 });
    expect(res).toEqual(sample);
  });

  it('handles single object responses (airline)', async () => {
    const sample: AirlineInfo = { icao: 'ABC', iata: 'AB', name: 'Air ABC' };
    mockedGet.mockResolvedValueOnce({ data: sample });

    const res = await client.getAirlineInfo('ABC');
    expect(res).toEqual(sample);
  });

  it('handles single object responses (airport light)', async () => {
    const sample: AirportInfoLight = { icao: 'EPWA', iata: 'WAW', name: 'Warsaw' };
    mockedGet.mockResolvedValueOnce({ data: sample });

    const res = await client.getAirportInfoLight('EPWA');
    expect(res).toEqual(sample);
  });

  it('handles single object responses (airport full)', async () => {
    const sample: AirportFullInfo = {
      icao: 'EPWA', iata: 'WAW', name: 'Warsaw', lon: 21.0, lat: 52.0, elevation: 100,
      country: { code: 'PL', name: 'Poland' }, city: 'Warsaw', state: null, timezone: { name: 'Europe/Warsaw', offset: 60 }
    };
    mockedGet.mockResolvedValueOnce({ data: sample });

    const res = await client.getAirportInfoFull('EPWA');
    expect(res).toEqual(sample);
  });

  it('handles single object or array responses (flight tracks)', async () => {
    const sample: FlightTracksResponse[] = [
      { fr24_id: 'id3', tracks: [] }
    ];
    mockedGet.mockResolvedValueOnce({ data: sample });

    const res = await client.getFlightTracks({ flight_id: 'id3' });
    expect(res).toEqual(sample);
  });

  it('maps endpoints correctly for historic flight events', async () => {
    const fullSample: HistoricFlightEventsFull[] = [{ fr24_id: 'X', callsign: 'X', hex: 'hex', operating_as: 'op', painted_as: 'pa', orig_iata: 'AAA', orig_icao: 'AAAA', dest_iata: 'BBB', dest_icao: 'BBBB', events: [] }];
    mockedGet.mockResolvedValueOnce({ data: { data: fullSample } });
    await client.getHistoricFlightEventsFull({ flight_ids: '1,2', event_types: 'all' });
    expect(mockedGet.mock.calls[0][0]).toBe('https://fr24api.flightradar24.com/api/historic/flight-events/full');

    const lightSample: HistoricFlightEventsLight[] = [{ fr24_id: 'Y', callsign: 'Y', hex: 'hex2', events: [] }];
    mockedGet.mockResolvedValueOnce({ data: { data: lightSample } });
    await client.getHistoricFlightEventsLight({ flight_ids: '3', event_types: 'takeoff' });
    expect(mockedGet.mock.calls[1][0]).toBe('https://fr24api.flightradar24.com/api/historic/flight-events/light');
  });

  it('builds correct static data endpoints (airlines, airports)', async () => {
    mockedGet.mockResolvedValue({ data: {} });

    await client.getAirlineInfo('RYR');
    expect(mockedGet.mock.calls[0][0]).toBe('https://fr24api.flightradar24.com/api/static/airlines/RYR/light');

    await client.getAirportInfoLight('EPWA');
    expect(mockedGet.mock.calls[1][0]).toBe('https://fr24api.flightradar24.com/api/static/airports/EPWA/light');

    await client.getAirportInfoFull('EPWA');
    // Expect no stray spaces in the URL
    expect(mockedGet.mock.calls[2][0]).toBe('https://fr24api.flightradar24.com/api/static/airports/EPWA/full');
  });

  it('wraps AxiosError with endpoint info', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network down'));
    await expect(client.getLivePositionsLight({})).rejects.toThrowError(/Failed request to \/live\/flight-positions\/light: Network down/);
  });

  it('wraps unknown errors with generic message', async () => {
    mockedGet.mockRejectedValueOnce(new Error('boom'));
    await expect(client.getLivePositionsFull({})).rejects.toThrowError(/Failed request to \/live\/flight-positions\/full: Unknown error/);
  });
});



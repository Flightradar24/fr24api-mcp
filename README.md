# Flightradar24 MCP Server

[![npm version](https://badge.fury.io/js/@flightradar24%2Ffr24api-mcp.svg)](https://badge.fury.io/js/@flightradar24%2Ffr24api-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server provides access to the Flightradar24 API for real-time and historical flight data. This server enables AI assistants like Claude to access comprehensive aviation data including live flight positions, aircraft information, airport details, and flight histories.

## Features

- **Real-time Flight Tracking**: Get live positions of aircraft worldwide
- **Historical Flight Data**: Access flight data dating back to May 11, 2016
- **Comprehensive Flight Information**: Detailed aircraft, airline, and airport data
- **Flexible Filtering**: Search by callsigns, registrations, routes, aircraft types, and more
- **Flight Summaries**: Complete takeoff and landing information
- **Aircraft Tracks**: Detailed positional tracking for specific flights

## Installation

### Via npm

```bash
npm install -g @flightradar24/fr24api-mcp
```

## Prerequisites

1. **Node.js**: Version 18.0.0 or higher
2. **Flightradar24 API Key**: Get your API key from [https://fr24api.flightradar24.com](https://fr24api.flightradar24.com)

## Configuration

### Claude Desktop Integration

Add this configuration to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "fr24api": {
      "command": "npx",
      "args": ["@flightradar24/fr24api-mcp@latest"],
      "env": {
        "FR24_API_KEY": "your_api_key_here"
      }
    }
  }
}

```

**Important Notes:**
- Replace `your_api_key_here` with your actual Flightradar24 API key
- Restart Claude Desktop after adding the configuration
- If installed locally, use the full path: `"command": "node", "args": ["/path/to/build/index.js"]`

### Other MCP Clients

For other MCP clients, run the server directly:

```bash
FR24_API_KEY=your_api_key_here npx @flightradar24/fr24api-mcp
```

## Available Tools

### Live Flight Data

#### `get_live_flights_positions_light`
Get real-time aircraft positions with basic information.

**Parameters** (at least one required):
- `bounds`: Geographic area (north,south,west,east coordinates)
- `flights`: Flight numbers (comma-separated, max 15)
- `callsigns`: Flight callsigns (comma-separated, max 15)
- `registrations`: Aircraft registrations (comma-separated, max 15)
- `airports`: Airport codes with optional direction (e.g., "inbound:JFK,outbound:LAX")
- `routes`: Flight routes (e.g., "JFK-LAX,LHR-CDG")
- `aircraft`: Aircraft ICAO types (comma-separated, max 15)
- `altitude_ranges`: Altitude ranges in feet (e.g., "0-3000,30000-40000")
- `categories`: Flight categories (P,C,M,J,T,H,B,G,D,V,O,N)
- `limit`: Maximum results (default: no limit, max: 30000)

#### `get_live_flights_positions_full`
Get real-time aircraft positions with comprehensive flight details.
*Same parameters as above*

#### `get_live_flights_count`
Get count of live flights matching criteria.
*Same parameters as above*

### Historical Flight Data

#### `get_historic_flights_positions_full`
Get historical flight positions with full details.

**Required Parameters:**
- `timestamp`: Unix timestamp for historical snapshot

**Optional Parameters:**
*Same as live flight parameters*

#### `get_historic_flights_positions_light`
Get historical flight positions with basic information.
*Same parameters as above*

#### `get_historic_flights_count`
Get count of historical flights.
*Same parameters as above*

### Flight Summaries

#### `get_flight_summary_full`
Get comprehensive flight takeoff/landing information.

**Required Parameters:**
- `flight_datetime_from`: Start datetime (YYYY-MM-DDTHH:MM:SSZ)
- `flight_datetime_to`: End datetime (YYYY-MM-DDTHH:MM:SSZ)

**Optional Parameters:**
- `flights`, `callsigns`, `registrations`, `airports`, `routes`, `aircraft`
- `sort`: Sort order ("asc" or "desc")
- `limit`: Maximum results (max: 20000)

#### `get_flight_summary_light`
Get essential flight takeoff/landing information.
*Same parameters as above*

#### `get_flight_summary_count`
Get count of flights in summary query.
*Same parameters as above (without sort/limit)*

### Specific Flight Data

#### `get_flight_tracks`
Get detailed positional tracks for a specific flight.

**Required Parameters:**
- `flight_id`: Flightradar24 flight ID (hexadecimal)

### Reference Data

#### `get_airline_info`
Get airline information by ICAO code.

**Required Parameters:**
- `icao`: Airline ICAO code

#### `get_airport_info_light`
Get basic airport information.

**Required Parameters:**
- `code`: Airport IATA or ICAO code

#### `get_airport_info_full`
Get comprehensive airport information including location, elevation, timezone.

**Required Parameters:**
- `code`: Airport IATA or ICAO code

## Usage Examples

### Find flights around New York
```
Get live flights in the New York area with bounds: 41.0,-74.5,40.5,-73.5
```

### Track specific flight
```
Get flight tracks for flight ID: 2f4a8b3c
```

### Historical data
```
Get historical flights at JFK airport on timestamp 1640995200 with airports: inbound:JFK
```

### Flight summary
```
Get flight summary from 2024-01-01T00:00:00Z to 2024-01-02T00:00:00Z for route JFK-LAX
```

## Development

### Building from Source

```bash
git clone https://github.com/flightradar24/fr24api-mcp.git
cd fr24api-mcp
npm install
npm run build
```


### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

- **Documentation**: [https://fr24api.flightradar24.com](https://fr24api.flightradar24.com)
- **Issues**: [GitHub Issues](https://github.com/Flightradar24/fr24api-mcp/issues)
- **API Support**: Contact Flightradar24 API support

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0
- Initial public release
- Comprehensive flight data access
- Real-time and historical data support
- Enhanced parameter validation
- Improved error handling 
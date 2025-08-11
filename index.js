#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types";
import { FR24Client } from "./src/fr24-client";
// Environment variable for API key
const apiKey = process.env.FR24_API_KEY || "";
if (!apiKey) {
    console.error("FR24_API_KEY environment variable is required");
    process.exit(1);
}
const fr24Client = new FR24Client(apiKey);
// Define the available tools
const GET_LIVE_POSITIONS = {
    name: "get_live_positions",
    description: "Get real-time positions of flights based on various filters",
    parameters: {
        type: "object",
        properties: {
            bounds: { type: "string", description: "Geographic bounds in format: min_lat,min_lon,max_lat,max_lon" },
            flights: { type: "string", description: "List of flight IDs, comma separated" },
            callsigns: { type: "string", description: "List of callsigns, comma separated" },
            registrations: { type: "string", description: "List of aircraft registrations, comma separated" },
            airports: { type: "string", description: "List of airport codes, comma separated" },
            routes: { type: "string", description: "List of routes (origin-destination), comma separated" },
            aircraft: { type: "string", description: "List of aircraft types, comma separated" },
            altitude_ranges: { type: "string", description: "Altitude ranges, comma separated" },
            categories: { type: "string", description: "Aircraft categories, comma separated" },
            limit: { type: "integer", description: "Maximum number of results to return" }
        },
        required: []
    }
};
const GET_AIRLINE_INFO = {
    name: "get_airline_info",
    description: "Get information about an airline by ICAO code",
    parameters: {
        type: "object",
        properties: {
            icao: { type: "string", description: "ICAO code of the airline" }
        },
        required: ["icao"]
    }
};
const GET_AIRPORT_INFO = {
    name: "get_airport_info",
    description: "Get information about an airport by code",
    parameters: {
        type: "object",
        properties: {
            code: { type: "string", description: "Airport code (IATA or ICAO)" }
        },
        required: ["code"]
    }
};
const tools = [GET_LIVE_POSITIONS, GET_AIRLINE_INFO, GET_AIRPORT_INFO];
const server = new Server({
    name: "mcp-server/fr24api",
    version: "0.6.2",
}, {
    capabilities: {
        description: "An MCP server providing access to the Flightradar24 API",
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error("No parameters provided");
        }
        if (name === "get_live_positions") {
            const params = args;
            const flights = await fr24Client.getLivePositions(params);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(flights, null, 2),
                    },
                ],
                isError: false,
            };
        }
        if (name === "get_airline_info") {
            const { icao } = args;
            if (!icao) {
                return {
                    content: [{ type: "text", text: "ICAO code is required" }],
                    isError: true,
                };
            }
            const airlineInfo = await fr24Client.getAirlineInfo(icao);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(airlineInfo, null, 2),
                    },
                ],
                isError: false,
            };
        }
        if (name === "get_airport_info") {
            const { code } = args;
            if (!code) {
                return {
                    content: [{ type: "text", text: "Airport code is required" }],
                    isError: true,
                };
            }
            const airportInfo = await fr24Client.getAirportInfo(code);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(airportInfo, null, 2),
                    },
                ],
                isError: false,
            };
        }
        return {
            content: [{ type: "text", text: `Error: Unknown tool ${name}` }],
            isError: true,
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
async function runServer() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.log("FR24 MCP Server started");
    }
    catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}
runServer().catch((error) => {
    console.error("Server encountered a critical error:", error);
    process.exit(1);
});

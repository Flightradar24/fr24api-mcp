#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FR24Client } from './src/fr24-client.js';
import { createServer } from './src/server.js';

// Environment variable for API key
const apiKey = process.env.FR24_API_KEY || "";
if (!apiKey) {
  console.error("FR24_API_KEY environment variable is required");
  process.exit(1);
}

const server = createServer(apiKey);

async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error("Server encountered a critical error:", error);
  process.exit(1);
});
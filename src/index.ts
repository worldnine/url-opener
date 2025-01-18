#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import open from "open";

/**
 * Validates if the given string is a valid URL
 * @param url The URL to validate
 * @returns true if valid, false otherwise
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes the URL by adding https:// if no scheme is present
 * @param url The URL to normalize
 * @returns The normalized URL
 */
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

// Create server instance
const server = new Server(
  {
    name: "url-opener",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "open_url",
      description: "Opens a URL in the default browser. If no scheme (http:// or https://) is provided, https:// will be used.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL to open in browser",
          },
        },
        required: ["url"],
      },
    },
  ],
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "open_url") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments;
  if (!args || typeof args.url !== "string") {
    throw new Error("URL is required and must be a string");
  }

  const normalizedUrl = normalizeUrl(args.url);
  
  if (!isValidUrl(normalizedUrl)) {
    throw new Error(`Invalid URL format: ${args.url}`);
  }

  try {
    await open(normalizedUrl);
    return {
      content: [
        {
          type: "text",
          text: `Successfully opened URL: ${normalizedUrl}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error opening URL: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport).catch(error => {
  console.error('Server connection error:', error);
  process.exit(1);
});
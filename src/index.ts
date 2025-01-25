#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import open from "open";
import { URL } from 'url';

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
 * Validates and normalizes the URL
 * @param url The URL to validate and normalize
 * @returns The normalized URL
 * @throws Error if the URL is invalid or potentially dangerous
 */
function normalizeUrl(url: string): string {
  try {
    // Basic validation
    if (!url) {
      throw new Error('URL cannot be empty');
    }

    // Add https:// if no scheme is present
    const normalizedUrl = (!url.startsWith('http://') && !url.startsWith('https://'))
      ? `https://${url}`
      : url;

    // Validate URL format
    const urlObject = new URL(normalizedUrl);

    // Security checks
    const blockedProtocols = ['file:', 'ftp:', 'data:'];
    if (blockedProtocols.includes(urlObject.protocol)) {
      throw new Error(`Protocol ${urlObject.protocol} is not allowed`);
    }

    return normalizedUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
    throw error;
  }
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
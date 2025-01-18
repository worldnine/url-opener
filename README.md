# URL Opener MCP Server

A simple MCP Server that provides functionality for opening URLs in the default browser.

## Features

* Opens URLs in the system's default browser


## Tool

1. `open_url`
   * Opens a URL in the default browser
   * Inputs:
     * `url` (string): URL to open in browser
   * Returns: Success or error message
   * Note: If no scheme (http:// or https://) is provided, https:// will be used

## Setup

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "url-opener": {
      "command": "npx",
      "args": [
        "-y",
        "@"
      ]
    }
  }
}
```

```json
{
  "mcpServers": {
    "url-opener": {
      "command": "node",
      "args": [
        "/path/to/build/index.js"
      ]
    }
  }
}
```

## Build

```bash
npm install
npm run build
```

## License

This MCP server is licensed under the MIT License. See the LICENSE file for details.
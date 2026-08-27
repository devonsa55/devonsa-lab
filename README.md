# MCP Multi-Surface Demo

> **One MCP tool call. Two native renders.**

This demo demonstrates a core architectural capability of the **Model Context Protocol (MCP)**: generating a single structured JSON payload from an MCP server tool and rendering it natively across two completely distinct surface designs (**Google Merchant Center** and **Google Ads**).

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│   - Merchant ID & Focus Area inputs                         │
│   - MerchantCenterCard (Surface 1)                          │
│   - AdsBanner (Surface 2)                                   │
│   - Raw MCP JSON Inspector                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP POST /api/call-tool
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Next.js Server-Side MCP Client                  │
│               app/api/call-tool/route.ts                    │
│   - Uses @modelcontextprotocol/client                       │
│   - StreamableHTTPClientTransport                           │
│   - Calls tools/call 'get_merchant_insight'                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Streamable HTTP (MCP Protocol)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   MCP Protocol Server                       │
│                   app/api/mcp/route.ts                      │
│   - Uses mcp-handler v2 (createMcpHandler)                  │
│   - Exposes tool: get_merchant_insight                      │
│   - Generates constrained Smart Snippets via Gemini Flash   │
│   - Validates JSON output against Zod schema                │
└─────────────────────────────────────────────────────────────┘
```

### Why the MCP Client Lives Server-Side

1. **Protocol Authenticity:** MCP clients are designed to run in secure execution environments (like agent runtimes, IDEs, or server backends). Having a server-side MCP client connect over `StreamableHTTPClientTransport` to the `/api/mcp` route means this app executes a genuine, standard MCP protocol exchange.
2. **Security & Secrets:** Model API keys (such as `GEMINI_API_KEY`) and MCP transport credentials remain secure on the server and are never leaked to the browser.
3. **Stateless Efficiency:** Under MCP v2 / 2026 spec, Streamable HTTP transport is stateless and does not require persistent Redis or session databases, making it deployable on serverless environments like Vercel.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js 20+** (`node -v`)
- A **Google AI Studio API Key** (or Gemini API Key) from [aistudio.google.com](https://aistudio.google.com/)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY="your_google_ai_studio_api_key_here"
```

*(Note: The app also includes deterministic fallback fixtures if you test without an API key).*

### 3. Install Dependencies & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 MCP Server & Tool Specification

### MCP Endpoint: `/api/mcp`
- **Transport:** Streamable HTTP Transport (`mcp-handler` v2)
- **Tool Name:** `get_merchant_insight`
- **Input Schema:**
  ```json
  {
    "merchant_id": "string",
    "focus_area": "inventory | pricing | trend"
  }
  ```
- **Output Schema:**
  ```json
  {
    "headline": "string",
    "detail": "string",
    "metric": {
      "label": "string",
      "value": "string",
      "trend": "up | down | flat"
    },
    "chart": [number, number, number, number, number],
    "action": "string"
  }
  ```

---

## 🌐 Deploying to Vercel

1. **Push your code to GitHub / GitLab / Bitbucket**.
2. **Import the repository into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select this repository.
3. **Configure Environment Variables**:
   - Add `GEMINI_API_KEY` with your Google AI Studio API key.
4. **Confirm Node.js Version**:
   - In **Project Settings ➔ General ➔ Node.js Version**, ensure **20.x** or **22.x** is selected.
5. **Deploy**:
   - Click **Deploy**. Vercel will automatically build and deploy the Next.js App Router project and serverless MCP endpoints.

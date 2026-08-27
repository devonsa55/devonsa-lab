import { NextRequest, NextResponse } from "next/server";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { z } from "zod";

export const runtime = "nodejs";

const CallToolRequestSchema = z.object({
  merchant_id: z
    .string({ message: "merchant_id must be a string" })
    .min(1, "merchant_id cannot be empty"),
  focus_area: z.enum(["inventory", "pricing", "trend"], {
    message: "focus_area must be one of: 'inventory', 'pricing', 'trend'",
  }),
  query: z.string().optional(),
  category: z.string().optional(),
  scenario: z.string().optional(),
  time_horizon: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let client: Client | null = null;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body in request" },
        { status: 400 }
      );
    }

    const validationResult = CallToolRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const message = firstIssue?.message || "Invalid request parameters";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const toolArgs = validationResult.data;

    // Dynamically determine origin, handling Vercel reverse proxy headers and localhost IPv4/IPv6
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedHost = req.headers.get("x-forwarded-host");
    let origin = req.nextUrl.origin;

    if (forwardedProto && forwardedHost) {
      origin = `${forwardedProto}://${forwardedHost}`;
    } else if (origin.includes("localhost")) {
      origin = origin.replace("localhost", "127.0.0.1");
    }

    const mcpUrl = new URL("/api/mcp", origin);

    // Build headers to forward (preserves Vercel Deployment Protection auth/cookies on internal fetches)
    const forwardHeaders: Record<string, string> = {};
    const cookie = req.headers.get("cookie");
    if (cookie) forwardHeaders["cookie"] = cookie;

    const bypass = req.headers.get("x-vercel-protection-bypass");
    if (bypass) forwardHeaders["x-vercel-protection-bypass"] = bypass;

    const auth = req.headers.get("authorization");
    if (auth) forwardHeaders["authorization"] = auth;

    const vercelSc = req.headers.get("x-vercel-sc-headers");
    if (vercelSc) forwardHeaders["x-vercel-sc-headers"] = vercelSc;

    // Build the wire-level MCP JSON-RPC request object
    const mcpWireRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "get_merchant_insight",
        arguments: toolArgs,
      },
    };

    // Initialize MCP Client and Streamable HTTP Transport with forwarded authentication
    const transport = new StreamableHTTPClientTransport(mcpUrl, {
      requestInit: {
        headers: forwardHeaders,
      },
    });
    client = new Client(
      { name: "call-tool-client", version: "1.0.0" },
      { capabilities: {} }
    );

    // Connect to MCP endpoint
    await client.connect(transport);

    // Call get_merchant_insight tool with rich dynamic arguments
    const result = await client.callTool({
      name: "get_merchant_insight",
      arguments: toolArgs,
    });

    if (result.isError) {
      let errorMessage = "Tool execution failed";
      if (Array.isArray(result.content) && result.content.length > 0) {
        const firstContent = result.content[0];
        if (firstContent && firstContent.type === "text" && typeof firstContent.text === "string") {
          try {
            const parsed = JSON.parse(firstContent.text);
            errorMessage = parsed.error || firstContent.text;
          } catch {
            errorMessage = firstContent.text;
          }
        }
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Extract structured insight JSON object
    let insight = result.structuredContent;

    if (!insight && Array.isArray(result.content) && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent && firstContent.type === "text" && typeof firstContent.text === "string") {
        try {
          insight = JSON.parse(firstContent.text);
        } catch {
          return NextResponse.json(
            { error: "Failed to parse tool output text as JSON" },
            { status: 500 }
          );
        }
      }
    }

    if (!insight) {
      return NextResponse.json(
        { error: "No insight returned from MCP tool" },
        { status: 500 }
      );
    }

    // Build the wire-level MCP JSON-RPC response object
    const mcpWireResponse = {
      jsonrpc: "2.0",
      id: 1,
      result: {
        content: result.content,
        structuredContent: insight,
      },
    };

    return NextResponse.json(
      {
        insight,
        _mcp: {
          endpoint: mcpUrl.toString(),
          request: mcpWireRequest,
          response: mcpWireResponse,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.warn("Error closing MCP client:", closeError);
      }
    }
  }
}

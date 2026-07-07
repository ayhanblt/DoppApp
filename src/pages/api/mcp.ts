import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { setupMcpServer } from "@/app/api/mcp/mcpServer";
import type { NextApiRequest, NextApiResponse } from 'next';

const activeConnections = new Map<string, { transport: SSEServerTransport }>();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const server = setupMcpServer();
    const transport = new SSEServerTransport('/api/mcp', res);
    
    await server.connect(transport);
    
    activeConnections.set(transport.sessionId, { transport });

    res.flushHeaders();

    res.on('close', () => {
      activeConnections.delete(transport.sessionId);
    });
    
    return new Promise(() => {}); // SSE stream must stay alive
  } else if (req.method === 'POST') {
    const sessionId = req.query.sessionId as string;
    
    const connection = activeConnections.get(sessionId);
    if (!connection) {
      res.status(400).json({ error: "SSE connection not established or session expired." });
      return;
    }

    await connection.transport.handlePostMessage(req, res);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;

  return Response.json(
    {
      resource: `${origin}`,
      authorization_servers: [`${origin}`],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, mcp-protocol-version",
      },
    },
  );
}

/**
 * Simple MCP client test script
 *
 * This script tests the MCP server by making HTTP requests to the API endpoints
 * and then testing the MCP tools functionality.
 *
 * Usage:
 * 1. Start your Next.js server: pnpm dev
 * 2. Create an API key in the web interface
 * 3. Run: node test-mcp-client.js YOUR_API_KEY
 */

const API_KEY = process.argv[2];
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!API_KEY) {
  console.error("Usage: node test-mcp-client.js YOUR_API_KEY");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

async function testApiEndpoints() {
  console.log("🧪 Testing API endpoints...\n");

  const testDate = "2024-01-15";

  try {
    // Test task creation
    console.log("1. Creating a test task...");
    const createResponse = await fetch(`${BASE_URL}/api/mcp/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        date: testDate,
        title: "MCP Test Task",
        description: "A task created via MCP API test",
        quadrant: "urgent-important",
        priority: 1,
        tags: ["test", "mcp"],
      }),
    });

    if (createResponse.ok) {
      const task = await createResponse.json();
      console.log("✅ Task created:", task.task.title);
    } else {
      console.log("❌ Failed to create task:", createResponse.status);
      const error = await createResponse.text();
      console.log("Error:", error);
    }

    // Test task listing
    console.log("\n2. Listing tasks...");
    const listResponse = await fetch(
      `${BASE_URL}/api/mcp/tasks?date=${testDate}`,
      {
        headers,
      },
    );

    if (listResponse.ok) {
      const data = await listResponse.json();
      console.log(`✅ Found ${data.tasks.length} tasks for ${testDate}`);
      data.tasks.forEach((task, i) => {
        console.log(`   ${i + 1}. ${task.title} (${task.quadrant})`);
      });
    } else {
      console.log("❌ Failed to list tasks:", listResponse.status);
    }

    // Test planner access
    console.log("\n3. Accessing planner...");
    const plannerResponse = await fetch(
      `${BASE_URL}/api/mcp/planners?date=${testDate}`,
      {
        headers,
      },
    );

    if (plannerResponse.ok) {
      const data = await plannerResponse.json();
      console.log(`✅ Planner data retrieved for ${testDate}`);
      console.log(`   Found ${data.planners.length} planner(s)`);
    } else {
      console.log("❌ Failed to get planner:", plannerResponse.status);
    }
  } catch (error) {
    console.error("❌ API test failed:", error.message);
  }
}

async function testMcpTools() {
  console.log("\n🔧 Testing MCP tools...\n");

  try {
    // Test list-tasks tool
    console.log("1. Testing list-tasks tool...");
    const listToolResponse = await fetch(`${BASE_URL}/api/mcp`, {
      method: "POST",
      headers: {
        ...headers,
        "mcp-session-id": "test-session-" + Date.now(),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "list-tasks",
          arguments: {
            date: "2024-01-15",
          },
          meta: {
            userId: "test-user",
            apiKey: API_KEY,
          },
        },
      }),
    });

    if (listToolResponse.ok) {
      const result = await listToolResponse.json();
      console.log("✅ list-tasks tool response:", result);
    } else {
      console.log("❌ list-tasks tool failed:", listToolResponse.status);
      const error = await listToolResponse.text();
      console.log("Error:", error);
    }

    // Test create-task tool
    console.log("\n2. Testing create-task tool...");
    const createToolResponse = await fetch(`${BASE_URL}/api/mcp`, {
      method: "POST",
      headers: {
        ...headers,
        "mcp-session-id": "test-session-" + Date.now(),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "create-task",
          arguments: {
            date: "2024-01-15",
            title: "MCP Tool Test Task",
            description: "Created via MCP tool test",
            quadrant: "not-urgent-important",
            difficulty: "easy",
            tags: ["mcp-tool", "test"],
          },
          meta: {
            userId: "test-user",
            apiKey: API_KEY,
          },
        },
      }),
    });

    if (createToolResponse.ok) {
      const result = await createToolResponse.json();
      console.log("✅ create-task tool response:", result);
    } else {
      console.log("❌ create-task tool failed:", createToolResponse.status);
      const error = await createToolResponse.text();
      console.log("Error:", error);
    }
  } catch (error) {
    console.error("❌ MCP tool test failed:", error.message);
  }
}

async function testMcpCapabilities() {
  console.log("\n🔍 Testing MCP server capabilities...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/mcp`, {
      method: "POST",
      headers: {
        ...headers,
        "mcp-session-id": "test-session-" + Date.now(),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: {
            name: "test-client",
            version: "1.0.0",
          },
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ MCP server initialized:", result);
    } else {
      console.log("❌ MCP initialization failed:", response.status);
    }

    // Test tools listing
    const toolsResponse = await fetch(`${BASE_URL}/api/mcp`, {
      method: "POST",
      headers: {
        ...headers,
        "mcp-session-id": "test-session-" + Date.now(),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    });

    if (toolsResponse.ok) {
      const result = await toolsResponse.json();
      console.log(
        "✅ Available tools:",
        result.result?.tools?.map((t) => t.name),
      );
    } else {
      console.log("❌ Tools listing failed:", toolsResponse.status);
    }
  } catch (error) {
    console.error("❌ MCP capabilities test failed:", error.message);
  }
}

async function runTests() {
  console.log(`🚀 Testing MCP Server at ${BASE_URL}\n`);
  console.log(`🔑 Using API Key: ${API_KEY.substring(0, 12)}***\n`);

  await testApiEndpoints();
  await testMcpTools();
  await testMcpCapabilities();

  console.log("\n✨ Testing complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Configure your MCP client with the server URL");
  console.log("2. Add your API key to the client configuration");
  console.log("3. Start using the task planner tools in your AI assistant!");
}

runTests().catch(console.error);

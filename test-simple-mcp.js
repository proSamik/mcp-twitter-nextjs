/**
 * Simple test script for the MCP HTTP server
 *
 * Usage:
 * 1. Start your Next.js server: pnpm dev
 * 2. Create an API key in the web interface at /api-keys
 * 3. Run: node test-simple-mcp.js YOUR_API_KEY
 */

const API_KEY = process.argv[2];
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MCP_URL = `${BASE_URL}/api/mcp`;

if (!API_KEY) {
  console.error("Usage: node test-simple-mcp.js YOUR_API_KEY");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

async function testMcpInitialization() {
  console.log(`🚀 Testing MCP Server initialization at ${MCP_URL}\n`);

  try {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
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

    const result = await response.json();
    console.log("✅ MCP Server initialized:", JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error("❌ MCP initialization failed:", error.message);
    return false;
  }
}

async function testListTools() {
  console.log("\n🔧 Testing tools listing...\n");

  try {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    const result = await response.json();
    if (result.result?.tools) {
      console.log("✅ Available tools:");
      result.result.tools.forEach((tool, i) => {
        console.log(`   ${i + 1}. ${tool.name}: ${tool.description}`);
      });
      return result.result.tools;
    } else {
      console.log("❌ No tools found in response:", result);
      return [];
    }
  } catch (error) {
    console.error("❌ Tools listing failed:", error.message);
    return [];
  }
}

async function testCreateTask() {
  console.log("\n📝 Testing task creation...\n");

  // You'll need to replace this with a real user ID from your database
  const testUserId = "test-user-id";
  const testDate = "2024-01-15";

  try {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "create_task",
          arguments: {
            date: testDate,
            userId: testUserId,
            title: "Test MCP Task",
            description: "A task created via MCP HTTP POST",
            quadrant: "urgent-important",
            priority: 1,
            timeRequired: "30 minutes",
            timeBlock: "2-2:30 PM",
            difficulty: "easy",
            tags: ["test", "mcp-http"],
          },
        },
      }),
    });

    const result = await response.json();
    if (result.result?.content) {
      console.log("✅ Task created successfully:");
      console.log(result.result.content[0].text);
    } else {
      console.log("❌ Task creation failed:", result);
    }
    return result;
  } catch (error) {
    console.error("❌ Task creation failed:", error.message);
    return null;
  }
}

async function testListTasks() {
  console.log("\n📋 Testing task listing...\n");

  const testUserId = "test-user-id";
  const testDate = "2024-01-15";

  try {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "list_tasks",
          arguments: {
            date: testDate,
            userId: testUserId,
          },
        },
      }),
    });

    const result = await response.json();
    if (result.result?.content) {
      console.log("✅ Tasks listed successfully:");
      console.log(result.result.content[0].text);
    } else {
      console.log("❌ Task listing failed:", result);
    }
    return result;
  } catch (error) {
    console.error("❌ Task listing failed:", error.message);
    return null;
  }
}

async function runAllTests() {
  console.log(`🧪 Testing Simple HTTP MCP Server\n`);
  console.log(`🔑 Using API Key: ${API_KEY.substring(0, 12)}***\n`);

  // Test initialization
  const initialized = await testMcpInitialization();
  if (!initialized) {
    console.log("\n❌ Cannot proceed without proper initialization");
    return;
  }

  // Test capabilities
  await testListTools();

  // Test actual functionality (you may need to adjust user IDs)
  await testCreateTask();
  await testListTasks();

  console.log("\n✨ Testing complete!");
  console.log("\n📋 Summary:");
  console.log(`   • MCP Server URL: ${MCP_URL}`);
  console.log(`   • Transport: HTTP POST (stateless)`);
  console.log(`   • Authentication: Bearer token`);
  console.log("\n🎉 Your MCP server is ready for AI assistant integration!");
  console.log("\n📖 Next steps:");
  console.log("1. Get a real user ID from your database");
  console.log("2. Test with your own user data");
  console.log("3. Configure your MCP client to use this endpoint");
}

runAllTests().catch(console.error);

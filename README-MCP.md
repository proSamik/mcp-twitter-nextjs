# Task Planner MCP Server

This project includes a Model Context Protocol (MCP) server built with the **Vercel MCP Adapter** that allows AI assistants to interact with your task planner data using API keys for authentication.

## Features

- **Vercel MCP Adapter**: Modern, production-ready MCP implementation
- **API Key Authentication**: Generate up to 5 API keys per user with customizable permissions
- **Task Management**: Create, read, update tasks via MCP tools
- **Planner Resources**: Access daily planner summaries as MCP resources
- **AI Prompts**: Built-in prompts for day planning and task organization
- **Permission Control**: Fine-grained permissions (read, create, update, delete)
- **Dual Transport**: Support for both Streamable HTTP and SSE transports
- **PostgreSQL Backend**: Uses PostgreSQL for session and data storage (no Redis required)

## API Key Management

### Creating API Keys

1. Navigate to `/api-keys` in your dashboard
2. Click "Create API Key"
3. Set a name and configure permissions:
   - **Read**: View tasks and planners
   - **Create**: Create new tasks and planners
   - **Update**: Modify existing tasks
   - **Delete**: Delete tasks (use with caution)
4. Copy the generated key immediately (it won't be shown again)

### Managing API Keys

- **Revoke**: Deactivate a key permanently
- **Update Permissions**: Change what a key can access
- **Monitor Usage**: See when keys were last used

## MCP Server Configuration

The MCP server is available at two endpoints:
- **Streamable HTTP**: `https://your-domain.com/api/mcp-v2/streamable` (recommended)
- **SSE**: `https://your-domain.com/api/mcp-v2/sse` (for legacy clients)

### For Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "task-planner": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "env": {
        "MCP_SERVER_URL": "https://your-domain.com/api/mcp-v2/streamable"
      }
    }
  }
}
```

### For Other MCP Clients

#### Streamable HTTP (Recommended)
- **URL**: `https://your-domain.com/api/mcp-v2/streamable`
- **Authentication**: Bearer token with your API key
- **Transport**: Streamable HTTP

#### SSE (Legacy Support)
- **URL**: `https://your-domain.com/api/mcp-v2/sse`
- **Authentication**: Bearer token with your API key
- **Transport**: Server-Sent Events

## Available Tools

### 1. list_tasks
List all tasks for a specific date.

**Parameters:**
- `date` (string): Date in YYYY-MM-DD format

**Example:**
```json
{
  "name": "list_tasks",
  "arguments": {
    "date": "2024-01-15"
  }
}
```

### 2. create_task
Create a new task for a specific date.

**Parameters:**
- `date` (string): Date in YYYY-MM-DD format
- `title` (string): Task title
- `description` (string, optional): Task description
- `quadrant` (enum): One of:
  - `urgent-important`
  - `urgent-not-important`
  - `not-urgent-important`
  - `not-urgent-not-important`
- `priority` (number, optional): Priority order within quadrant (default: 0)
- `timeRequired` (string, optional): Estimated time (e.g., "2 hours")
- `timeBlock` (string, optional): Planned time (e.g., "3-5 PM")
- `difficulty` (enum, optional): "easy", "medium", or "hard"
- `tags` (array, optional): Array of tag strings

**Example:**
```json
{
  "name": "create_task",
  "arguments": {
    "date": "2024-01-15",
    "title": "Review project proposal",
    "description": "Review and provide feedback on Q1 project proposal",
    "quadrant": "urgent-important",
    "priority": 1,
    "timeRequired": "1 hour",
    "timeBlock": "2-3 PM",
    "difficulty": "medium",
    "tags": ["work", "review"]
  }
}
```

### 3. mark_task_complete
Mark a task as completed or incomplete by finding it by title and date.

**Parameters:**
- `date` (string): Date in YYYY-MM-DD format
- `title` (string): Title of the task to mark as complete
- `completed` (boolean, optional): Whether to mark as completed (default: true)

**Example:**
```json
{
  "name": "mark_task_complete",
  "arguments": {
    "date": "2024-01-15",
    "title": "Review project proposal",
    "completed": true
  }
}
```

## Available Resources

### planner_summary
Get a summary of tasks for a specific date with statistics and breakdowns.

**URI Pattern:** `planner://summary/{date}`

**Example:** `planner://summary/2024-01-15`

Returns JSON with:
- Total tasks and completion counts
- Tasks breakdown by quadrant
- Tasks breakdown by difficulty level

## Available Prompts

### plan_day
Generate a structured plan for a specific day using the Eisenhower Matrix.

**Parameters:**
- `date` (string): Date to plan in YYYY-MM-DD format
- `focus` (string, optional): Main focus or theme for the day

**Example:**
```json
{
  "name": "plan_day",
  "arguments": {
    "date": "2024-01-16",
    "focus": "productivity and learning"
  }
}
```

This prompt provides AI assistants with a structured template for helping users plan their day effectively using the four-quadrant system.

## Security Features

- **Bearer Token Authentication**: All requests require valid API keys
- **User Isolation**: Users can only access their own data
- **Permission Controls**: Fine-grained access control
- **Key Expiration**: Optional expiration dates for API keys
- **Usage Tracking**: Monitor when keys are used
- **No System Data Exposure**: Only user-editable fields are exposed (no internal IDs)

## Rate Limiting

- Maximum 5 API keys per user
- Standard HTTP rate limiting applies
- Consider implementing additional rate limiting for production use

## Error Handling

The MCP server returns standard JSON-RPC error responses:

- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side issues

## Development

### Testing the MCP Server

1. Create an API key in the dashboard
2. Use curl to test endpoints:

```bash
# Test task listing
curl -H "Authorization: Bearer your_api_key" \
  "https://your-domain.com/api/mcp/tasks?date=2024-01-15"

# Test task creation
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"date":"2024-01-15","title":"Test task","quadrant":"urgent-important"}' \
  https://your-domain.com/api/mcp/tasks
```

3. Test MCP tools using an MCP client or testing framework

### Environment Variables

Make sure these are set:
- `NEXT_PUBLIC_APP_URL`: Your app's public URL
- Database connection variables (see main README)

## Limitations

- Task updates via MCP don't expose internal IDs for security
- Use the web interface for complex task modifications
- Maximum 5 API keys per user
- Streamable HTTP transport only (no stdio)

## Contributing

When extending the MCP server:

1. Add new tools to `/src/app/api/mcp/route.ts`
2. Create corresponding API routes in `/src/app/api/mcp/`
3. Update this documentation
4. Add appropriate tests

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your API key is valid and active
2. **403 Forbidden**: Verify the key has required permissions
3. **Connection Failed**: Ensure the server URL is correct and accessible
4. **Tool Not Found**: Make sure you're using the correct tool names

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and logs.

### Support

For issues:
1. Check the browser console for client-side errors
2. Check server logs for API errors
3. Verify API key permissions in the dashboard
4. Test API endpoints directly before debugging MCP integration
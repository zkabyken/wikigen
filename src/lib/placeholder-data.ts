import type { WikiStructure } from "@/types";

export const PLACEHOLDER_WIKI: WikiStructure = {
  repoName: "example/repo",
  repoUrl: "https://github.com/example/repo",
  description: "A sample repository used to demonstrate the wiki layout.",
  subsystems: [
    {
      id: "user-authentication",
      name: "User Authentication",
      description:
        "Handles user sign-up, login, session management, and OAuth integrations.",
      content:
        "<p>The authentication system supports email/password and OAuth providers (GitHub, Google). Sessions are managed via JWT tokens stored in HTTP-only cookies.</p><p>The login flow validates credentials against a hashed store, issues a short-lived access token, and sets a refresh token cookie for seamless re-authentication.</p>",
      citations: [
        { file: "src/auth/login.ts", lines: [12, 45], url: "" },
        { file: "src/auth/oauth.ts", lines: [1, 30], url: "" },
      ],
      entryPoints: ["POST /api/auth/login", "POST /api/auth/register"],
    },
    {
      id: "task-management",
      name: "Task Management",
      description:
        "Core CRUD operations for creating, updating, and organizing tasks.",
      content:
        "<p>Tasks are the primary entity. Users can create tasks with a title, description, due date, and priority. Tasks belong to projects and can be assigned to team members.</p><p>The task list supports filtering by status, assignee, and priority, with pagination handled server-side.</p>",
      citations: [
        { file: "src/tasks/service.ts", lines: [20, 80], url: "" },
        { file: "src/tasks/routes.ts", lines: [5, 40], url: "" },
      ],
      entryPoints: ["GET /api/tasks", "POST /api/tasks", "PATCH /api/tasks/:id"],
    },
    {
      id: "notifications",
      name: "Real-time Notifications",
      description:
        "WebSocket-based notification system for task updates and mentions.",
      content:
        "<p>Notifications are delivered in real-time via WebSocket connections. When a task is updated or a user is mentioned, a notification event is broadcast to relevant subscribers.</p><p>Unread counts are tracked per-user and synced on reconnection.</p>",
      citations: [
        { file: "src/notifications/ws.ts", lines: [10, 55], url: "" },
        { file: "src/notifications/service.ts", lines: [1, 35], url: "" },
      ],
      entryPoints: ["WS /api/notifications", "GET /api/notifications/unread"],
    },
    {
      id: "search",
      name: "Full-text Search",
      description:
        "Search across tasks, projects, and comments with ranked results.",
      content:
        "<p>Search is powered by a full-text index over task titles, descriptions, and comments. Results are ranked by relevance and recency.</p><p>The search API supports query syntax for filtering by project, assignee, and date range.</p>",
      citations: [
        { file: "src/search/index.ts", lines: [1, 60], url: "" },
      ],
      entryPoints: ["GET /api/search"],
    },
  ],
};

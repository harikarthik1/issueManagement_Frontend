# AI Issue Management System — Frontend Client

A modern, high-performance, responsive single-page web application (SPA) for the **AI Issue Management System** built with **React 19**, **Vite 8**, **React Router v7**, **Lucide Icons**, and a bespoke **Vanilla CSS Design System**.

---

## 1. Overview & Key Capabilities

The frontend provides an intuitive, role-tailored interface designed for engineering teams, project managers, and system administrators. It seamlessly integrates with the Spring Boot AI backend to deliver:

- **Role-Adaptive Dashboards**: Custom views tailored for Employees (personal workload and urgency metrics) and Project Managers (project health, status reconciliation, unassigned issue triage, and team workloads).
- **Interactive Issue Tracking & Kanban**: Complete issue management with live filtering (status, priority, type, assignee), finite state machine (FSM) status transition buttons, markdown descriptions, comments, and immutable change logs.
- **AI-Powered Deduplication & Drafting**: Real-time semantic similarity checks against Qdrant Vector DB to prevent duplicate issues before creation, paired with Gemini-powered issue draft generation from raw prompts.
- **Conversational AI Assistant**: Full-featured chat interface with multi-turn conversational memory, markdown rendering, tool-execution visualization pills, thread management, and Redis semantic cache monitoring.
- **Governance & Administration**: Role-based access control (RBAC), user lifecycle management (creation, role assignment, activation/deactivation), and system-wide audit logging.
- **Production-Ready Architecture**: Code-split routes via `React.lazy()`, optimistic UI updates, toast notifications, error boundaries, Docker Nginx containerization, and Vercel zero-config routing.

---

## 2. Technology Stack

| Technology | Purpose | Key Details |
|---|---|---|
| **React 19** | UI Library | Modern hooks, concurrent rendering, transitions |
| **Vite 8** | Build Tool & Bundler | Instant HMR, ESM bundling, optimized production chunks |
| **React Router DOM v7** | Client-Side Routing | Route guards, nested layouts, lazy-loaded components |
| **Lucide React** | Icons | Crisp, accessible SVG icons |
| **React Markdown & Remark GFM** | Rich Text Rendering | Renders GitHub-flavored markdown in comments, issues, and AI chat |
| **Vanilla CSS** | Styling & Design System | CSS variables, responsive mobile-first grid, dark-mode ready tokens |
| **Vitest & React Testing Library** | Unit & Component Testing | Fast in-memory unit tests with DOM assertions |
| **Oxlint** | Linting | High-performance Rust-based linter |
| **Nginx & Docker** | Production Serving | Multi-stage Docker build, gzip compression, SPA history fallback |

---

## 3. Project Structure

```
frontend
├── public/                 # Static assets, favicon, icons
├── src/
│   ├── api/                # API client modules for backend communication
│   │   ├── client.js       # Centralized Fetch wrapper with JWT injection & error handling
│   │   ├── authApi.js      # Login, registration, password change
│   │   ├── userApi.js      # User CRUD, role filtering, account status toggle
│   │   ├── projectApi.js   # Projects, member management, PM assignments
│   │   ├── issueApi.js     # Issues CRUD, status transitions, history, assignment
│   │   ├── aiIssueApi.js   # Qdrant semantic deduplication search & AI issue drafting
│   │   ├── assistantApi.js # AI chat conversations, messages, session, cache metrics
│   │   ├── commentApi.js   # Issue comments CRUD
│   │   ├── dashboardApi.js # Employee and Project Manager dashboard metrics
│   │   ├── notificationsApi.js # In-app notification polling and status
│   │   └── auditApi.js     # Administrative audit logs
│   ├── assets/             # Brand logos and graphic illustrations
│   ├── components/         # Modular, reusable UI components
│   │   ├── common/         # Buttons, Modals, Badges, Loaders, ErrorBoundary
│   │   ├── layout/         # AppLayout, Navbar, Sidebar, ProtectedRoute
│   │   ├── issues/         # IssueCard, StatusBadge, PriorityBadge, KanbanColumn
│   │   ├── assistant/      # ChatBubble, ToolExecutionIndicator, PromptSuggestions
│   │   └── dashboard/      # StatCard, WorkloadTable, PriorityProgress
│   ├── context/            # React Context providers
│   │   ├── AuthContext.jsx # Authentication state, JWT parsing, role checks, logout
│   │   └── ToastContext.jsx# Toast notification system (success, error, warning, info)
│   ├── pages/              # Application route views
│   │   ├── auth/           # LoginPage, RegisterAdminPage
│   │   ├── dashboard/      # DashboardRouter, EmployeeDashboard, ProjectManagerDashboard
│   │   ├── projects/       # ProjectListPage, ProjectDetailPage
│   │   ├── issues/         # IssueListPage, IssueDetailPage, CreateIssuePage
│   │   ├── assistant/      # AssistantPage (full-page conversational AI)
│   │   ├── notifications/  # NotificationsPage
│   │   ├── profile/        # ProfilePage (user details & password change)
│   │   ├── admin/          # UserManagementPage, AuditLogsPage, CacheMetricsPage
│   │   └── NotFoundPage.jsx# 404 Fallback
│   ├── styles/             # Modular style sheets
│   ├── utils/              # Formatting helpers, role constants, date formatters
│   ├── App.jsx             # Top-level routing, Suspense boundaries, and providers
│   ├── main.jsx            # React root mount
│   └── index.css           # Global design system tokens and typography
├── .env.example            # Sample environment variables
├── Dockerfile              # Multi-stage Docker build with Nginx
├── nginx.conf              # Nginx web server configuration (SPA routing & /healthz)
├── package.json            # Scripts and dependencies
├── vercel.json             # Vercel deployment and SPA routing rules
└── vite.config.js          # Vite build configuration
```

---

## 4. Key Application Views & Features

### 4.1 Authentication & Onboarding
- **Bootstrap Administrator (`/register-admin`)**: Displays if no administrator exists yet, guiding the initial setup.
- **Login (`/login`)**: Secure authentication via email/password. Automatically redirects users based on their active role.
- **Forced Password Change**: Detects `passwordChangeRequired = true` on initial login and prompts the user to change their password before granting system access.

### 4.2 Role-Based Dashboards (`/dashboard`)
- **Employee View**:
  - Focuses on personal active tasks (`OPEN` and `IN_PROGRESS`).
  - Highlights urgent priorities (`CRITICAL` and `HIGH`).
  - Quick-action buttons to jump directly to assigned issues.
- **Project Manager View**:
  - Operational health metrics with strict total issue reconciliation.
  - Rapid triage queue for unassigned active issues.
  - Team workload distribution table showing each team member's active versus resolved issues.

### 4.3 Issue Tracker & Workflow (`/issues`, `/issues/:issueId`)
- **Filters & Search**: Multi-parameter filtering by Project, Status, Priority, Type, and Assignee.
- **FSM Transitions**: Clean status transition controls enforcing valid state changes (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`).
- **Closed Issue Reopening**: Active project members can reopen closed issues by providing a clear rationale comment.
- **Audit History**: Complete chronological timeline showing who changed what, when, and previous vs. new values.
- **Comments Thread**: Markdown-enabled discussion thread with author permissions for edits and deletions.

### 4.4 AI Deduplication & Assistant (`/assistant`, Issue Creation Modal)
- **Real-Time Duplicate Prevention**: While typing an issue description, the client calls `/api/v1/projects/:id/issues/ai/search-similar`. If similar issues are found in Qdrant, a similarity alert card displays matching issues with direct links to prevent duplicates.
- **AI Issue Drafting**: Users can input brief bullet points or raw errors and click "AI Draft" to automatically generate structured titles, priorities, and formatted markdown descriptions.
- **Conversational Assistant Page**:
  - Multi-turn conversational chat with sliding-window history.
  - Real-time tool execution indicators (e.g., *Querying project backlog...*, *Fetching issue status...*).
  - Quick prompt suggestions for fast issue triaging and workload checks.

### 4.5 Administration (`/admin/*`)
- **User Management (`/admin/users`)**: Create employees or project managers, filter by role, and activate or deactivate accounts. Deactivating an employee immediately revokes their tokens and reallocates open work.
- **Audit Logs (`/admin/audit`)**: Filter and inspect administrative security actions.
- **Cache Analytics (`/admin/cache`)**: View real-time Redis semantic cache hit rates and response latency savings.

---

## 5. Environment Configuration

Create a `.env` file in the `frontend` root based on `.env.example`:

```bash
# Backend REST API Base URL (Do NOT include a trailing slash)
# For local development with Spring Boot:
VITE_API_BASE_URL=http://localhost:8080

# For production deployment (e.g., Render backend):
# VITE_API_BASE_URL=https://issue-management-api.onrender.com
```

> **Note:** If `VITE_API_BASE_URL` is omitted in development, Vite defaults to proxying requests or targeting `http://localhost:8080`.

---

## 6. Local Development & Scripts

### Prerequisites
- **Node.js 20+** or **Node.js 22 LTS**
- **npm 10+**

### Setup & Run
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server with HMR
npm run dev
```

The application will be available at **`http://localhost:5173`**.

### Other Available Scripts
```bash
# Run unit & component test suite with Vitest
npm run test

# Run Oxlint for fast code analysis
npm run lint

# Build production bundle with minification and code splitting
npm run build

# Preview the built production dist locally
npm run preview
```

---

## 7. Production Build & Deployment

### 7.1 Docker Deployment (Nginx)
The frontend includes a multi-stage Dockerfile that builds the static assets and serves them via high-performance Nginx:

```bash
# Build Docker image
docker build -t issue-management-frontend ./frontend

# Run container on port 80 (or 3000)
docker run -p 80:80 -e VITE_API_BASE_URL=http://backend:8080 issue-management-frontend
```

#### Nginx Features in `nginx.conf`:
- **Gzip Compression**: Compresses HTML, CSS, JS, JSON, and SVG assets.
- **SPA Fallback**: Implements `try_files $uri $uri/ /index.html` to support deep client-side routes.
- **Health Check**: Responds with `200 OK` at `/healthz` for load balancers and container orchestrators.
- **Security Headers**: Includes `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.

### 7.2 Vercel Deployment
A pre-configured `vercel.json` is provided in the root of `frontend`:
1. Import the repository into **Vercel**.
2. Set the root directory to `frontend`.
3. Set the environment variable:
   - `VITE_API_BASE_URL`: URL of your deployed backend (e.g., `https://issue-management-api.onrender.com`).
4. Deploy! The rewrite rules in `vercel.json` ensure client-side routing works smoothly without 404s on page refresh.

### 7.3 Full-Stack Docker Compose
To run both backend and frontend together with all dependencies (PostgreSQL, Redis, Qdrant):
```bash
# From the repository root
docker compose up -d --build
```
- **Frontend**: `http://localhost` (or port configured in `.env`)
- **Backend API**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`

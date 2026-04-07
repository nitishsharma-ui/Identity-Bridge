# Identity Bridge Agent 🔐

![Identity Bridge Hero](file:///c:/Users/Administrator/.gemini/antigravity/brain/86e95cb9-30e0-4767-b875-71590f1c77c2/identity_bridge_hero_1775569032784.png)

A secure, high-performance Node.js agent designed to bridge the gap between Cloud Identity Providers and On-Premises Active Directory (AD). This headless service acts as a secure proxy, allowing cloud applications to query internal AD attributes without exposing your domain controllers to the public internet.

---

## 🧩 Architecture Overview

Because Active Directory sits behind a strict corporate firewall, cloud applications cannot reach it directly. The **Identity Bridge Agent** solves this by running *inside* your secure corporate intranet (or VPN).

1.  **Direct LDAP Connectivity**: Connects directly to Domain Controllers via LDAP/S.
2.  **Secure API Gateway**: Exposes a hardened REST API guarded by a static `API_KEY`.
3.  **High-Performance Caching**: Features a built-in caching layer (with Redis support) to reduce load on Active Directory.
4.  **Shared Data Contracts**: Uses `packages/shared-types` to ensure consistent user and group data structures.

---

## ✨ Key Features

-   **Headless Integration**: Designed to be queried by any upstream application (Next.js, Go, Python, etc.) via simple REST calls.
-   **Enterprise-Grade Security**: Keep your internal network hidden; only the Agent requires outbound/inbound connectivity within the VPN.
-   **Intelligent Sync Engine**: Cron-based heartbeat and background synchronization for optimized performance.
-   **Developer-First Experience**: Modern TypeScript implementation with clear interfaces and easy setup.

---

## 📂 Project Structure

```text
Identity-Bridge/
├── apps/
│   └── agent-service/      # 🔐 Internal AD/LDAP Proxy Agent
├── packages/
│   └── shared-types/       # 🤝 Common TypeScript Interfaces
├── package.json            # 📦 Monorepo Workspace Config
└── README.md               # 📖 Project Documentation
```

---

## 🚀 Dev Setup & Local Environment

### Prerequisites

-   Node.js v18+
-   Access to an LDAP / Active Directory instance
-   (Optional) Redis instance for distributed caching

### 1. Installation

This project is structured as an NPM Workspaces monorepo.

```bash
# Install all dependencies
npm install

# Compile the shared types package
cd packages/shared-types
npm run build
cd ../../
```

### 2. Configure Environment Variables

Create a local `.env.local` file in the agent service directory.

#### Agent Service Environment (`apps/agent-service/.env.local`)

```env
PORT=4000
HOST=0.0.0.0
API_KEY=your_secret_internal_api_key        # Used by upstream apps to auth with this agent
LDAP_URL=ldap://your-ad-dc.local:389         # AD Controller URL
LDAP_BASE_DN=DC=yourdomain,DC=local          # Search Scope
LDAP_BIND_DN=CN=Svc,CN=Users,DC=yourdomain,DC=local
LDAP_BIND_PASS=YourSecretPassword

# Optional Redis Configuration
# REDIS_URL=redis://localhost:6379
```

### 3. Run the Development Server

You can start the agent from the root directory:

```bash
npm run dev
```

The agent will be available at `http://localhost:4000`.

---

## 🧠 Core Workflows

-   **Identity Proxy**: Upstream applications send a `GET /api/users/:identifier` request with the `x-api-key` header. The agent performs an LDAP search and returns mapped attributes.
-   **Caching Layer**: The Agent abstracts the Redis cache. Repeated LDAP reads for identical users are intercepted and served from memory to heavily reduce Active Directory bind loads.
-   **Attribute Mapping**: Automatically maps complex LDAP attributes (like `memberOf`, `lastLogonTimestamp`) into clean JSON objects defined in `shared-types`.

---

## 🛑 Troubleshooting

-   **LDAP Connection Timeout**: Ensure the machine running `agent-service` has direct network access to your Domain Controller/LDAP server on port 389/636.
-   **Shared Types Missing**: Ensure you've run `npm run build` inside `packages/shared-types` at least once before starting the agent.

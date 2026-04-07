# Identity Bridge Platform 🌉

A secure, decoupled architecture designed to bridge the gap between Cloud Single Sign-On Identity Providers (OIDC, Azure AD, Auth0, Okta) and On-Premises Active Directory (AD).

## 🧩 Architecture Overview

Because Active Directory sits behind a strict corporate firewall, cloud applications cannot reach it directly. To solve this, the **Identity Bridge** is split into two physical components:

1. **`apps/agent-service` (The Internal Agent)**
   A Node.js backend running *inside* your secure corporate intranet (or VPN). It has direct access to connect to the Active Directory domain controllers via LDAP. It features internal caching, a cron-based heartbeat sync engine, and REST endpoints guarded by an internal API key.
   
2. **`apps/nextjs-app` (The Cloud Application)**
   A Next.js 14 Web Application representing your external-facing service. It handles authenticating users via a Cloud IdP (OIDC). Once authenticated, it proxies a secure internal request to the `agent-service` to dynamically fetch the user's on-premise AD groups and attributes.

3. **`packages/shared-types` (The Glue)**
   A TypeScript package defining standard interfaces (like `User` and `Group`) to ensure seamless data contracts between the Cloud and the Agent.

---

## 🚀 Dev Setup & Local Environment

### Prerequisites
- Node.js v18+
- Access to an LDAP / Active Directory instance
- An application registration in a Cloud OIDC Provider (Auth0, Mock IdP, Azure AD, etc.)

### 1. Installation

This project is structured as an NPM Workspaces monorepo.
```bash
# Install all dependencies across all workspaces
npm install

# Compile the shared types package (Requires doing this once initially!)
cd packages/shared-types
npm run build
cd ../../
```

### 2. Configure Environment Variables

You need to establish local `.env.local` files in both applications.

#### Agent Service Environment
Create `apps/agent-service/.env.local`:
```env
PORT=4000
HOST=0.0.0.0

# Security Key used by the Next.js app to authenticate against this agent
API_KEY=super_secret_internal_api_key_123

# Active Directory configuration (Replace with your Domain Controller details)
LDAP_URL=ldap://your-ad-domain-controller.local:389
LDAP_BASE_DN=DC=yourdomain,DC=local
LDAP_BIND_DN=CN=ServiceAccount,CN=Users,DC=yourdomain,DC=local
LDAP_BIND_PASS=ServiceAccountPassword

# Optional Redis Cache (For local Dev, it will fallback to RAM if left blank)
# REDIS_URL=redis://localhost:6379
```

#### Next.js Application Environment
Create `apps/nextjs-app/.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_super_secure_random_string_here

# Internal Route to the Agent Service you configured above
AGENT_SERVICE_URL=http://127.0.0.1:4000
INTERNAL_API_KEY=super_secret_internal_api_key_123

# Cloud IdP Configuration
OIDC_CLIENT_ID=your_idp_application_client_id
OIDC_CLIENT_SECRET=your_idp_application_client_secret
OIDC_ISSUER=https://your-custom-sso-url.com
```

### 3. Run the Development Servers

You must run both services simultaneously. You can either use two terminal windows or run them from the root via workspaces:

**Terminal 1 (The Agent)**
```bash
cd apps/agent-service
npm run dev
```

**Terminal 2 (The Next.js Frontend)**
```bash
cd apps/nextjs-app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

---

## 🧠 Core Workflows

- **OIDC Login**: When a user clicks "Sign In", NextAuth maps their incoming OIDC claims. If the IdP doesn't send the `email` field directly, the system automatically looks for `upn` or `unique_name` claims in the token to act as the primary lookup anchor.
- **Identity Proxy**: Because the Next.js server proxies calls invisibly via server-side fetches, the user's browser never sees the internal `API_KEY` or the Agent URL.
- **Caching**: The Agent abstracts the Redis cache. Repeated LDAP reads for identical users are intercepted and served from memory to heavily reduce Active Directory bind loads.

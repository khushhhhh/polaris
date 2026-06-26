# Polaris - Collaborative Browser-Based Cloud IDE

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://polaris-pe5h6h8jb-khush3.vercel.app/)

**Live URL**: [https://polaris-pe5h6h8jb-khush3.vercel.app/](https://polaris-pe5h6h8jb-khush3.vercel.app/)

Polaris is a collaborative, browser-based cloud IDE inspired by Cursor AI. It allows developers to build, test, and run code directly in the browser with real-time sync, AI assistant integration, background tasks, and in-browser runtime execution.

## Key Features

- **Real-Time Collaboration**: Collaborative editing with instant synchronization across clients.
- **AI Coding Assistant**: Chat-based AI panel to generate, suggest, and edit code.
- **Background Task Management**: Powered by Inngest for robust event-driven background processing.
- **In-Browser Execution**: Uses WebContainers to run servers and execute terminal commands.
- **Protected Workspace & Auth**: Secure login flows powered by Clerk.
- **Real-time Database**: Ultra-responsive database backend using Convex.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Editor** | CodeMirror 6 with custom extensions & One Dark theme |
| **Database** | Convex (Real-time backend database) |
| **Background Jobs** | Inngest (Event-driven orchestrator) |
| **Authentication** | Clerk (Auth templates & JWT providers) |
| **Execution** | WebContainer API, xterm.js (terminal emulator) |
| **UI Components** | shadcn/ui & Radix UI |

---

## Getting Started

### 1. Prerequisites
Make sure you have the following installed on your machine:
- Node.js 20.09+
- npm (installed globally)

You will need accounts on:
- [Clerk](https://clerk.com) (for user authentication)
- [Convex](https://convex.dev) (for real-time database)

---

### 2. Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/code-with-antonio/polaris.git
   cd polaris
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up local environment variables**:
   Create a `.env.local` file in the project root:
   ```env
   # Clerk Credentials
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key

   # Convex Credentials (auto-filled by running npx convex dev)
   NEXT_PUBLIC_CONVEX_URL=
   CONVEX_DEPLOYMENT=
   POLARIS_CONVEX_INTERNAL_KEY=your_random_internal_key

   # AI Provider API Keys
   ANTHROPIC_API_KEY=your_anthropic_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
   ```

---

### 3. Running the Development Environment

To start the complete IDE stack locally, run the following three services in separate terminals:

#### Service A: Convex Database & Backend
```bash
npx convex dev
```
*Note: If prompted, select "Start without an account (run Convex locally)". You must copy your Clerk JWT template Issuer URL and add it under `CLERK_JWT_ISSUER_DOMAIN` inside your local Convex dashboard settings at `http://127.0.0.1:6790`.*

#### Service B: Inngest Dev Server
First install the Inngest CLI:
```bash
curl -sSfL https://cli.inngest.com/install.sh | sh
```
Then run the dev server:
```bash
./inngest dev
```

#### Service C: Next.js Web App
```bash
npm run dev
```

Now, navigate to **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## Architecture & Codebase Structure

```
src/
├── app/                    # Next.js App Router & API handlers
│   ├── api/                # Serve routes (Inngest, Clerk SSO, Project generation)
│   ├── sign-in/            # Clerk Sign In views
│   └── sign-up/            # Clerk Sign Up views
├── components/             # Reusable UI & Layout Components
│   └── providers.tsx       # Auth, Theme, and Convex provider configuration
├── features/               # Domain-specific modules
│   ├── auth/               # Unauthenticated routing controls
│   ├── conversations/      # AI agent configuration & Inngest logic
│   └── projects/           # Workspace & dashboard components
├── inngest/                # Inngest client definition
└── proxy.ts                # Middleware router for Clerk Auth proxy paths
```

---

## Verification & Testing

To confirm the local setup status and verify all features end-to-end, you can run diagnostics and automated tests:

### 1. Diagnostics
- **Clerk health check**: Run `clerk doctor`
- **Convex environment variables**: Run `npx convex env list`
- **Inngest active functions**: Visit the local dashboard at `http://localhost:8288`

### 2. End-to-End Feature Verification Test
We have included a comprehensive end-to-end local integration test script to verify all core application functionality (project creation, file explorer folder/file operations, editing/saving, and background chat processing via Inngest) completely offline.

To execute the test suite, ensure your development servers (Convex, Inngest, and Next.js) are running, and run:
```bash
npx tsx src/test-features-e2e.ts
```

This script will:
1. Connect to the local Convex server using the credentials in your `.env.local` file.
2. Verify project & conversation creation.
3. Test file explorer actions (recursively creating and reading folders and files).
4. Verify file editing and renaming.
5. Simulate user chat inputs, trigger the Inngest processor, and wait for the mock assistant generation to populate the database.
6. Verify file deletion and cleanup.


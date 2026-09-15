# PassVault Office Visitor Pass System - Frontend (Client)

React 18 + Vite + Tailwind CSS Single-Page Application for managing office visitor registrations, host approvals, receptionist check-ins/outs, and searchable visitor audit history.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Environment Setup

Create a `.env` file from the provided `.env.example`:

```bash
cp .env.example .env
```

Default configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Installation

```bash
npm install
```

### Development

Start the local development server at `http://localhost:5173`:

```bash
npm run dev
```

### Production Build

Build optimized production assets:

```bash
npm run build
```

### Running Tests

Execute unit and component tests with Vitest:

```bash
npm test
```

## Application Views & Routes

- `/register`: Self-service visitor pre-registration portal with live digital pass preview.
- `/approvals`: Host employee portal to review, approve, or reject pending visit requests.
- `/reception`: Front-desk console for searching guests, verifying IDs, badge assignment, and check-in/out.
- `/history`: Searchable SOC2-compliant historical audit trail with CSV export and KPI analytics.

# API Health Monitoring Dashboard - Client

React 18 + Vite + Tailwind CSS Single-Page Application for continuous API health monitoring, real-time probe execution, failure diagnostics, and historical telemetry analytics.

## Features

- **Real-Time Health Monitoring**: Register and manage target APIs with configurable check frequencies, expected status codes, and timeout limits.
- **On-Demand Health Probes**: Trigger manual health checks with instant latency and status feedback.
- **Failure Log Stream & Inspector**: Investigate anomalous and failing probes with diagnostic waterfall breakdowns (DNS, TCP, TLS, TTFB) and error messages.
- **Historical Telemetry Analytics**: View P50, P95, and P99 latency trends over selectable time windows (24h, 7d, 30d) alongside 24-hour availability heatmaps and service reliability rankings.

## Setup & Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env` inside `client/`:

```bash
cp .env.example .env
```

Default value:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### 4. Run Unit Tests

```bash
npm run test
```

### 5. Build for Production

```bash
npm run build
```

The compiled production bundle will be output to `client/dist/`.

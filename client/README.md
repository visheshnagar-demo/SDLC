# API Health Monitoring Dashboard &mdash; Frontend (Client)

React 18 single-page application built with Vite and Tailwind CSS for real-time API endpoint registration, status/latency tracking, interactive telemetry analytics, and diagnostic failure inspection.

## Key Features

- **Dashboard Overview**: 4 high-impact KPI summary cards (Total Monitored APIs, 24h Overall Uptime, Average Latency, Active Failures).
- **API Registry & Management**: Register, edit, delete, and manually probe HTTP endpoints (GET, POST, HEAD) with custom headers, expected status codes, and cadence intervals (30s/60s/300s).
- **Telemetry & Historical Analytics**: Dual-curve response latency time-series charts (Average vs. P95 latency) with SLA threshold baselines, plus 24h/30d availability heatmaps.
- **Failure Inspector**: Slide-over diagnostic inspector for detailed root cause analysis with HTTP error codes, latency, request headers, and formatted response body previews.
- **Robust Error Handling**: Real-time error banners and defensive Error Boundaries preventing blank-screen crashes.

## Tech Stack

- **Framework**: React 18.3.1
- **Bundler / Dev Server**: Vite 5.2.8
- **Styling**: Tailwind CSS 3.4.3
- **Routing**: React Router DOM 6.22.3
- **Data Visualization**: Recharts 2.12.3
- **Icons**: Lucide React 0.363.0
- **HTTP Client**: Axios 1.6.8
- **Testing**: Vitest 1.4.0 + @testing-library/react 14.2.2 + jsdom

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd client
npm install
```

### Environment Configuration

Create a `.env` file in the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Development Server

Start the local development server at `http://localhost:5173`:

```bash
npm run dev
```

### Production Build & Preview

```bash
npm run build
npm run preview
```

### Running Tests

```bash
npm test
```

## Architecture & Directory Structure

```
client/
├── public/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.jsx        # Navigation shell, cluster badges, action triggers
│   │   ├── MetricSummaryCard.jsx      # KPI summary metrics cards
│   │   ├── ApiEndpointTable.jsx       # Filterable monitored endpoint table
│   │   ├── ApiRegistrationModal.jsx   # Dialog for creating/editing API endpoints
│   │   ├── TelemetryLatencyChart.jsx  # Recharts dual-line latency time-series chart
│   │   ├── UptimeAvailabilityHeatmap.jsx # 24h/30d availability block strip heatmap
│   │   └── FailureInspectorDrawer.jsx # Diagnostic error/header/body preview drawer
│   ├── pages/
│   │   ├── DashboardPage.jsx          # Main overview dashboard
│   │   ├── ApiDetailsPage.jsx         # Endpoint-specific telemetry & logs view
│   │   └── FailuresPage.jsx           # Global failure incident log viewer
│   ├── services/
│   │   └── api.js                     # Centralized Axios API client & contract functions
│   ├── App.jsx                        # React Router configuration
│   ├── main.jsx                       # Entry mount with ErrorBoundary
│   ├── setup.js                       # Test setup & jsdom polyfills
│   └── index.css                      # Tailwind base and scrollbar styles
├── index.html                         # Entry HTML with Inter/JetBrains Mono fonts
├── vite.config.js                     # Vite build & test configuration
├── tailwind.config.js                 # Tailwind design tokens & colors
└── package.json                       # Pinned dependencies & npm scripts
```

# CloudPulse — Multi-Cloud Management System (Frontend)

React 18 single page application powered by Vite, Tailwind CSS, and Lucide icons for centralized multi-cloud infrastructure management, real-time telemetry monitoring, VM lifecycle orchestration, and immutable audit logs.

## Tech Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.1.4
- **Styling**: Tailwind CSS 3.4.1 + PostCSS + Autoprefixer
- **Routing**: React Router DOM 6.22.0
- **HTTP Client**: Axios 1.6.7
- **Icons**: Lucide React
- **Testing**: Vitest 1.3.1 + @testing-library/react + jsdom

## Setup and Development

### Prerequisites

- Node.js 18+
- npm 9+

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Install Dependencies

```bash
npm install
```

### Run Local Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Run Test Suite

```bash
npm test
```

### Build for Production

```bash
npm run build
```

## Architectural Highlights

- **RBAC-Gated Actions**: Admin roles can provision, start, stop, restart, and terminate cloud VMs, while Read-Only users are restricted to status and telemetry views.
- **Multi-Cloud Abstraction**: Seamless unified dashboard across AWS EC2, GCP Compute Engine, and Azure Virtual Machines.
- **Live Telemetry Visualization**: SVG charts displaying CPU, RAM, Disk I/O, and Network traffic with threshold alerts.
- **FinOps Cost Estimator**: Real-time compute and storage run rate estimation during instance provisioning.
- **Cryptographic Audit Log**: Tamper-evident activity logs with SHA-256 Merkle proofs.

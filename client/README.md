# Livestock Cattle Management & Tracking System (Frontend Client)

A modern, high-performance React 18 Single Page Application (SPA) built with Vite and Tailwind CSS for farm managers and workers to digitally track cattle inventory, record daily milk yields, log veterinary health events, and analyze herd performance.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library + jsdom

## Setup & Running Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:
   Ensure `.env` contains:

   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

   The client will run at `http://localhost:5173`.

4. Run tests:

   ```bash
   npm test
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Key Pages & Features

- **Dashboard (`/dashboard`)**: Herd KPI cards, 30-day milk production trend chart, herd health status donut chart, and >30% yield drop alert banner.
- **Cattle Inventory (`/cows`)**: Full CRUD data table, Tag ID/breed/status filters, slide-over detail drawer, and register cow modal.
- **Milk Production (`/milk-production`)**: AM/PM milking session logging form with real-time total and 30% drop anomaly check, plus historical logs.
- **Health & Veterinary (`/health-records`)**: Medical records, vaccination tracking, diagnosis & treatment plan logging modal.
- **Authentication & RBAC (`/login`)**: JWT login with pre-filled test account (`test@example.com` / `testpassword`) and Farm Manager vs Farm Worker role enforcement.

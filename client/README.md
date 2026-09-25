# AquaSense — Smart Aquarium Monitoring Platform (Client)

React 18 Single Page Application (SPA) built with Vite, Tailwind CSS, and Recharts for monitoring water quality telemetry, managing automated feeding schedules, tracking fish health observations, and managing equipment lifecycle maintenance.

## Features

- **Live Telemetry Dashboard**: Real-time multi-sensor telemetry stream (pH, dissolved oxygen, temperature, ammonia) with safe corridor status pills and 24h interactive trend analytics.
- **Threshold Safety & Alert Center**: Configurable parameter boundary limits, slide-over threshold configuration drawer, and live incident triage queue with acknowledge/resolve actions.
- **Feeding Management**: Daily feeding timeline checklist, recurring schedule configurator, and manual feed recording log.
- **Fish Health & Equipment Hub**: Population census, quarantine biosecurity tracking, medical observation logs, and life-support equipment service countdowns.

## Technology Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.1.4
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React
- **Data Visualization**: Recharts 2.12.0
- **Testing**: Vitest 1.3.1 + React Testing Library + jsdom

## Setup & Local Development

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (defaults to `http://localhost:8000`):
   ```bash
   cp .env.example .env
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
5. Run unit tests:
   ```bash
   npm test
   ```
6. Build for production:
   ```bash
   npm run build
   ```

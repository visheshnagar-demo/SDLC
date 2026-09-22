# Chrono Certified — Frontend Client (React 18 + Vite + Tailwind CSS)

Chrono Certified is a responsive, luxury single-page web application for discovering, inspecting, reserving, and acquiring certified pre-owned luxury branded timepieces.

## Features & UX Capabilities

- **Haute Horlogerie UI/UX**: Custom luxury dark theme (`#121316`, `#181B22`, `#D4AF37`, `#F2CA50`) with Playfair Display typography and Plus Jakarta Sans body.
- **Multi-Attribute Faceted Filtering**: Filter catalog by brand (Rolex, Patek Philippe, Audemars Piguet, Omega, etc.), condition score (8.0–10.0), price bracket, box/papers status, and caliber movement type.
- **Deep Horological Inspection**: Multi-angle macro photo gallery (Dial, Caliber, Case, Clasp, Box/Papers) with 2x zoom loupe, atelier condition scorecard (9.8/10), and master watchmaker verification sign-off.
- **15-Minute Concurrency Reservation Lock**: Real-time reservation countdown banner securing unique 1-of-1 timepieces during checkout.
- **Armored Courier Selection**: Ferrari Group Armored Express (24-48h, $150) vs. Malca-Amit Priority Secure (2-3 days, Included).
- **Swiss Escrow Payment & Handover PIN**: Secure checkout with 4-digit handover verification PIN presented to armed couriers upon delivery.
- **Order Lifecycle Fulfillment Tracking**: 5-stage progressive tracking stepper from Verification to Packaging, Dispatch, and Escrow Release.
- **Customer Profile & Wishlist**: Manage saved addresses, favorite watches, and download digital certificates.

## Setup and Development

### Prerequisites

- Node.js 18+
- npm 9+

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Port 5173)
npm run dev

# 3. Execute unit test suite
npm run test

# 4. Production build
npm run build
```

### Environment Configuration

Create `.env` inside `client/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Test Credentials: `test@example.com` / `testpassword`

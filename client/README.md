# Athenaeum LMS - Client Frontend

Modern React 18 single-page application for the Library Management System built with Vite and Tailwind CSS.

## Features

- **Book Catalog & Search**: Multi-field search (title, author, genre, ISBN), genre filtering, real-time stock badges, and instant checkout.
- **Inventory & Catalog Administration**: Add and edit book entries, ISBN format validation, inventory replenishment, and safe deletion guards.
- **Patron Management**: Membership profiles, unique UUID assignment, 5-book concurrent quota enforcement, and overdue fine tracking.
- **Circulation Desk & Loans**: 14-day auto-calculated loan checkout, real-time overdue detection, $0.50/day late fee calculation, and return processing.

## Tech Stack

- **Framework**: React 18 (SPA)
- **Bundler / Dev Server**: Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router DOM 6
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library + JSDOM

## Setup & Running Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:
   Ensure `.env` exists in `client/`:

   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

   The client will run on `http://localhost:5173`.

4. Run unit test suite:

   ```bash
   npm test
   ```

5. Build for production:
   ```bash
   npm run build
   ```

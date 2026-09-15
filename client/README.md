# AI Email Classification System - Frontend Client

A React 18, Vite, and Tailwind CSS Single Page Application for AI-assisted email categorization and review.

## Features

- **Email Input Studio**: Input raw email body text or upload standard email files (`.eml`, `.txt`, `.pdf` up to 10MB).
- **AI Categorization Feedback**: Immediate categorization breakdown into Work, Personal, Urgent, or Promotional categories with confidence scores.
- **Review Dashboard**:
  - Aggregated metrics overview cards.
  - Search by subject, sender, or body keywords.
  - Filter by category tabs, confidence threshold slider, and date range.
  - Data table with source indicators, confidence bars, and verification statuses.
- **Manual Override Modal**: Detailed RFC 822 email inspection, raw text viewer, and category override capability.

## Development Setup

1. **Install Dependencies**:

   ```bash
   cd client
   npm install
   ```

2. **Environment Configuration**:
   Verify `client/.env` contains the backend API URL:

   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start Development Server**:

   ```bash
   npm run dev
   ```

   The client runs at `http://localhost:5173`.

4. **Run Unit Tests**:

   ```bash
   npm test
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

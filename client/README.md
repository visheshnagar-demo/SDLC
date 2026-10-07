# MediCare Core - Hospital Management System (HMS) & Patient Portal

Frontend single-page application built with React 18, Vite, and Tailwind CSS for the Hospital Management System (HMS) Core Platform & Patient Portal (SCRUM-423).

## Features

- **Patient Portal Dashboard & Booking**: Search available doctors by specialty, book/reschedule appointments with atomic slot locking, view past visit summaries, and download e-prescriptions and lab reports securely.
- **Physician EHR & Clinical Workspace**: Interactive SOAP notes editor, live point-of-care vitals monitor strip, ICD-10 diagnosis selector, E-Prescription builder, and diagnostic laboratory orders.
- **Hospital Administration & HIPAA Security Console**: Master patient index directory with National ID / SSN deduplication integrity checks and real-time streaming HIPAA compliance audit logs.
- **Role-Based Access Control (RBAC)**: Enforced interfaces for Patients, Doctors, Administrators, Nurses, and Receptionists with prefilled test credentials.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Environment Configuration

Create a `.env` file in the `client/` root (or copy from `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Installation

```bash
cd client
npm install
```

### Development Server

```bash
npm run dev
```

Runs the application at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Builds production-ready assets into the `dist/` directory.

### Running Tests

```bash
npm run test
```

Executes test suite with Vitest and `@testing-library/react`.

## Test Credentials

- **Patient Portal**: `test@example.com` / `testpassword`
- **Doctor / Clinical**: `doctor@example.com` / `doctorpassword`
- **Administrator**: `admin@example.com` / `adminpassword`

# TaskMaster Frontend Client

A modern, responsive Todo List Single Page Application built with React 18, Vite, and Tailwind CSS.

## Features

- **Task Management**: Create, edit, toggle completion, and delete tasks.
- **Filtering & Search**: Filter by status (All, Active, Completed) with live task counts, and search by title/description keywords.
- **Interactive Dashboard**: Summary metrics (Total, Active, Completed, Completion Rate).
- **Edit Modal**: Dedicated modal dialog for editing task details and status.
- **Defensive Error Handling**: Direct API error feedback with error boundary protection.

## Setup & Running Locally

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` if not already present:

```bash
cp .env.example .env
```

Default configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Development Server

```bash
npm run dev
```

Runs the Vite dev server at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

### Testing

```bash
npm run test
```

Runs unit tests with Vitest and React Testing Library.

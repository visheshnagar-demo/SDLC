# NutriKids - Interactive Kids' Eating Habits Tracker & Nutrition Dashboard

Interactive full-stack web application designed for kids and parents to build sustainable healthy eating habits through gamified meal logging, daily streak tracking, educational food quizzes, avatar customization, and parental weekly nutrition analytics.

## Features

- **Child-Friendly Daily Meal Logging**: Interactive logger for Breakfast, Lunch, Dinner, and Snacks with portion sizes, food groups, and instant "+30 / +40 / +50 Pts" rewards.
- **Water Hydration Tracker**: Daily 6-glass tracker with progress feedback and hydration scoring.
- **Eat The Rainbow Progress**: Real-time progress bars tracking daily fruit, vegetable, whole grain, and protein targets.
- **Gamified Rewards & Streak Engine**: Consecutive-day streak bonuses, unlocked badges (Veggie Hero, Rainbow Eater), and reward points.
- **Sprout Wardrobe Studio**: Unlockable avatar costumes (Superhero Cape, Veggie Crown, Chef Hat, Dino Suit) redeemable with habit points.
- **Nutrition Trivia Quizzes**: Interactive educational questions with instant celebratory points feedback and fun facts.
- **Parental Wellness Analytics Portal**: Weekly multi-bar compliance visualization, hydration scores, logged meal history table, and pediatric advice recommendations.

## Technology Stack

- **Framework**: React 18
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts & Data Viz**: Recharts
- **Celebration Animations**: Canvas Confetti
- **Testing**: Vitest + @testing-library/react + jsdom

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Installation

```bash
cd client
npm install
```

### Local Development

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Environment Variables

Configure `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Build & Testing

```bash
# Production Build
npm run build

# Run Vitest Unit Tests
npm test
```

### Test Accounts

- **Parent**: `test@example.com` / `testpassword`

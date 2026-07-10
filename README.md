# Ω SYD OMEGA 91717 Enterprise Platform

Enterprise-grade platform built with Next.js, Express, TypeScript, and modern web technologies.

## Project Structure

```
sydomega-live/
├── backend/              # Express.js backend service
│   ├── src/
│   ├── dist/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── frontend/             # Next.js frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── package.json          # Root workspace configuration
├── package-lock.json
└── ...
```

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript 5
- **Database**: PostgreSQL (via Prisma)
- **Auth**: JWT + NextAuth
- **Cache**: Redis
- **Validation**: Zod

### Frontend
- **Framework**: Next.js 16
- **React**: 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form
- **UI**: Framer Motion

## Getting Started

### Prerequisites
- Node.js 20.11.0 or higher
- npm 10 or higher

### Installation

```bash
# Install dependencies for all workspaces
npm ci

# Or install for specific workspace
npm ci -w backend
npm ci -w frontend
```

### Development

```bash
# Run all development servers
npm run dev

# Run specific workspace
npm run dev:backend
npm run dev:frontend
```

### Building

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:backend
npm run build:frontend
```

### Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

### Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck
```

## Scripts

### Root Level

- `npm run clean` - Clean build artifacts
- `npm run dev` - Start all development servers
- `npm run dev:backend` - Start backend dev server
- `npm run dev:frontend` - Start frontend dev server
- `npm run build` - Build all workspaces
- `npm run build:backend` - Build backend
- `npm run build:frontend` - Build frontend
- `npm run start` - Start production backend server
- `npm run lint` - Lint all workspaces
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check all workspaces
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode

## Environment Variables

Create `.env.local` files in backend and frontend directories with required environment variables.

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## CI/CD

The repository uses GitHub Actions for continuous integration. All tests must pass and linting must succeed before deployment.

## License

Private - SYD OMEGA 91717

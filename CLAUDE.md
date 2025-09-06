# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev           # Start development server on localhost:3000
npm run build         # Build for production
npm run start         # Start production server
npm run type-check    # Run TypeScript type checking
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically
```

### Database Operations
```bash
npm run db:push       # Push schema changes to database
npm run db:migrate    # Run migrations
npm run db:generate   # Generate Prisma client
npm run db:studio     # Open Prisma Studio
npm run setup         # Initialize database with sample data
```

### Testing
```bash
npm run test          # Run Jest unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run end-to-end tests
npm run test:modular  # Run modular architecture tests
```

### System Utilities
```bash
npm run clean         # Clean build artifacts
npm run check:modules # Verify modular architecture
npm run health:check  # Run health checks
```

## Architecture Overview

This is a **modular Next.js application** with **TypeScript** and **Prisma ORM**. The system follows a **clean architecture pattern** with clear separation of concerns.

### Key Architectural Patterns
- **Modular Architecture**: Code organized in self-contained modules
- **Service Layer Pattern**: Business logic separated from UI components
- **Custom Hooks Pattern**: State management through React hooks
- **Component Composition**: UI built from reusable components

### Core Directory Structure
```
src/
├── app/              # Next.js App Router (pages & API routes)
├── components/       # Reusable UI components (Button, Card, Dashboard)
├── hooks/           # Custom React hooks (useAuth, useDashboard)
├── lib/             # Core business logic (auth, bot-commands, export)
├── services/        # Background services (cron, notifications)
├── types/           # TypeScript type definitions
└── utils/           # Pure utility functions
```

### Module System
The application uses a **centralized export system** via `src/index.ts` that provides:
- Clean import syntax: `import { Button, useAuth, formatDate } from '@/src'`
- Feature modules with lazy loading
- Service orchestration via `ServiceManager`

### Database
- **Prisma ORM** with PostgreSQL
- Schema defined in `prisma/schema.prisma`
- Models: Employee, AttendanceRecord, Admin, Settings, etc.
- Database client: `src/lib/prisma.ts`

### API Architecture
- **Next.js API Routes** in `src/app/api/`
- RESTful endpoints for attendance, employees, auth
- **Telegram webhook** at `/api/bot/webhook`
- Authentication via JWT tokens

### Telegram Bot Integration
- Bot implementation: `src/lib/telegram-bot.ts`
- Commands: `src/lib/bot-commands.ts`
- Location-based attendance verification
- Real-time notifications

## Configuration Requirements

### Environment Variables (.env)
Essential variables for development:
```env
DATABASE_URL="postgresql://..."
TELEGRAM_BOT_TOKEN="bot_token"
NEXTAUTH_SECRET="secret"
OFFICE_LATITUDE=31.0417
OFFICE_LONGITUDE=31.3778
OFFICE_RADIUS=100
```

### TypeScript Configuration
- Path aliases configured in `tsconfig.json`
- `@/*` maps to `./src/*`
- Strict TypeScript settings enabled

## Development Guidelines

### Component Development
- Use the existing UI components: `Button`, `Card` from `@/components/ui`
- Follow component composition pattern
- Implement proper TypeScript interfaces

### State Management
- Use custom hooks from `@/hooks` for complex state
- Follow the patterns in `useAuth.ts` and `useDashboard.ts`
- Leverage Zustand for global state when needed

### API Development
- API routes follow Next.js 13+ App Router pattern
- Use Prisma client from `@/lib/prisma`
- Implement proper error handling and validation

### Service Integration
- Services managed by `ServiceManager` in `src/services/service-manager.ts`
- Initialize services properly in the correct order
- Use dependency injection pattern

## Testing Strategy

The system includes comprehensive testing:
- **Unit tests**: Jest for individual components and functions
- **Integration tests**: API endpoint testing
- **E2E tests**: Complete user workflows
- **Modular tests**: Architecture validation

## Common Tasks

### Adding New Features
1. Create components in appropriate `@/components` subdirectory
2. Add custom hooks to `@/hooks` if needed
3. Update types in `@/types/index.ts`
4. Export from module index files
5. Run `npm run check:modules` to verify architecture

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:push` for development
3. Use `npm run db:migrate` for production migrations
4. Regenerate client with `npm run db:generate`

### Telegram Bot Updates
1. Modify commands in `src/lib/bot-commands.ts`
2. Update webhook handler in `src/app/api/bot/webhook/route.ts`
3. Test with development bot token

## Important Notes

- The system is **location-based** (El Mansoura CIH office coordinates)
- **Always run linting and type-checking** before committing
- Use the **modular import system** rather than relative paths
- Follow the **service lifecycle management** via ServiceManager
- Database operations should use **Prisma client** exclusively
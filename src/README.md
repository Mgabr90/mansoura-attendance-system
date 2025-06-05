# 📁 Source Directory Structure

## El Mansoura CIH Attendance System - Modular Architecture

This directory contains the complete modular architecture for the attendance system.

## 📂 Directory Overview

```
src/
├── app/                    # Next.js App Router
├── components/            # Reusable UI Components
├── hooks/                # Custom React Hooks
├── lib/                  # Core Business Logic
├── services/             # Background Services
├── types/                # TypeScript Definitions
├── utils/                # Utility Functions
└── index.ts              # Main Module Exports
```

## 🎨 Components (`/components`)

### UI Components (`/ui`)
Basic, reusable UI building blocks:
- `Button.tsx` - Multi-variant button component
- `Card.tsx` - Container with header/body/footer
- `Modal.tsx` - Overlay dialogs
- `Input.tsx` - Form inputs with validation
- `Table.tsx` - Data tables
- `Badge.tsx` - Status indicators

### Feature Components (`/features`)
Business-specific components:
- `Dashboard.tsx` - Main dashboard
- `EmployeeList.tsx` - Employee management
- `ReportsPanel.tsx` - Analytics interface
- `NotificationCenter.tsx` - User notifications

### Layout Components (`/layout`)
Application structure:
- `Header.tsx` - App header with navigation
- `Sidebar.tsx` - Side navigation
- `Footer.tsx` - App footer
- `Layout.tsx` - Main layout wrapper

## 🎪 Hooks (`/hooks`)

Custom React hooks for state management:
- `useAuth.ts` - Authentication state
- `useDashboard.ts` - Dashboard data management
- `useEmployees.ts` - Employee data operations
- `useReports.ts` - Report generation
- `useNotifications.ts` - Notification handling

## 📚 Libraries (`/lib`)

Core business logic modules:
- `auth.ts` - Authentication service
- `export.ts` - Data export functionality
- `bot-commands.ts` - Telegram bot commands
- `health-monitor.ts` - System health checks

## ⚙️ Services (`/services`)

Background services and integrations:
- `cron-service.ts` - Scheduled tasks
- `notification.ts` - Notification delivery
- `startup.ts` - Application initialization
- `service-manager.ts` - Service orchestration

## 🛠️ Utils (`/utils`)

Pure utility functions organized by domain:
- `core.ts` - Essential utilities
- `date.ts` - Date/time operations
- `validation.ts` - Input validation
- `format.ts` - Data formatting
- `telegram-formatters.ts` - Telegram-specific formatting

## 📝 Types (`/types`)

TypeScript type definitions:
- Domain-specific types
- API response interfaces
- Component prop definitions
- Service contracts

## 🔄 Module Exports (`/index.ts`)

Central export hub providing:
- Clean import syntax
- Feature modules
- Lazy loading support
- Development utilities

## 📖 Usage Examples

### Importing Components
```typescript
import { Button, Card, Dashboard } from '@/components'
import { useAuth, useDashboard } from '@/hooks'
import { formatDate, cn } from '@/utils'
```

### Using Feature Modules
```typescript
// Lazy load entire feature modules
const { Dashboard } = await DashboardModule.Dashboard()
const { useReports } = await ReportsModule.useReports()
```

### Service Integration
```typescript
import { AuthService, ExportService } from '@/services'

// Use services directly
const user = await AuthService.login(credentials)
const csvData = await ExportService.exportToCSV(data)
```

## 🧪 Testing

Each module includes:
- Unit tests (`.test.tsx` files)
- Integration tests
- Type checking
- E2E test coverage

## 🚀 Performance

Optimizations include:
- Code splitting at module level
- Lazy loading for heavy components
- Tree shaking for unused code
- Bundle size optimization

## 📋 Best Practices

1. **Single Responsibility**: Each module has one clear purpose
2. **Clean Interfaces**: Well-defined contracts between modules
3. **Loose Coupling**: Minimal dependencies between modules
4. **High Cohesion**: Related functionality grouped together
5. **Testability**: Easy to unit test in isolation

## 🔧 Development

### Adding New Modules
1. Create in appropriate directory
2. Export from module's `index.ts`
3. Add to main `src/index.ts`
4. Update documentation

### Module Dependencies
- Always import from module roots (`@/components`, not `@/components/ui/Button`)
- Use type-only imports when possible
- Avoid circular dependencies

## 📚 Architecture Patterns

- **Composition over Inheritance**: Components compose smaller components
- **Hooks Pattern**: State logic in custom hooks
- **Service Layer**: Business logic separated from UI
- **Provider Pattern**: Context for global state
- **Factory Pattern**: Service creation and management

---

For detailed architecture documentation, see `/MODULAR_ARCHITECTURE.md` 
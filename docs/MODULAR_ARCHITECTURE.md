# 🏗️ Modular Architecture Guide

## El Mansoura CIH Attendance System v2.0

### 📋 Table of Contents
- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Module Structure](#module-structure)
- [Import/Export Strategy](#importexport-strategy)
- [Component Library](#component-library)
- [Service Layer](#service-layer)
- [State Management](#state-management)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Performance Optimization](#performance-optimization)

---

## 🎯 Overview

The El Mansoura CIH Attendance System has been completely refactored into a **modular, scalable architecture** that promotes:

- **Separation of Concerns**: Each module has a single responsibility
- **Reusability**: Components and services can be easily reused
- **Maintainability**: Clean boundaries make the codebase easy to maintain
- **Testability**: Isolated modules are easier to test
- **Scalability**: New features can be added without affecting existing code

---

## 🏛️ Architecture Principles

### 1. **Modular Design**
```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks for state logic
├── lib/           # Core business logic modules
├── services/      # Background services and external APIs
├── utils/         # Pure utility functions
└── types/         # TypeScript type definitions
```

### 2. **Layered Architecture**
```
┌─────────────────┐
│   Presentation  │ ← Components, Pages, UI
├─────────────────┤
│   Application   │ ← Hooks, State Management
├─────────────────┤
│    Business     │ ← Services, Domain Logic
├─────────────────┤
│      Data       │ ← Database, External APIs
└─────────────────┘
```

### 3. **Dependency Flow**
- **Unidirectional**: Higher layers depend on lower layers
- **Abstraction**: Interfaces define contracts between layers
- **Injection**: Dependencies are injected, not hardcoded

---

## 📦 Module Structure

### Component Modules
```typescript
// Example: Button Component
src/components/ui/Button.tsx

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  // ... other props
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', ...props }, ref) => {
    // Component implementation
  }
)

export default Button
```

### Service Modules
```typescript
// Example: Authentication Service
src/lib/auth.ts

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Authentication logic
  }
  
  async logout(): Promise<void> {
    // Logout logic
  }
}

export default new AuthService()
```

### Hook Modules
```typescript
// Example: Custom Hook
src/hooks/useAuth.ts

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Hook implementation
  
  return { user, loading, login, logout }
}

export default useAuth
```

---

## 🔄 Import/Export Strategy

### Central Index Files
Every module folder has an `index.ts` file for clean imports:

```typescript
// src/components/index.ts
export { default as Button } from './ui/Button'
export { default as Card } from './ui/Card'
export { default as Dashboard } from './features/Dashboard'

// Usage
import { Button, Card, Dashboard } from '@/components'
```

### Module-Specific Exports
```typescript
// Feature-specific modules
export const AuthModule = {
  useAuth: () => import('./hooks/useAuth'),
  LoginForm: () => import('./components/forms/LoginForm'),
  AuthService: () => import('./lib/auth')
}
```

### Lazy Loading
```typescript
// Lazy loaded components for performance
const Dashboard = lazy(() => import('./components/features/Dashboard'))
const ReportsPanel = lazy(() => import('./components/features/ReportsPanel'))
```

---

## 🎨 Component Library

### UI Components (src/components/ui/)
- **Button** - Reusable button with variants and states
- **Card** - Container component with header, body, footer
- **Modal** - Overlay component for dialogs
- **Input** - Form input with validation states
- **Table** - Data table with sorting and pagination
- **Badge** - Status indicators and labels

### Feature Components (src/components/features/)
- **Dashboard** - Main dashboard with statistics
- **EmployeeList** - Employee management interface
- **ReportsPanel** - Analytics and reporting
- **NotificationCenter** - User notifications

### Layout Components (src/components/layout/)
- **Header** - Application header with navigation
- **Sidebar** - Side navigation menu
- **Footer** - Application footer
- **Layout** - Main layout wrapper

---

## ⚙️ Service Layer

### Core Services (src/lib/)
```typescript
// Authentication Service
export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult>
  async logout(): Promise<void>
  async refreshToken(): Promise<string>
  async validateSession(): Promise<boolean>
}

// Export Service
export class ExportService {
  async exportToCSV(data: any[]): Promise<string>
  async exportToExcel(data: any[]): Promise<Buffer>
  async exportToPDF(data: any[]): Promise<Buffer>
}
```

### Background Services (src/services/)
```typescript
// Cron Service
class CronService {
  startDailySummary(): void
  startWeeklyReports(): void
  stopAllJobs(): void
}

// Notification Service
class NotificationService {
  async sendTelegramMessage(userId: string, message: string): Promise<void>
  async sendEmail(to: string, subject: string, body: string): Promise<void>
}
```

### Service Manager
```typescript
// Central service orchestration
class ServiceManager {
  async initialize(): Promise<void>
  getService<T>(name: string): T | null
  async shutdown(): Promise<void>
  isHealthy(): boolean
}
```

---

## 🎪 State Management

### Custom Hooks Pattern
```typescript
// Authentication state
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const login = useCallback(async (credentials) => {
    // Login logic
  }, [])
  
  const logout = useCallback(async () => {
    // Logout logic
  }, [])
  
  return { user, loading, login, logout }
}

// Dashboard state
const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  const refreshStats = useCallback(async () => {
    // Fetch dashboard data
  }, [])
  
  return { stats, loading, refreshStats }
}
```

### Context Providers
```typescript
// Authentication context
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth()
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## 🛠️ Development Workflow

### Project Setup
```bash
# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:push

# Run development server
npm run dev
```

### Module Development
1. **Create the module** in the appropriate directory
2. **Export from index.ts** for clean imports
3. **Write tests** for the module
4. **Update documentation** if needed

### Adding New Components
```bash
# Create component structure
mkdir src/components/features/NewFeature
touch src/components/features/NewFeature/index.tsx
touch src/components/features/NewFeature/NewFeature.test.tsx

# Update exports
echo "export { default as NewFeature } from './features/NewFeature'" >> src/components/index.ts
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Component testing
import { render, screen } from '@testing-library/react'
import { Button } from '@/components'

describe('Button Component', () => {
  it('renders with correct variant', () => {
    render(<Button variant="primary">Click me</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })
})

// Hook testing
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks'

describe('useAuth Hook', () => {
  it('handles login correctly', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password' })
    })
    
    expect(result.current.user).toBeDefined()
  })
})
```

### Integration Tests
```typescript
// Service integration testing
describe('AuthService Integration', () => {
  it('authenticates user and stores session', async () => {
    const authService = new AuthService()
    const result = await authService.login(validCredentials)
    
    expect(result.success).toBe(true)
    expect(result.token).toBeDefined()
  })
})
```

### E2E Tests
```javascript
// End-to-end testing
const { test, expect } = require('@playwright/test')

test('complete login flow', async ({ page }) => {
  await page.goto('/admin/login')
  await page.fill('[name="email"]', 'admin@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/admin')
})
```

---

## ⚡ Performance Optimization

### Code Splitting
```typescript
// Route-based splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Reports = lazy(() => import('./pages/Reports'))

// Component-based splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'))
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run analyze

# Check module dependencies
npm run check:modules
```

### Lazy Loading
```typescript
// Lazy load feature modules
export const ReportsModule = {
  ReportsPanel: lazy(() => import('./components/features/ReportsPanel')),
  useReports: () => import('./hooks/useReports'),
  ExportService: () => import('./lib/export')
}
```

### Memoization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handle click
}, [dependency])
```

---

## 📁 File Organization

```
src/
├── app/                    # Next.js app router
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # UI Components
│   ├── ui/               # Basic UI components
│   ├── features/         # Feature-specific components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── index.ts          # Component exports
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   ├── useDashboard.ts   # Dashboard hook
│   └── index.ts          # Hook exports
├── lib/                  # Core business logic
│   ├── auth.ts           # Authentication service
│   ├── export.ts         # Export functionality
│   └── health-monitor.ts # Health monitoring
├── services/             # Background services
│   ├── cron-service.ts   # Scheduled jobs
│   ├── notification.ts   # Notifications
│   └── service-manager.ts # Service orchestration
├── utils/                # Utility functions
│   ├── core.ts           # Core utilities
│   ├── date.ts           # Date utilities
│   └── index.ts          # Utility exports
├── types/                # TypeScript definitions
│   ├── auth.ts           # Authentication types
│   ├── employee.ts       # Employee types
│   └── index.ts          # Type exports
└── index.ts              # Main module exports
```

---

## 🚀 Getting Started

### Quick Start
```bash
# Clone and setup
git clone <repository>
cd mansoura-attendance-system
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your configuration

# Database setup
npm run db:generate
npm run db:push
npm run db:seed

# Start development
npm run dev
```

### Module Development
```bash
# Check module health
npm run check:modules

# Run health check
npm run health:check

# Run tests
npm run test
npm run test:e2e
```

---

## 📝 Best Practices

### 1. **Module Boundaries**
- Keep modules focused on single responsibilities
- Minimize dependencies between modules
- Use interfaces to define contracts

### 2. **Import Strategy**
- Use index files for clean imports
- Prefer named exports over default exports
- Group related imports together

### 3. **Component Design**
- Make components reusable and composable
- Use TypeScript for prop validation
- Include proper documentation

### 4. **Service Architecture**
- Keep services stateless when possible
- Use dependency injection for testability
- Handle errors gracefully

### 5. **Performance**
- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize bundle size

---

## 🔧 Troubleshooting

### Common Issues

**Module not found errors:**
```bash
# Check if module is properly exported
npm run check:modules

# Verify import paths
npm run type-check
```

**Service initialization errors:**
```bash
# Check service health
npm run health:check

# View service logs
npm run dev
```

**Performance issues:**
```bash
# Analyze bundle
npm run analyze

# Check for memory leaks
npm run test:coverage
```

---

## 📚 Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [React Patterns](https://reactpatterns.com/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Testing Library](https://testing-library.com/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Architecture**: Modular Next.js with TypeScript 
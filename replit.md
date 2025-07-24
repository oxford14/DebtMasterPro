# DebtMaster Pro - Replit.md

## Overview

DebtMaster Pro is a comprehensive debt management and budget planning web application built with a modern tech stack. The application features a glossy, sleek UI with a black and orange theme, designed to help users track debts, manage budgets, schedule payments, and visualize financial progress through interactive reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Simple session-based auth with in-memory session storage
- **API Design**: RESTful API with structured error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Client Storage**: localStorage for authentication tokens

## Key Components

### Database Schema
The application uses four main tables:
- **users**: User authentication and profile data
- **debts**: Flexible debt tracking with balance, optional interest rates, and customizable payment schedules
- **budgetItems**: Income and expense categorization with essential/fixed flags
- **payments**: Payment history and tracking

#### Enhanced Debt Management Features
- **Flexible Debt Types**: Support for formal debts (credit cards, loans) and informal loans (family/friends)
- **Optional Due Dates**: Some debts have no due dates (personal loans without interest)
- **Payment Plan Flexibility**: Monthly, weekly, or no payment plan options
- **Creditor Information**: Optional creditor/person name for personal loans
- **Interest Rate Options**: Supports 0% interest for informal loans
- **Notes Field**: Additional details about debt arrangements

### Authentication System
- Simple username/password authentication
- Session-based auth with server-side session storage
- Client-side token storage using localStorage
- Protected routes with authentication middleware

### UI Theme System
- Black and orange glossy theme with glassmorphism effects
- CSS custom properties for consistent theming
- Responsive design with mobile-first approach
- Custom components: GlassCard, GlossyButton, FloatingActionButton

### Pages and Features
- **Dashboard**: Financial overview with summary cards and charts
- **Debts**: Debt management with CRUD operations and progress tracking
- **Budget**: Income/expense tracking with categorization
- **Calendar**: Payment due dates and financial calendar view
- **Reports**: Data visualization with charts and debt payoff projections

## Data Flow

1. **Authentication Flow**: User login → Session creation → Token storage → API requests with auth headers
2. **Data Fetching**: React Query handles API calls, caching, and background updates
3. **Form Submissions**: React Hook Form → Zod validation → API mutations → Cache invalidation
4. **Real-time Updates**: Query invalidation triggers automatic UI updates

## External Dependencies

### UI and Styling
- **@radix-ui/***: Accessible UI primitives (dialogs, forms, navigation)
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **recharts**: Chart library for data visualization

### Data and State Management
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM
- **zod**: Schema validation
- **react-hook-form**: Form state management

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Development server and build tool

## Deployment Strategy

### Development
- Local development uses Vite dev server with hot module replacement
- Database migrations managed via Drizzle Kit
- Environment variables for database connection

### Production Build
- Vite builds optimized client bundle to `dist/public`
- esbuild compiles server code to `dist/index.js`
- Single deployment artifact with both client and server code

### Database Management
- PostgreSQL database hosted on Neon Database
- Schema changes applied via `npm run db:push`
- Connection string managed via `DATABASE_URL` environment variable

### Key Architectural Decisions

1. **Monorepo Structure**: Client, server, and shared code in single repository for easier development
2. **Type Safety**: Full TypeScript coverage with shared types between client and server
3. **Component Library**: shadcn/ui for consistent, customizable components
4. **State Management**: React Query eliminates need for global state management
5. **Authentication**: Simple session-based auth suitable for MVP, can be upgraded to JWT later
6. **Database**: PostgreSQL chosen for ACID compliance and complex financial calculations
7. **Styling**: Tailwind + CSS variables for maintainable theming system
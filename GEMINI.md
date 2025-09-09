# Project Overview

This is a modern, location-based attendance management system using Telegram bot integration, built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Key Technologies

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **ORM:** Prisma
*   **Database:** PostgreSQL
*   **UI:** Tailwind CSS, Headless UI, Recharts
*   **State Management:** Zustand
*   **Telegram Bot:** Telegraf

## Architecture

The project follows a modular architecture with a clear separation of concerns. The `src` directory contains the main application code, including the Next.js pages, API routes, components, and business logic. The `prisma` directory contains the database schema, and the `scripts` directory contains setup and utility scripts.

# Building and Running

## Prerequisites

*   Node.js 18+ and npm/yarn
*   PostgreSQL database
*   Telegram Bot Token (from @BotFather)

## Installation

1.  **Clone and setup**
    ```bash
    git clone <repository-url>
    cd mansoura-attendance-system
    npm install
    ```

2.  **Environment Configuration**
    ```bash
    cp .env.example .env
    ```
    Edit `.env` with your configuration.

3.  **Database Setup**
    ```bash
    # Generate Prisma client
    npx prisma generate

    # Run database migrations
    npx prisma db push

    # Optional: Add sample data
    npx prisma db seed
    ```

4.  **Start Development Server**
    ```bash
    npm run dev
    ```

## Testing

*   **Run type checking:** `npm run type-check`
*   **Run linting:** `npm run lint`
*   **Run unit tests:** `npm run test`
*   **Run end-to-end tests:** `npm run test:e2e`

# Development Conventions

*   **Coding Style:** The project uses Prettier for code formatting and ESLint for linting.
*   **Testing:** The project uses Jest for unit testing and has end-to-end tests.
*   **Commits:** The project does not have a formal commit message convention, but the commit history shows a preference for descriptive messages.
*   **Branching:** The project does not have a formal branching strategy, but the commit history suggests a feature-branch workflow.

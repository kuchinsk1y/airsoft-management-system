# StrikeShop: Modern E-commerce, Marketplace & Event Platform

   <p align="center">
     <a href="https://www.strikeshopaction.org.ua/" target="_blank"><img src="https://img.shields.io/badge/production-live-brightgreen" alt="Production Site" /></a>
     <a href="https://strike-shop-admin.vercel.app/" target="_blank"><img src="https://img.shields.io/badge/admin-live-blue" alt="Admin Panel" /></a>
   </p>

---

## Executive Summary

StrikeShop is a scalable, production-ready monorepo platform for e-commerce, event management, and user communities. It powers a real-world airsoft marketplace and event ecosystem, but is architected to be adaptable for any marketplace, SaaS, or community-driven scenario. The platform features a modular backend, a modern public web app, and a powerful admin dashboard.

---

## UI/UX Design (Figma)

- [Figma Designs (User)](https://www.figma.com/design/aR4notbkqakK07WJhHDoUs/Untitled?node-id=0-1&p=f&t=ZTUwArNocThoRuZU-0)

The link includes layouts for user-facing, showcasing the visual style and UX approach of the platform.

---

## Table of Contents

1.  [Executive Summary](#executive-summary)
3.  [Monorepo Architecture](#monorepo-architecture)
4.  [Technology Stack](#technology-stack)
5.  [Key Features](#key-features)
6.  [Application Modules](#application-modules)
7.  [Getting Started](#getting-started)
8.  [Deployment](#deployment)
9.  [Database & Migrations](#database--migrations)
10. [Scripts & Dev Experience](#scripts--dev-experience)
11. [Documentation](#documentation)
12. [Demo Credentials](#demo-credentials)
14. [License](#license)

---

## Monorepo Architecture

The repository is organized as a monorepo using npm workspaces, containing three main applications:

- **API** (`apps/api`): TypeScript, NestJS, Prisma ORM, PostgreSQL/MongoDB. Modular, scalable backend with RESTful API, authentication, ACL, business logic, and integrations (email, SMS, payments).
- **Web** (`apps/web`): Next.js, React, Tailwind CSS. Public-facing storefront, user registration, product catalog, orders, ratings, and personal accounts.
- **Admin** (`apps/admin`): Next.js, React, TanStack Query, Chart.js, TinyMCE. Advanced admin dashboard for content, user, event, and rating management.
- **Shared Config**: Centralized configuration and scripts for consistency and DRY principles.
- **Infrastructure**: Docker Compose for local development, Vercel for frontend deployment, Prisma for DB migrations.

---

## Technology Stack

- **Frontend:** Next.js, React 19, Tailwind CSS, Zustand, Zod, Radix UI, Chart.js, TinyMCE
- **Backend:** NestJS 11, TypeScript, Prisma ORM, PostgreSQL, MongoDB, JWT, SendGrid
- **DevOps:** Docker Compose, Vercel, Prisma Migrations, ESLint, Prettier
- **Other:** REST API, class-validator, TanStack Query, Papaparse, Framer Motion

---

## Key Features

- Event & Tournament Management
- E-commerce: Product catalog, orders, payments (integration-ready)
- Advanced Rating System: Player, team, and organizer leaderboards
- User & Team Management: Registration, profiles, statistics, rosters
- Content Management: News, gallery, rich content editing (TinyMCE)
- Admin Panel: Full CRUD for users, events, products, ratings, and more
- Notifications: Email (SendGrid), SMS-ready
- Authentication & ACL: JWT, role-based access, multi-level permissions
- Responsive UI/UX: Mobile-first, accessible, modern design
- RESTful API: Well-documented, modular endpoints
- Dev Experience: Monorepo, strict linting, type safety, modular codebase

---

## Application Modules

### API (NestJS, Prisma, PostgreSQL/MongoDB)

- Modular structure: each business domain (users, teams, events, products, orders, ratings, comments, notifications, payments, etc.) is a separate module with its own controller, service, DTOs, and interfaces.
- Authentication: JWT, OAuth (Google, Facebook), role-based access, ACL guards, custom decorators.
- Integrations: Email (SendGrid), SMS (multiple providers), payments (LiqPay), file storage, Prisma ORM, Swagger API docs.
- Database: Prisma schema with rich enums, relations, migrations, and seed scripts for demo and production data.
- Security: API key guard, password strength validation, exception filters, environment-based config.

### Web (Next.js, React, Tailwind CSS)

- Modern, responsive storefront and user portal.
- Pages: events, products, checkout, registration, login, profile, teams, ratings, news, gallery, legal, FAQ, and more.
- State management: Zustand, React Context.
- Forms: React Hook Form, Zod validation.
- SEO: Dynamic metadata, sitemap, robots, Open Graph, structured data.
- UI: Custom component library, Radix UI, Tailwind CSS, icons, modals, toasts.

### Admin (Next.js, React, TanStack Query, Chart.js, TinyMCE)

- Advanced dashboard for managing all business entities: users, teams, events, products, orders, ratings, news, gallery, workshop items, etc.
- Rich content editing: TinyMCE integration for WYSIWYG editing.
- Data visualization: Chart.js, custom dashboards, statistics, leaderboards.
- Import/export: CSV import/export for bulk data management.
- Modular, maintainable codebase with clear separation of concerns.

---

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kuchinsk1y/airsoft-management-system.git
    cd airsoft-management-system
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Configure environment variables**
    ```bash
    cp apps/api/env.example apps/api/.env
    cp apps/web/env.example apps/web/.env
    cp apps/admin/env.example apps/admin/.env
    ```
4.  **Start local databases**
    ```bash
    docker-compose up -d
    ```
5.  **Run the platform**
    ```bash
    npm run dev
    ```

    - API: http://localhost:3101
    - Web: http://localhost:3100
    - Admin: http://localhost:3200

---

## Deployment

- **Web & Admin:** Deployed to Vercel (see links above)
- **API:** Deployable to any Node.js-compatible host (Docker, Vercel, AWS, etc.)
- **Databases:** PostgreSQL & MongoDB (cloud or self-hosted)

---

## Database & Migrations

Prisma ORM is used for database schema and migrations. See `prisma/schema.prisma` and `apps/api/prisma/migrations` for details.

Common commands:

```bash
# Create and apply a new migration
npm run prisma:migrate:dev --workspace=api -- --name migration_name

# Apply existing migrations
npm run prisma:migrate:deploy --workspace=api

# Generate Prisma Client
npm run prisma:generate --workspace=api

# Open Prisma Studio (DB GUI)


# Seed database with test data
npm run setup:db --workspace=api
```

---

## Scripts & Dev Experience

- **Monorepo scripts:** Unified dev, build, lint, and test commands
- **Custom seeds:** Easily populate DB with demo or production data
- **Strict linting & formatting:** ESLint, Prettier, TypeScript everywhere
- **CI/CD ready:** Vercel config, Docker Compose, environment separation

---

## Documentation

- **Rating System:** See `RATING_SYSTEM_EXPLANATION.md`, `RATING_SYSTEM_IMPLEMENTATION.md`, `RATING_SYSTEM_PROPOSAL.md`
- **API Docs:** Swagger available in API app (see `/apps/api`)
- **Environment:** Example `.env` files in each app

---

## Demo Credentials

```
Email:    admin@example.com
Password: Passw0rd!
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

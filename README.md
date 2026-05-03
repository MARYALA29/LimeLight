# LimeLight

A modern task management application inspired by Jira, built with Next.js 14 and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma](https://img.shields.io/badge/Prisma-5.20-2D3748)

## Features

- **Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **Project Management**: Create and manage multiple projects
- **Kanban Board**: Drag-and-drop task management with customizable columns
- **Task Management**: Create, edit, delete, and move tasks between statuses
- **Team Collaboration**: Add team members to projects
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT task priorities
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **dnd-kit** - Drag and drop functionality
- **React Hook Form + Zod** - Form handling and validation
- **TanStack Query** - Server state management

### Backend
- **Next.js API Routes** - REST API endpoints
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **jose** - JWT token handling

### Testing
- **Jest** - Test runner
- **React Testing Library** - Component testing

## Prerequisites

- Node.js 18.17.0 or higher
- Docker and Docker Compose (for PostgreSQL)
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/MARYALA29/LimeLight.git
cd LimeLight
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/limelight?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 4. Start PostgreSQL database

```bash
docker compose up -d
```

### 5. Set up the database

```bash
# Push the schema to the database
npm run db:push

# Seed the database with demo data
npm run db:seed
```

### 6. Start the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding the database, you can log in with:

- **Email**: `demo@example.com`
- **Password**: `password123`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Testing

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Coverage threshold (CI gate)

CI runs `npm run test:coverage` on every pull request. The job fails if any of
the four global metrics (lines, branches, functions, statements) fall below
the configured threshold. Thresholds live in
[`jest.config.js`](./jest.config.js) under `coverageThreshold.global`, so the
same gate fires locally too.

The current threshold is **35%** across all four metrics. This matches the
project's current baseline and will be ratcheted up toward the long-term
target of **80%** as more pages and API routes gain test coverage. See issue
#6 for the ratchet plan.

A coverage summary is posted as a PR comment on every push and updated in
place by the
[MishaKav/jest-coverage-comment](https://github.com/MishaKav/jest-coverage-comment)
action.

### Test Structure

```
src/__tests__/
├── components/
│   ├── Button.test.tsx          # Button component tests
│   ├── TaskDetailModal.test.tsx # Task modal tests
│   └── TaskPage.test.tsx        # Task page tests
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Protected dashboard pages
│   │   └── projects/
│   │       ├── [id]/            # Project board view
│   │       │   └── tasks/[taskId]/  # Task detail page
│   │       └── new/             # Create project
│   └── api/                     # API routes
│       ├── auth/
│       ├── projects/
│       └── tasks/
├── components/
│   ├── board/                   # Kanban board components
│   ├── projects/                # Project-related components
│   ├── tasks/                   # Task-related components
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── auth.ts                  # Authentication utilities
│   ├── prisma.ts                # Prisma client
│   ├── utils.ts                 # Helper functions
│   └── validations.ts           # Zod schemas
└── types/
    └── index.ts                 # TypeScript types
```

## Database Schema

The application uses the following main models:

- **User** - User accounts
- **Project** - Projects/workspaces
- **ProjectMember** - Project membership (with roles)
- **Status** - Task statuses (columns)
- **Task** - Individual tasks

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/[id]` | Get project details |
| PATCH | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/tasks` | List project tasks |
| POST | `/api/projects/[id]/tasks` | Create task |
| GET | `/api/tasks/[id]` | Get task details |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |
| PATCH | `/api/tasks/[id]/move` | Move task (change status/order) |

## License

This project is private and proprietary.

---

Built with Next.js and PostgreSQL

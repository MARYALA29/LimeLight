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
| GET | `/api/auth/me` | Get current user (accepts session cookie or PAT) |

### Personal Access Tokens (PATs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/tokens` | List the current user's active tokens (session-only) |
| POST | `/api/users/me/tokens` | Create a token, returning the raw value once (session-only) |
| DELETE | `/api/users/me/tokens/[id]` | Revoke a token (session-only) |

#### Token format

Tokens look like `ll_pat_<32 random base64url bytes>`. The `ll_pat_`
prefix is identifiable in logs and lets us reject obvious garbage before
hitting the database. Only a sha256 hash of the token is persisted —
the raw token is shown to the user exactly once at creation time.

#### Authenticating an API request

Send the token in the `Authorization` header:

```
Authorization: Bearer ll_pat_<your-token>
```

PATs grant the same access as the user's UI session. The two exceptions
are the PAT-management endpoints themselves (create/list/revoke), which
require a session cookie so a stolen PAT cannot mint or revoke other
tokens. Revoked tokens are immediately invalid (401).

#### Security notes

- **sha256, not bcrypt**: PATs are 256-bit random secrets — they are not
  guessable by dictionary attack, so a fast deterministic hash is
  appropriate. bcrypt would also make every PAT-authenticated request
  ~100 ms slower.
- **Constant-time comparison**: hash verification uses
  `crypto.timingSafeEqual` to avoid leaking the stored hash via timing
  side channels.
- **Rate limiting**: token creation is capped at 10 per rolling hour
  per user (in-memory; per-process for v1).
- **Last-used timestamps** are updated at most once per minute per token
  to keep auth path fast.

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

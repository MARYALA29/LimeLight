# LimeLight - Claude Code Instructions

## Project Overview

LimeLight is a Jira-like task management application built with Next.js 14, PostgreSQL, and Prisma. See [README.md](./README.md) for full project documentation.

## Development Preferences

### Test-Driven Development (TDD) - REQUIRED

**Always use the `/tdd` skill when adding features or fixing bugs.** No exceptions.

The TDD workflow:
1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

#### What to test
- **Every new component**: Render, user interactions, state changes, edge cases
- **Every API route**: Success cases, error cases, auth checks, validation
- **Every hook**: All return values and side effects
- **Every utility function**: Happy path + edge cases
- **Every bug fix**: Write a test that reproduces the bug FIRST, then fix it

#### When NOT to ship
- Do not ship code without corresponding tests
- Do not skip tests because "it's a small change"
- Do not mark a task complete until `npm test` passes

#### Coverage gate (enforced by CI)

CI runs `npm run test:coverage` on every PR. Jest is configured with a global
`coverageThreshold` in `jest.config.js`, so the build fails (locally and in
CI) if total **lines / branches / functions / statements** drop below the
threshold. The long-term target is **80%**; the current floor is **35%** and
will ratchet up over time. Bias toward writing the tests rather than lowering
the threshold.

### Tech Stack Notes

- **Next.js 14** (NOT Next.js 16 — params handling differs)
- **Client components** use `useParams()` from `next/navigation` — params is NOT a Promise
- **Server components** can `await params` when typed as `Promise<{...}>`
- **Tailwind CSS 3** with custom orange theme (see `tailwind.config.ts`)

### File Organization

- Tests live in `src/__tests__/` mirroring the source structure
- API routes in `src/app/api/`
- Page components in `src/app/(auth)/` and `src/app/(dashboard)/`
- Reusable UI in `src/components/ui/`
- Feature components in `src/components/{board,projects,tasks}/`

### Style Preferences

- **Theme**: Orange color palette (primary: `#F97316`, secondary: `#FB923C`)
- **Branding**: Always "LimeLight" (never "JiraClone" or "Jira Clone")
- **UI**: Modern, rounded corners (rounded-xl, rounded-2xl), gradient buttons, soft shadows

## Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Lint check

# Database
docker compose up -d     # Start PostgreSQL
npm run db:push          # Push schema
npm run db:seed          # Seed demo data
npm run db:studio        # Prisma Studio

# Testing (RUN AFTER EVERY CHANGE)
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

## Demo Credentials

- Email: `demo@example.com`
- Password: `password123`

## Common Pitfalls to Avoid

1. **Don't use `params.then()` in client components** — use `useParams()` from `next/navigation`
2. **Don't forget to `forwardRef`** when mocking components in tests that use refs
3. **Don't run `git push --force`** to main without explicit permission
4. **Don't skip writing tests** — this is non-negotiable for this project

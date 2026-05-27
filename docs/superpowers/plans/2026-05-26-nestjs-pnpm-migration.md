# NestJS pnpm Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the backend fully to NestJS and migrate both backend and frontend from npm lockfiles to pnpm while preserving the current frontend API contract.

**Architecture:** Keep the domain/application/infrastructure layers, replace the Express bootstrap/router layer with NestJS modules, controllers, guards, pipes, and a Socket.IO gateway. Preserve `/api` routes, Prisma schema, Redis behavior, static `/uploads`, CORS, Helmet, body size, JWT auth, roles, Zod validation, and rate limits.

**Tech Stack:** NestJS, TypeScript, Prisma, MySQL, Redis/ioredis, Socket.IO, Zod, pnpm, Vitest, Next.js.

---

### Task 1: Baseline and Contract Tests

**Files:**
- Create: `src/presentation/routes.contract.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add route-contract test that imports route definitions indirectly**

Create a test that documents key current routes from `src/presentation/routes.ts`. The test should fail if routes disappear during migration.

- [ ] **Step 2: Run test to verify current baseline**

Run: `npm test -- src/presentation/routes.contract.test.ts`
Expected: PASS against current Express route file.

- [ ] **Step 3: Commit baseline test**

Commit only the contract test.

### Task 2: Install NestJS and pnpm Backend Dependencies

**Files:**
- Modify: `package.json`
- Remove: `package-lock.json`
- Create: `pnpm-lock.yaml`
- Modify: `tsconfig.json`

- [ ] **Step 1: Update backend package scripts**

Change scripts to use Nest-friendly entrypoints:
- `dev`: `nest start --watch`
- `build`: `nest build`
- `start`: `node dist/main.js`
- `start:dev`: `nest start --watch`
- `lint`: existing ESLint command adjusted if needed
- `test`: `vitest`

- [ ] **Step 2: Add NestJS packages**

Add runtime dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `reflect-metadata`, `rxjs`.

Add dev dependency: `@nestjs/cli`.

- [ ] **Step 3: Generate pnpm lock**

Run: `pnpm install`
Expected: `pnpm-lock.yaml` is generated and dependencies install.

### Task 3: NestJS Bootstrap and Shared Infrastructure

**Files:**
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Create: `src/shared/prisma/prisma.module.ts`
- Create: `src/shared/prisma/prisma.service.ts`
- Create: `src/shared/auth/auth.types.ts`
- Create: `src/shared/auth/jwt-auth.guard.ts`
- Create: `src/shared/auth/roles.decorator.ts`
- Create: `src/shared/auth/roles.guard.ts`
- Create: `src/shared/validation/zod-validation.pipe.ts`
- Create: `src/shared/rate-limit/rate-limit.middleware.ts`
- Create: `src/shared/background/stats-sync.provider.ts`
- Keep temporarily: `src/server.ts` until build scripts no longer use it.

- [ ] **Step 1: Write bootstrap smoke test**

Add or update a test that expects `AppModule` to be importable and `/api/health` to exist after migration.

- [ ] **Step 2: Run test and watch it fail**

Run: `pnpm test`
Expected: FAIL because Nest files do not exist yet.

- [ ] **Step 3: Implement Nest bootstrap**

Create `main.ts` with `NestFactory`, global prefix `/api`, Helmet, CORS from `FRONTEND_URL`, JSON body limit `50mb`, static `/uploads`, and port `PORT || 3001`.

- [ ] **Step 4: Implement shared providers**

Create Prisma provider, auth guards, role guard, Zod pipe, rate-limit middleware wrapper, and stats-sync lifecycle provider.

- [ ] **Step 5: Run build/test**

Run: `pnpm build` and `pnpm test`.

### Task 4: Migrate Route Groups to NestJS Modules

**Files:**
- Create: `src/modules/health/health.controller.ts`
- Create: `src/modules/health/health.module.ts`
- Create: `src/modules/auth/auth.controller.ts`
- Create: `src/modules/auth/auth.module.ts`
- Create: `src/modules/users/users.controller.ts`
- Create: `src/modules/users/users.module.ts`
- Create: `src/modules/admin-config/admin-config.controller.ts`
- Create: `src/modules/admin-config/admin-config.module.ts`
- Create: `src/modules/system-config/system-config.controller.ts`
- Create: `src/modules/system-config/system-config.module.ts`
- Create: `src/modules/public-config/public-config.controller.ts`
- Create: `src/modules/public-config/public-config.module.ts`
- Create: `src/modules/events/events.controller.ts`
- Create: `src/modules/events/events.module.ts`
- Create: `src/modules/orders/orders.controller.ts`
- Create: `src/modules/orders/orders.module.ts`
- Create: `src/modules/followers/followers.controller.ts`
- Create: `src/modules/followers/followers.module.ts`
- Create: `src/modules/images/images.controller.ts`
- Create: `src/modules/images/images.module.ts`
- Create: `src/modules/statistics/statistics.controller.ts`
- Create: `src/modules/statistics/statistics.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Add failing controller route contract tests**

Update contract tests so expected Nest route metadata exists for all current routes.

- [ ] **Step 2: Run tests and watch them fail**

Run: `pnpm test`
Expected: FAIL because modules/controllers are missing.

- [ ] **Step 3: Create Nest controllers that preserve paths**

Use decorators matching every current route from `src/presentation/routes.ts`. Controllers may initially delegate to existing controller classes through `@Req()`/`@Res()` to preserve response behavior.

- [ ] **Step 4: Replace Express middleware usage with guards/pipes/middleware**

Apply auth guard, roles guard, validation pipe, and rate-limit middleware equivalent at matching endpoints.

- [ ] **Step 5: Run route contract tests**

Run: `pnpm test`
Expected: PASS.

### Task 5: Socket.IO Gateway

**Files:**
- Create: `src/modules/sockets/socket.gateway.ts`
- Create: `src/modules/sockets/sockets.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Add gateway metadata test**

Test that the gateway handles `join_event` and `join_artist`.

- [ ] **Step 2: Run test and watch it fail**

Run: `pnpm test`
Expected: FAIL before gateway exists.

- [ ] **Step 3: Implement gateway**

Use Nest WebSocket gateway with CORS matching `FRONTEND_URL`. Preserve room names `event:${eventId}` and `artist:${artistId}` and initialize `SocketService`.

- [ ] **Step 4: Run tests**

Run: `pnpm test`.

### Task 6: Remove Express Bootstrap and Finish Backend NestJS Migration

**Files:**
- Delete: `src/server.ts`
- Delete or deprecate: `src/presentation/routes.ts`
- Keep: existing legacy controller classes only if Nest controllers delegate to them.
- Modify: `README.md`

- [ ] **Step 1: Ensure no production import uses Express router bootstrap**

Run: `rg "presentation/routes|src/server|express\\(" src package.json`
Expected: no active bootstrap/router references.

- [ ] **Step 2: Remove old bootstrap/router files**

Delete obsolete Express bootstrap/router files after Nest routes are in place.

- [ ] **Step 3: Build and test**

Run: `pnpm build`, `pnpm lint`, and `pnpm test`.

### Task 7: Frontend npm to pnpm

**Files in `c:\Github Projects\feelinartist-frontend`:**
- Remove: `package-lock.json`
- Create: `pnpm-lock.yaml`
- Modify: `package.json` if package manager metadata is useful.
- Modify: `README.md`

- [ ] **Step 1: Generate pnpm lock**

Run: `pnpm install` in the frontend project.

- [ ] **Step 2: Remove npm lock**

Delete `package-lock.json`.

- [ ] **Step 3: Verify frontend**

Run: `pnpm lint` and `pnpm build`.

### Task 8: Final Cross-Project Verification

**Files:**
- Modify docs as needed.

- [ ] **Step 1: Backend verification**

Run in backend: `pnpm build`, `pnpm lint`, `pnpm test`.

- [ ] **Step 2: Frontend verification**

Run in frontend: `pnpm lint`, `pnpm build`.

- [ ] **Step 3: Review git status**

Run `git status --short` in both repositories and confirm only intended files changed.

# NestJS and pnpm Migration Design

## Goal

Migrate the backend from the current Express + npm setup to NestJS + pnpm while preserving the existing frontend contract. The migrated API must keep the current `/api` route prefix, route paths, request payloads, response shapes, authentication behavior, file serving, Socket.IO events, Prisma schema, and Redis-backed behavior.

## Current Context

The backend is a TypeScript Node.js service using Express, Prisma with MySQL, Redis, Socket.IO, Zod validation, JWT authentication, rate limiting, static upload serving, and a Clean Architecture-inspired folder layout. Routes are currently centralized in `src/presentation/routes.ts`, backed by controller classes under `src/presentation/controllers`, use cases under `src/application`, domain types and schemas under `src/domain`, and infrastructure adapters under `src/infrastructure`.

## Recommended Approach

Use a complete NestJS migration with behavior preservation. Build real Nest modules and controllers rather than temporarily wrapping the old Express router. Keep the existing domain, application, and infrastructure logic where it is still useful, then adapt the presentation layer to NestJS controllers, guards, providers, pipes, and gateways.

This approach gives the project a clean NestJS foundation while avoiding frontend changes.

## Non-Goals

- Do not redesign frontend-facing routes.
- Do not change the Prisma schema unless required by NestJS integration, which is not expected.
- Do not change database migrations or seed behavior beyond package-manager script updates.
- Do not rewrite business logic unless required to preserve behavior in NestJS.
- Do not introduce a new authentication model.

## Target Structure

```txt
src/
  main.ts
  app.module.ts
  modules/
    auth/
    users/
    admin-config/
    system-config/
    events/
    orders/
    followers/
    images/
    statistics/
    public-config/
    sockets/
  shared/
    prisma/
    redis/
    auth/
    validation/
    rate-limit/
  domain/
  application/
  infrastructure/
```

The exact file layout can vary slightly during implementation if the existing code suggests a cleaner local fit, but the final structure should use NestJS modules as the primary presentation and dependency boundary.

## Route Compatibility

Set a global prefix of `/api` in `main.ts`. Preserve all existing routes currently registered in `src/presentation/routes.ts`, including:

- `GET /api/health`
- auth routes such as `POST /api/auth/login`
- user routes under `/api/usuarios`
- public config routes under `/api/config`
- internal config route `/api/internal/config/auth`
- event routes under `/api/eventos`
- order routes under `/api/pedidos`
- image routes under `/api/imagenes`
- statistics routes under `/api/estadisticas`
- admin routes under `/api/admin`

Responses should remain compatible with the existing frontend. Any unavoidable response change must be called out before implementation.

## NestJS Components

- `main.ts`: bootstrap Nest app, configure CORS, Helmet, body size limit, global prefix, static uploads, and startup port.
- `AppModule`: import feature modules and shared infrastructure modules.
- Feature modules: expose controllers and providers for each current route group.
- Controllers: replace Express `Request`/`Response` handlers with Nest route decorators where practical.
- Services/use cases: reuse current application services and use cases as providers.
- Guards: replace JWT and role middleware with `JwtAuthGuard` and role guard equivalents.
- Validation: preserve existing Zod schemas through a custom Nest pipe at first.
- Rate limiting: use Nest-compatible middleware or guards to preserve current auth and upload limits.
- Socket gateway: replace manual Socket.IO connection setup with a Nest gateway preserving `join_event` and `join_artist`.
- Background jobs: start the stats sync service through a Nest lifecycle hook.

## pnpm Migration

- Replace npm workflow with pnpm.
- Remove `package-lock.json`.
- Add `pnpm-lock.yaml`.
- Update scripts to support `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test`, and `pnpm lint`.
- Keep Prisma seed support.
- Update README setup instructions and any docs that mention npm commands.

## Error Handling

Create a small compatibility layer for errors so NestJS exceptions do not unexpectedly change common response shapes. Existing controller-level error behavior should be reviewed route by route. Where current behavior is inconsistent, preserve compatibility first and only normalize after the migration is stable.

## Testing and Verification

Minimum verification before considering the migration complete:

- `pnpm install`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- Smoke check server startup
- Smoke check representative public, authenticated, admin, upload, and Socket.IO paths

Add focused tests or route smoke tests where behavior is at risk, especially auth, role guard, Zod validation, rate limits, and route prefix handling.

## Risks

- Route or response drift could break the frontend.
- NestJS exception handling may alter error responses if not controlled.
- Guards and request-user typing may differ from Express middleware behavior.
- Socket.IO migration could change room naming or connection CORS behavior.
- Body size, static uploads, and CORS settings must be explicitly carried over.
- Package-manager migration may affect lockfile resolution.

## Rollout Plan

Implement on the current branch with careful staged verification. Keep the Prisma schema and business logic stable while replacing bootstrapping, routing, middleware, and package-manager wiring. Commit only intentional changes and avoid touching unrelated local modifications.

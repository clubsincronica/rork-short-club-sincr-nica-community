# AGENTS.md — App Club Sincrónica (Rork / Expo)

App de comunidad/coworking **Club Sincrónica**: Discover, Near-me (mapa), Services,
Messages, Profile/Admin; espacios/subespacios con reservas (slot grid), carrito y
pagos, notificaciones, QR. Generada con Rork, en desarrollo activo.

## Directorios canónicos

- **Este dir (`rork-short-club-sincr-nica-community-main`, branch `master`) = ÚNICO
  working copy activo.** Remoto: https://github.com/clubsincronica/rork-short-club-sincr-nica-community
- El dir hermano SIN sufijo (`rork-short-club-sincr-nica-community`, branch
  `add/react-18`) es el **scaffold Rork congelado** (Expo 53, oct-2025). NO trabajar ahí.

## Stack

- **Frontend:** Expo SDK 57 · React Native 0.86 · React 19 · expo-router 57 (file-based,
  tabs en `app/(tabs)/`) · NativeWind 4 · Zustand · TanStack Query · Stripe RN ·
  socket.io-client · react-native-maps.
- **Backend (`backend/`):** Express 4 + TypeScript · SQLite (dev) → **Postgres (prod)** ·
  auth JWT propia (NO Firebase/Supabase) · Stripe webhook + OAuth Mercado Pago
  (`routes/oauth-mp.ts`, `routes/webhooks.ts`) · deploy Railway/Render (`Dockerfile`,
  `render.yaml`, `.railwayignore`) · CI: `.github/workflows/{backend-ci,railway-migrate,test-simple}.yml`.

## Comandos

```bash
# Frontend (raíz)
npm start            # rork start (tunnel)   · npm run lint = expo lint
npm run android      # expo run:android

# Backend (dentro de backend/)
npm run dev          # ts-node-dev src/server.ts
npm test             # jest — 13 archivos (overlap guards, double-booking, slots)
npm run build && npm start
npm run db:init                # SQLite dev
npm run migrate:pg             # SQLite → Postgres (prod)
npm run migrate:roles          # add-roles
npm run create:superuser
```

## Workflow (superpowers)

- Spec/plan **antes** de código, en `docs/superpowers/specs|plans/YYYY-MM-DD-*-design.md`
  (ej: `2026-08-17-cowork-guest-booking-design.md`).
- Skills globales con más valor en este repo (instaladas 2026-10-08):
  `security-and-hardening` (JWT/Stripe/OWASP), `api-and-interface-design`,
  `frontend-ui-engineering`, `shipping-and-launch`, `observability-and-instrumentation`,
  `expo-router`, `expo-data-fetching`, `expo-native-ui`, `react-native-best-practices`.
- Repaso antes de merge: `code-review` + tests backend en verde.

## Reglas duras

1. **NUNCA commit de secretos.** Ya se removeron en `8fe052f chore(security)`; `.env`
   fuera de git (mapeo de secretos: `SECRETS-MAP.md` en el repo raíz Default Project).
2. **Postgres es prod, SQLite solo dev.** Schema changes → migración en
   `backend/src/scripts/` + `migrate:pg`, nunca a mano en la DB.
3. Tests de reservas/overlap **no se tocan para "dejar verde"** — son el guard de
   double-booking; si fallan, hay un bug real.
4. Estructura de rutas = expo-router; no inventar router propio ni navigation extra.
5. Archivos residuales de la raíz (`'`, `cd`, `npx`, `out.txt`, `install.log`,
   `conversation-summary.txt`, pedidos/pressupuestos personales) NO versionar ni borrar
   sin confirmación — son de sesiones previas.

## Docs clave

- `documentation/BACKEND_REFERENCE.md` · `backend/README.md` · `backend/DEPLOYMENT.md`
- Specs/planes: `docs/superpowers/` · checklist E2E: ver commits Task 13-15
- Estado del ecosistema (pipelines, DO-NOT-REPEAT globales): repo raíz `Default Project/PIPELINE-STATE.md`

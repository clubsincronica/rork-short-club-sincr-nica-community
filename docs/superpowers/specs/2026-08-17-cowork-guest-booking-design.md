# Co-Work: Guest Discovery & Booking — Design Spec

Fecha: 2026-08-17
Estado: aprobado para implementación
Repositorio: `rork-short-club-sincr-nica-community-main`

## Resumen

Convertir la modalidad Co-Work (alquiler de sub-espacios por hora/día/semana/
mes) de un prototipo local (AsyncStorage, `cowork-detail.tsx` huérfano) en un
flujo completo guest+owner respaldado por backend: descubrimiento desde el tab
Discover, motor de disponibilidad por grilla de franjas, reserva Instant/Request,
pagos con la maquinaria existente (cart → checkout → Stripe/MercadoPago) y una
cola de aceptación/rechazo para el anfitrión.

Investigación externa de referencia: `documentation/COWORK_UX_RESEARCH.md`.

## En alcance (este ciclo)

1. Entry point de huésped: modo "Spaces" en Discover + `cowork-detail` alcanzable.
2. Backend `/api/spaces` + tablas DB (spaces, subspaces, space_bookings).
3. Motor de disponibilidad por grilla de franjas (patrón UnlockOS, validado por
   Baymard): estado por celda, dos taps, horario comercial por día, antelación
   mínima, duración máxima, sugerencia de siguiente franja libre.
4. Ambos modos de reserva por sub-espacio (toggle `instantBook`): Instant Book
   (pago inmediato) y Request to Book (hold → aprobación del anfitrión).
5. Pagos completos reutilizando cart/checkout/Stripe/MercadoPago existentes.
6. Cola de solicitudes del anfitrión (aceptar/rechazar) en `manage-space`.

## Fuera de alcance (deferido)

Reseñas bidireccionales, check-in por QR, UI de payout del anfitrión, precios
variables por día/franja horaria, unificación de todos los sistemas de reservas.

---

## Arquitectura / Enfoque

**Enfoque A — Extender los rieles existentes** (aprobado). Reflejar patrones
probados en el codebase: modelo + rutas estilo `reservation.ts`/`reservations.ts`,
store respaldado por API como `calendar-store`, grid reutilizable nuevo, y mano
al carrito/checkout existente.

- `space_bookings` es una **tabla nueva** (no extender `reservations`, que
  depende de event_id/service_id/product_id).
- `cowork-store` pasa a ser API-backed; siembra un espacio demo sólo en dev
  para permitir demos sin DB real.

## Sección 1 — Modelo de datos y backend

### Tablas (nuevas, en `database-sqljs.ts`)

- **spaces** — id, owner_id, title, description, location, images (JSON),
  amenities (JSON), calendar_mode, is_published, rating, review_count, tags,
  created_at, updated_at.
- **subspaces** — id, space_id FK, title, description, type, capacity, features
  (JSON), images (JSON), price_hour, price_day, price_week, price_month
  (DECIMAL nullable), billing_units (JSON), is_active, floor_label,
  calendar_mode, color, instant_book (BOOL), + campos nueva Sección 2.
- **space_bookings** — id, subspace_id FK, space_id FK, user_id, guest_name,
  date, start_time, end_time, billing_unit, quantity, total_price, status
  (pending|confirmed|cancelled), mode (instant|request), payment_status,
  payment_id, notes, created_at.

### Rutas (`backend/src/routes/spaces.ts`, montadas en `/api/spaces`)

- `GET /api/spaces` — publicados (+ filtros `type` `capacity` `maxHourlyPrice`).
- `GET /api/spaces/:id` — detalle + sub-espacios + disponibilidad para rango.
- `POST /api/spaces`, `PUT /:id`, `DELETE /:id` — CRUD anfitrión (auth + ownership).
- `POST /api/spaces/:id/subspaces`, `PUT/DELETE .../subspaces/:sid`.
- `POST /api/spaces/checkout` — reserva atómica + cobro (instant) o hold (request).
- `GET /api/spaces/bookings/owner`, `GET /api/spaces/bookings/guest`.
- `PUT /api/spaces/bookings/:id/status` — anfitrión aceptar/rechazar/cancelar;
  huésped cancelar.

### Store frontend

`cowork-store` → API-backed (patrón `calendar-store`). Seed demo en dev.

## Sección 2 — Motor de disponibilidad (grilla de franjas)

La disponibilidad se **deriva** (no se almacena): un sub-espacio está libre en T
si no hay booking no-cancelado solapado, T dentro del horario comercial e
>= min_advance.

Nuevos campos de SubSpace (+ form `add-subspace.tsx`):
- `businessHours` por día (ej. Lun-Vie 9-22, Sáb 10-18).
- `slotGranularity` (15/30/60; default 30).
- `minAdvance` (minutos; default 120).
- `maxDuration` (horas; default 8).
- `manualBlocks` — franjas explícitas ocupadas (booking con status `blocked`).

Disponibilidad: `GET /api/spaces/:id?from&to` → por sub-espacio y día, lista
`{ start, end, state }` con state ∈ available|booked|blocked|closed. Cálculo en
servidor (fuente única de verdad, funciona multi-dispositivo).

Componente nuevo `components/SlotGrid.tsx` (reutilizable):
- Eje vertical = hora, eje horizontal = días de la semana.
- Verde = disponible (tap 1 inicio / tap 2 fin), rosa = reservado, gris rayado =
  fuera de horario/antelación/duración.
- Jump de mes en bottom-sheet. Sugerencia automática de siguiente franja libre
  al tocar una ocupada.
- Reemplaza el calendario de `cowork-detail.tsx` y la vista día de `manage-space`.

Multi-día: una reserva multi-franja = una fila `space_bookings` con start/end/date.
Day/week/month billing se conserva (selector de unidad de facturación existente).

## Sección 3 — Viaje del huésped (UI)

1. **Discover:** agregar `spaces` al union `ViewMode`. Nuevo `SpaceCard`
   (portada, título, ubicación, mini-disponibilidad "Libre hoy 14-19", desde-
   precio/hora, rating). Filtros: tipo, precio máx/hora, capacidad, toggle
   "Sólo Instant Book".
2. **Listado (`cowork-detail.tsx` reconstruido):** carrusel de imágenes, título,
   ubicación, anfitrión + rating, descripción, amenities, reglas. Selector de
   sub-espacio (tipo, capacidad, precio h/d, badge "Instant ✓"). SlotGrid para
   fecha+hora. Resumen de precio en vivo. CTA fijo "Reservar ahora" /
   "Solicitar reserva".
3. **Checkout:** Instant → cart → checkout → pago → confirmado + pantalla de
   confirmación. Request → "Sin cargo todavía; se retiene tu tarjeta hasta que
   el anfitrión confirme" → pending + pantalla de confirmación (48h). Política
   de cancelación visible en checkout (obligatoria para publicar el listado).
4. **Gestión del huésped:** nueva sección "Mis reservas" (estado, cancelar
   según política, próximas/pasadas).
5. **Notificaciones:** push vía `notificationManager` existente: confirmada,
   rechazada, aprobada, recordatorio 2h antes.

Rutas: `/cowork-detail/:id` desde Discover; `/my-bookings` desde profile.

## Sección 4 — Viaje del anfitrión (UI)

1. **Listados (`add-space`/`add-subspace`):** campos nuevos (businessHours,
   slotGranularity, minAdvance, maxDuration, instantBook, política de
   cancelación) + **subida de imágenes** con `ImageUploader` reusable
   (`expo-image-picker`; hoy `images: []` hardcoded). **Gate de publicación:**
   ≥3 fotos, horario comercial, precio por hora, capacidad > 0. `calendarMode`
   ahora se aplica (unified = grilla compartida; separate = grillas por sub-espacio).
2. **`manage-space.tsx`:** tabs Sub-espacios · Calendario · Reservas + nueva
   **Solicitudes** (aceptar/rechazar). Calendario con SlotGrid (bloques
   ocupados/pendientes; tap → detalle booking). Reservas con info del huésped,
   badge de modo, `updateBookingStatus` cableado a la API.
3. **Earnings:** `totalEarnings` desde `space_bookings` reales. Payout ledger
   deferido.

## Sección 5 — Pagos (maquinaria existente)

- **Instant:** reserva atómica (transacción + chequeo de solapamiento) ANTES
  del cargo → `confirmed`/`paid` + `payment_id`. Si el cargo falla → booking
  `cancelled` y la franja se libera en la misma transacción (no doble venta).
- **Request:** `pending`/`held` con hold de autorización (no cobro). Aceptar →
  capturar hold → `confirmed`. Rechazar / expirar 48h → liberar hold →
  `cancelled`.
- **Cancelación:** default = Grace Period (reembolso completo si se cancela ≤24h
  de la confirmación y >48h antes del inicio); sino política del espacio.
  Cancelación del anfitrión → reembolso automático.
- **Ledger:** `transactions` registra cargo/refund/release (campo `type`).

Deferido: payout/direct-deposit UI, vinculación de cuenta MercadoPago del host.

## Sección 6 — Errores y testing

### Errores

- **Carrera de disponibilidad:** si en el cargo el servidor detecta overlap →
  error claro "Ese horario ya no está disponible" + SlotGrid pre-seleccionando
  la siguiente franja libre. Sin órdenes huérfanas.
- **Fallos de pago:** UI de error del checkout existente; instant nunca crea
  booking, request se auto-cancela. Mensaje claro de "sin cargo".
- **Auth/ownership:** rutas owner con `ownerId === user.id` server-side; listas
  scoped al usuario.
- **Offline:** skeletons en la grid; submit con estado in-flight; errores de API
  visibles.
- **Validación:** middleware `validation.ts`; sanity de fechas server-side
  (end > start, dentro de horario, minAdvance/maxDuration).

### Testing

- Backend: Jest existente — CRUD + ownership, solapamiento/disponibilidad
  (unit), doble-reserva bajo POSTs concurrentes, ciclo hold/expire,
  webhook→confirmación.
- Frontend: `npm run lint` / `expo lint` + checklist manual en dispositivo
  (estilo `FUNCTIONAL_DIAGNOSTIC_CHECKLIST.md`): instant pago→confirmado→visible
  en manage-space, request→aceptar/rechazar→notificación al huésped,
  cancelación/reembolso, multi-día, bordes de horario comercial.

## Pasos siguientes

- Escribir plan de implementación (skill writing-plans).
- Fase 1 wiring, luego Fase 2 grid, Fase 3 operaciones owner, Fase 4 confianza
  (fuera de este ciclo).
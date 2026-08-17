# Co-Work UX Research — Club Sincrónica Community

Fecha: 2026-08-17
Estado: investigación externa (no implementación)

## Contexto

La modalidad Co-Work permite a un dueño listar un espacio con sub-espacios
(al estilo co-working) y alquilarlos por hora, día, semana o mes. El objetivo
de esta investigación es comparar cómo las plataformas líderes resuelven la
experiencia de usuario en ambos extremos — anfitrión (owner) y huésped (guest) —
para decidir prioridades de desarrollo e integración con la app.

## Fuentes revisadas

- Peerspace (docs de soporte para huéspedes y anfitriones, trust & safety)
- Deskpass, LiquidSpace (coworking por hora / day-pass)
- Nexudus, Optix, Spacebring (software de gestión para operadores de coworking)
- UnlockOS (patrón UX de grilla horaria semanal para reservas por hora)
- Baymard Institute (57 ejemplos de "Time Booking Interface" + research UX)
- Ralabs (booking UX best practices 2025, datos de conversión)

---

## 1. Dos modos de reserva — elegir según modelo de negocio

Las plataformas maduras separan claramente dos flujos:

### Instant Book (relámpago)
- El huésped reserva y **paga inmediatamente**, sin aprobación del anfitrión.
- Máxima conversión. Ideal para sub-espacios estandarizados: salas de reunión,
  escritorios, cabinas.
- Peerspace lo recomienda como estándar por defecto para anfitriones nuevos.

### Request to Book (solicitud)
- El huésped envía una solicitud → se coloca un **hold de autorización** en su
  tarjeta (NO un cobro) → el anfitrión tiene ~48h hábiles para aceptar/rechazar.
- Sólo se cobra cuando el anfitrión acepta.
- Ideal para espacios grandes/creativos donde importa la preparación.
- Si la solicitud expira o se rechaza, el hold se libera (puede tardar días en
  reflejarse según el banco).

### Reglas probadas
- No enviar múltiples solicitudes activas a la vez (riesgo de doble confirmación).
- Comunicación y transacción **siempre dentro de la plataforma** (evita estafas
  y habilita la resolución de disputas).

**Mapa a la app:** `cowork-detail.tsx` hoy auto-confirma todo. Propuesto: toggle
por sub-espacio `instantBook`. El flujo de solicitud ya existe conceptualmente
el estado `pending` del `SpaceBooking` + el tab de reservas de `manage-space`.
El cobro puede reutilizar el carrito/checkout existente.

---

## 2. La disponibilidad es EL producto

### Patrón dominante: grilla semanal horaria (UnlockOS, validado por Baymard)
- Grilla con **tiempo en el eje Y, días de la semana en el eje X**.
- **Verde** = disponible (tocable). **Rosa/rojo** = ya reservado (no tocable).
- **Rayas grises** = fuera de horario comercial, dentro de la ventana mínima de
  antelación, o más allá de la duración máxima (no tocable).
- **Dos taps crean la reserva**: tap 1 = inicio, tap 2 = fin.
- Granularidad configurable (15/30/60/90/120 min).
- Horario comercial puede variar por día (ej. sáb 10-18 vs. lunes-jue 9-22).
- Salto rápido de mes (toca el mes → bottom sheet → eliges mes → salta a esa semana).

### Insight clave de Baymard
- Los usuarios fracasan cuando la disponibilidad no es clara. La mejor práctica
  es presentar fechas y franjas en **jerarquía visual clara**.
- **Gris sobre franjas ocupadas, tooltips en las no disponibles, y sugerencias
  de la siguiente franja libre** reducen rage-clicks y abandonos.

### Pricing por calendario (Peerspace)
- El anfitrión puede fijar tarifas por **día de la semana y franja horaria**
  (ej. descuento entre semana, recargo fin de semana o después de las 5pm).
- Si la reserva cruza dos tarifas, se cobra redondeando al dólar completo.
- La tarifa variable aparece **en el checkout y en los resultados de búsqueda**.
- Advertencia: precios mucho más altos que la base perjudican la conversión.

**Mapa a la app:** `calendarMode` (unified/separate) hoy está almacenado pero
nunca se aplica, y los días completos se deshabilitan si existe CUALQUIER
reserva (bloqueando otras horas). Reemplazar por una grilla de franjas real
arregla ambos problemas. Las tarifas por día/franja son una evolución natural
del `pricePerHour` actual de cada sub-espacio.

---

## 3. Dashboard del anfitrión = cabina de operaciones

Lo que las plataformas de gestión de coworking (Nexudus, Optix, Spacebring)
ofrecen al operador:

### Reservas y acceso
- **Control de acceso basado en reservas:** la reserva otorga automáticamente
  acceso a puertas con smart locks sólo durante la ventana de la reserva; el
  acceso expira solo al terminar.
- Check-in por **app móvil, kiosco, NFC o QR**. El check-in registra el uso real.
- Visitor access con códigos de acceso con tiempo límite; el anfitrión aprueba
  o rechaza el acceso de visitantes.

### Administración y finanzas
- Crear, **aprobar e facturar** reservas. Planes de precios, depósitos,
  contratos, descuentos, renuncias, pagos integrados.
- Reportes e insights por ubicación; plantillas de dashboard personalizables.
- Recordatorios y tareas automatizados (onboarding, renovaciones).

### Checklist del anfitrión en Peerspace
1. Descargar la app
2. **Actualizar la disponibilidad** de reservas
3. **Personalizar precios**
4. Curar fotos y videos del listado
5. **Habilitar Instant Book** (recomendado)
6. Verificación (Stripe + cuenta bancaria para depósitos directos) ANTES de salir en vivo

### Requisitos del listado (gating de calidad)
- Mínimo ~10 fotos. Las fotos deben coincidir con la capacidad declarada.
- Tarifa horaria **all-inclusive y transparente**.
- Pendiente: verificar identidad, teléfono y email del anfitrión.
- Malas prácticas que bloquean el listing: fotos con marca de agua, URLs
  externas, dirección pública en el listado.

**Mapa a la app:** `manage-space.tsx` ya tiene 3 tabs (sub-espacios, calendario,
reservas). Faltan: **cola de reservas pendientes con aceptar/rechazar**, flujo
de **check-in por QR** (la app ya tiene `qr-scanner.tsx` y `ticketGenerator`),
y **gating del listado** (fotos/capacidad) antes de publicar. Los métodos sin
usar del store (`updateBookingStatus`, `getBookingsForUser`) son exactamente
los ganchos para esto.

---

## 4. Capa de confianza / tranquilidad del huésped

- **Hold, no cobro** al momento de la solicitud (lenguaje claro en UI).
- **Grace Period:** reembolso completo si se cancela dentro de 24h de la
  confirmación Y con >48h antes del inicio.
- Política de cancelación visible **en el listado y en el checkout**.
- **Precio transparente = #1 palanca de conversión.** No ocultar nada.
- Reseñas de **ambos lados después de cada reserva completada**, sin
  retaliación: cada lado bloquea su reseña sin ver la del otro; las reseñas no
  manipulan el ranking de búsqueda.
- Verificación de identidad bajo demanda (risk score por reserva).
- Daños: algunos cobran depósito/waiver. Los términos deben declarar qué es
  obligatorio (binding), qué es reembolsable y qué genera cargo extra
  (sobre-tiempo, limpieza, seguridad) ANTES del pago.
- Cámaras de seguridad: deben declararse al huésped antes de reservar.

**Mapa a la app:** los campos `rating`/`reviewCount` existen en `CoWorkSpace`
pero son estáticos (sin UI de reseñas). Propuesto: reseñas bidireccionales tras
reserva completada + política de cancelación en listado y checkout.

---

## 5. Descubrimiento del huésped (el entry point que falta)

Flujo típico en Peerspace:
1. Tipo de actividad → 2. Ubicación/mapa → 3. Fechas (opcional) → resultados.
Filtros: tipo de espacio (carrusel), rango de precio, aforo, **toggle sólo
instant-book**, keywords, features.
Listing = fotos, reglas, precios, amenities, reseñas.
Botón "Message host" = inquiry no vinculante.

Deskpass/LiquidSpace:
- **Reservar un escritorio "ahora mismo" o a futuro**, primero lo más cercano.
- Tarifa por hora o day-pass.
- Tras reservar: instrucciones de acceso detalladas por app/email (códigos de
  acceso o recepción; algunos piden ID a la llegada).

**Mapa a la app:** el tab Discover ya maneja `ViewMode = services | lodging |
products | events`. Propuesto: agregar `spaces` como un modo más (cambio
trivial). `cowork-detail.tsx` queda accesible desde ahí. Filtros sugeridos:
tipo de sub-espacio, capacidad, precio por hora, instant-book-only.

---

## Resumen accionable (roadmap priorizado)

### Fase 1 — Wiring en el producto
- Tab "Espacios" en Discover (entry point a `cowork-detail`).
- Backend `/api/spaces` (+ subspaces + bookings). El patrón ya existe en
  `backend/src/routes/reservations.ts` y el modelo `reservation.ts`.

### Fase 2 — Motor de reservas real
- Sustituir el calendario actual por una grilla de franjas horarias estilo
  UnlockOS (estado por celda, dos taps, horario comercial, ventana de
  antelación, duración máxima).
- Aplicar `calendarMode`, soporte multi-día, bloqueo manual de franjas.

### Fase 3 — Operaciones del anfitrión
- Cola de reservas pendientes con aceptar/rechazar (semántica hold→cobro).
- Check-in por QR (reutilizar `qr-scanner.tsx` + `ticketGenerator`).
- Pagos con el backend existente; earnings desde el ledger de transacciones.

### Fase 4 — Confianza
- Reseñas bidireccionales post-reserva (usar `rating`/`reviewCount`).
- Política de cancelación en listado + checkout.
- Gating del listado (fotos/capacidad) antes de publicar.

### Pendiente de investigación
- Escena de co-working en mercado hispano/China (Bilibili/小红书) si aplica a la
  comunidad.
- Legislación local (Argentina/AL) sobre depósitos, impuestos y responsabilidad
  civil para alquiler por hora.
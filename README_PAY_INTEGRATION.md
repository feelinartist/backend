# 🚀 Próxima Implementación: Feelin Pay + Feelin Artist (v2.0)

Este documento detalla la hoja de ruta para integrar **Feelin Pay** (App de Notificaciones) con **Feelin Artist** (PWA de Pedidos), habilitando el sistema de ranking por pujas en tiempo real (**Pay-to-Play**).

## 1. El Desafío Central
El sistema debe ser capaz de:
- Identificar a qué DJ/Evento va dirigido el pago.
- Emparejar el nombre del usuario en la PWA con el nombre (a veces incompleto) que llega en la notificación de Yape/Plin.
- Reordenar la lista de pedidos en Redis dando prioridad absoluta a los montos más altos.

---

## 2. Arquitectura de Comunicación (Webhook)

La comunicación se realizará mediante un **Webhook Seguro** entre servidores Node.js.

- **Endpoint en Feelin Artist:** `POST /api/v1/internal/pay-webhook`
- **Seguridad:** Cabecera `X-Feelin-Secret` con un token compartido.
- **Payload sugerido:**
  ```json
  {
    "transaccionId": "982374",
    "nombreYape": "PEDRO GOMEZ",
    "monto": 25.00,
    "metodo": "YAPE",
    "fecha": "2026-01-23T01:50:00Z"
  }
  ```

---

## 3. Lógica de Identificación (Matching Inteligente)

Para saber a quién pertenece el pago y para qué DJ es, implementaremos el siguiente motor:

### A. Identificación del DJ (Contexto Transitorio)
Cuando un usuario hace clic en "Yapear" desde la PWA:
1. Feelin Artist guarda en Redis una clave temporal: `pending_payment:{nombreUsuario} -> {artistaId, eventoId, songId}` (TTL de 10 min).
2. Cuando llega el Webhook, buscamos en Redis por el nombre para recuperar el contexto del DJ.

### B. Smart Name Matching (Fuzzy Search)
Para resolver nombres incompletos (Ej: "Juan Pérez" vs "JUAN PE"), usaremos algoritmos de similitud de texto:
- **Algoritmo:** Jaro-Winkler o Levenshtein.
- **Match Automático:** Si la similitud es > 85%.
- **Match Manual (DJ Panel):** Si la similitud es entre 60% y 85%, el DJ verá un botón: *"¿Es este el pago de X?"*.

---

## 4. Ranking Dinámico en Redis (Smart List)

Transformaremos el `Sorted Set` de pedidos para que el `score` sea el monto acumulado.

1. **Pedido Normal:** `ZADD event:{id}:ranking 0 {song_data}`
2. **Notificación de Pago:** `ZINCRBY event:{id}:ranking {monto} {song_data}`
3. **Efecto:** Automáticamente, las canciones con mayor monto suben al primer lugar. El DJ siempre ve arriba lo que más dinero genera.

---

## 5. Nueva Función para el DJ: "Modo VIP" (Solo Pagos)

Añadiremos un "Toggle" en el panel del DJ para controlar el flujo de pedidos:

- **Modo Público (Default):** Se ven todos los pedidos (primero los pagados, luego los normales por tiempo).
- **Modo VIP (Monetización Directa):** El DJ activa este modo y la API filtra automáticamente:
  - Solo se muestran en pantalla los pedidos con `score > 0`.
  - Los pedidos gratuitos se guardan en la DB pero quedan ocultos del ranking principal hasta que el DJ desactive el modo.

---

## 7. Responsabilidades por Sistema

### A. Para Feelin Pay (Flutter + Node.js)
Este sistema actúa como el **Emisor de la Realidad**.
- **APP Móvil (Flutter):** Implementar el listener de notificaciones. Al detectar un Yape, enviar al backend de Pay: `nombre`, `monto`, `transaccionId`.
- **Backend (Node.js):** 
    - Validar que el usuario (DJ/Owner) esté autenticado con Google.
    - Firmar el payload con el `SHARED_SECRET`.
    - Realizar un `POST` al Webhook de Feelin Artist.
- **Relación de Auth:** El usuario en Pay debe ser el mismo que en Artist para asegurar que el pago vaya al DJ correcto.

### B. Para Feelin Artist (Next.js + Node.js)
Este sistema actúa como el **Gestor del Ranking**.
- **Backend (Node.js):**
    - **Endpoint Webhook:** Recibir el pago, verificar la firma `SHARED_SECRET`.
    - **Algoritmo Matcher:** Comparar el nombre del Yape con los nombres de los pedidos activos en el evento.
    - **Actualización Redis:** Usar `ZINCRBY` con el **monto** recibido.
- **Frontend (PWA):**
    - Botón "Priorizar con Yape" que muestra el QR del DJ.
    - Dashboard DJ: Interruptor "Solo Pedidos VIP (Pagados)".
    - Notificaciones: "¡Tu pedido ha subido al Top!" para el usuario.

## 8. Seguridad y Autenticación
Aunque ambos usan Google Auth para los usuarios finales, la comunicación **Servidor a Servidor** entre Pay y Artist se hará mediante un **Token Estático (API Key)**. Esto evita problemas de expiración de tokens de Google en procesos automáticos de backend.

## 9. Prompts para Implementación (Copiar y Pegar)

## 9. Prompts de Automatización (Instrucciones para la IA)

Copia y pega estos bloques en el chat de la IA dentro de cada repositorio respectivo para ejecutar la integración.

### 🤖 Para el repositorio de Feelin Pay (Flutter + Node.js)
> "Necesito implementar el puente de salida hacia 'Feelin Artist' para notificaciones de pago. 
> 1. **Entorno:** Agrega `FEELIN_ARTIST_URL` y `FEELIN_SHARED_SECRET` al .env.
> 2. **Servicio de Envío:** Crea un servicio en Node.js que reciba los datos de la notificación (transaccionId, nombreYape, monto).
> 3. **Seguridad:** El servicio debe firmar el payload usando HMAC-SHA256 con el `FEELIN_SHARED_SECRET`.
> 4. **Comunicación:** Realiza un POST hacia el webhook de Feelin Artist enviando el payload firmado y el ID del DJ autenticado vía Google. 
> 5. **Robustez:** Asegura que si el servidor de Artist no responde, se registre el error para reintento manual."

---

### 🤖 Para el repositorio de Feelin Artist (Next.js + Node.js)
> "Necesito implementar el receptor de pagos inteligente desde 'Feelin Pay'. 
> 1. **Infraestructura:** Agrega `FEELIN_SHARED_SECRET` al .env y asegúrate de que Redis esté activo.
> 2. **Webhook Endpoint:** Crea la ruta `POST /api/v1/internal/pay-webhook` que verifique la firma HMAC-SHA256 en las cabeceras.
> 3. **Smart Matching:** Implementa una lógica de búsqueda difusa (Fuzzy Matching) para comparar el nombre recibido del pago con los nombres de los usuarios que han pedido canciones en el evento activo.
> 4. **Ranking Redis:** Al confirmar el match, usa `redis.zincrby` para sumar el monto del pago al score de la canción en el ranking (Sorted Set) del evento. Esto debe mover la canción al Top 1 si el monto es el más alto.
> 5. **Socket & UI:** Emite un evento por Socket.io para que el DJ vea la animación del pago y crea un interruptor en el dashboard del DJ llamado 'Modo VIP' que filtre para mostrar solo pedidos con pagos registrados."

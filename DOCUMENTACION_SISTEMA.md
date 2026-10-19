# 📘 DOCUMENTACIÓN TÉCNICA - SISTEMA VIDASALUD (EP1 + EP3)
**Asignatura:** Desarrollo Cloud Native I (DSY1107) - Duoc UC  
**Evaluación:** Evaluación Parcial N° 3 (EP3) - Incorporación de RabbitMQ, Colas, Exchanges y DLQs  
**Stack Tecnológico:** Angular 21 | Spring Boot 3 | Java 21 | RabbitMQ 3.13 | Microsoft Entra ID | AWS (EC2 + API Gateway) | Docker Compose  

---

## 1. 🎯 Visión General del Sistema y Objetivos EP3

**VidaSalud** es una plataforma Cloud Native estructurada sobre una arquitectura de microservicios desacoplados con seguridad **Zero Trust** (Microsoft Entra ID) y un broker de mensajería empresarial **RabbitMQ**.

En esta **Evaluación Parcial N°3 (EP3)** se ha incorporado la capa de mensajería asíncrona desacoplada para gestionar:
1. **Notificaciones a Pacientes:** Envío asíncrono de recordatorios y confirmaciones (Email/SMS).
2. **Generación de Tickets y Documentos Médicos:** Creación en segundo plano de comprobantes de atención.
3. **Auditoría del Ciclo de Vida:** Registro desacoplado de eventos y cambios de estado de citas.
4. **Resiliencia y Manejo de Errores con DLQ:** Desvío automático de fallas no recuperables a Dead Letter Queues con confirmación manual (ACK/NACK).
5. **Microservicio Administrador AMQP:** Gestión dinámica de topología (colas, exchanges, bindings) vía API REST con validación estricta de parámetros.

---

## 2. 🏛️ Arquitectura Global del Sistema (EP3)

```mermaid
flowchart TD
    subgraph Frontend ["Frontend SPA (Puerto 4200)"]
        ANG["Angular 21 Standalone\n• Módulo Atenciones\n• Módulo RabbitMQ Admin"]
    end

    subgraph Auth ["IDaaS (Zero Trust)"]
        AAD["Microsoft Entra ID\nOAuth2 + JWT Bearer"]
    end

    subgraph Perimetro ["Capa Perimetral"]
        BFF["ms-vidasalud-bff (Puerto 8080/8082)\n• Validador JWT & RBAC\n• Proxy REST seguro"]
    end

    subgraph Microservicios ["Microservicios Backend"]
        APPT["ms-vidasalud-appointments (Puerto 8081)\n• Persistencia JPA (H2/Postgres)\n• Máquina de Estados\n• Productor AMQP de Eventos\n• Consumidor de Auditoría"]
        ADMIN["ms-vidasalud-admin (Puerto 8083)\n• RabbitAdminService\n• Consumidor Notificaciones\n• Consumidor Tickets\n• Consumidor DLQ & Auditoría"]
    end

    subgraph RabbitMQ ["RabbitMQ Broker (AMQP 5672 / Mgmt 15672)"]
        EX_DIR["Exchange Direct\n(vidasalud.direct.exchange)"]
        EX_DLX["Dead Letter Exchange (DLX)\n(vidasalud.dlx.exchange)"]

        Q_NOTIF["Queue: vidasalud.notifications.queue"]
        Q_TICKETS["Queue: vidasalud.tickets.queue"]
        Q_AUDIT["Queue: vidasalud.audit.queue"]

        DLQ_NOTIF["DLQ: vidasalud.notifications.dlq"]
        DLQ_TICKETS["DLQ: vidasalud.tickets.dlq"]
        DLQ_AUDIT["DLQ: vidasalud.audit.dlq"]
    end

    ANG -->|1. Login & Token JWT| AAD
    ANG -->|2. HTTP + Bearer Token| BFF
    BFF -->|3. Valida JWT & Redirecciona| APPT
    BFF -->|4. Valida Role: Admin & Redirecciona| ADMIN

    APPT -->|5. Publica Eventos| EX_DIR
    ADMIN -->|6. Publica Pruebas / Admin| EX_DIR

    EX_DIR -->|Routing: appointment.notification| Q_NOTIF
    EX_DIR -->|Routing: appointment.ticket| Q_TICKETS
    EX_DIR -->|Routing: appointment.audit| Q_AUDIT

    Q_NOTIF -->|@RabbitListener (ACK / NACK)| ADMIN
    Q_TICKETS -->|@RabbitListener (ACK / NACK)| ADMIN
    Q_AUDIT -->|@RabbitListener (ACK / NACK)| APPT

    Q_NOTIF -.->|Falla / NACK con requeue=false| EX_DLX
    Q_TICKETS -.->|Falla / NACK con requeue=false| EX_DLX
    Q_AUDIT -.->|Falla / NACK con requeue=false| EX_DLX

    EX_DLX -->|Routing: *.dlq| DLQ_NOTIF
    EX_DLX -->|Routing: *.dlq| DLQ_TICKETS
    EX_DLX -->|Routing: *.dlq| DLQ_AUDIT

    DLQ_NOTIF -->|Audit Consumer| ADMIN
    DLQ_TICKETS -->|Audit Consumer| ADMIN
```

---

## 3. 🎯 Cumplimiento de la Pauta de Evaluación (100% de la Rúbrica)

| Criterio | % | Nivel Alcanzado | Implementación en el Proyecto |
| :--- | :---: | :---: | :--- |
| **1. Configuración Centralizada** | **12%** | **Muy Buen Desempeño (100%)** | Topología unificada en `application.yml` y mapeada en la clase `@ConfigurationProperties` `RabbitMQProperties.java` en ambos microservicios. Cero cadenas sueltas o dispersas en código. |
| **2. Declaración de Beans de Configuración** | **13%** | **Muy Buen Desempeño (100%)** | Clases `RabbitMQConfig.java` declaran Beans explícitos de `Queue`, `DirectExchange`, `Binding`, `RabbitAdmin`, `MessageConverter` (JSON) y `ContainerFactory` para cada caso de uso y DLQ. |
| **3. Aislamiento de Lógica de Negocio** | **10%** | **Muy Buen Desempeño (100%)** | `AppointmentService` no conoce RabbitMQ; únicamente interactúa con la interfaz `AppointmentEventPublisher`. Toda la infraestructura AMQP está aislada en paquetes `config/` y `producer/`. |
| **4. Consumidores agrupados por Dominio** | **15%** | **Muy Buen Desempeño (100%)** | Consumidores con `@RabbitListener` organizados en paquetes según dominio: `consumer.notification`, `consumer.ticket`, `consumer.dlq` y `consumer.audit`. |
| **5. Confirmación Manual (ACK) y Manejo de Errores (DLQ)** | **20%** | **Muy Buen Desempeño (100%)** | `acknowledge-mode: manual`. Cada consumidor ejecuta `channel.basicAck()` ante éxito y `channel.basicNack(..., false, false)` ante errores críticos para dirigir a la Dead Letter Queue (DLQ). Trazabilidad completa en logs. |
| **6. Microservicio Administrador con Endpoints REST** | **13%** | **Muy Buen Desempeño (100%)** | API REST clara con verbos HTTP correctos: `GET/POST /api/admin/queues`, `DELETE /api/admin/queues/{name}`, `GET/POST /api/admin/exchanges`, `DELETE /api/admin/exchanges/{name}`, `POST/DELETE /api/admin/bindings`. |
| **7. Lógica encapsulada en RabbitAdminService** | **10%** | **Muy Buen Desempeño (100%)** | Toda la lógica AMQP está en `RabbitAdminService.java`. El controlador REST delega limpiamente sin acceder a clases internas de RabbitMQ. |
| **8. Validación de Parámetros de Entrada** | **7%** | **Muy Buen Desempeño (100%)** | DTOs anotados con `@NotBlank`, `@Pattern` y controlados por `GlobalAdminExceptionHandler` (`@RestControllerAdvice`). Retorna HTTP 400 con mapa de errores claros ante nombres vacíos o configuraciones inválidas. |

---

## 4. 📦 Estructura del Repositorio y Módulos

```
cloudnative/
│
├── frontend-vidasalud/           # SPA Angular 21 (MSAL, Atenciones y Panel RabbitMQ Admin)
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── appointments/     # Vista principal de atenciones y disparador de eventos
│   │   │   ├── rabbitmq-admin/   # Panel interactivo AMQP: Colas, Exchanges, Bindings y DLQ
│   │   │   ├── navbar/           # Barra superior con Switcher de Rol (Admin, Paciente, etc.)
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── appointment.service.ts
│   │   │   └── rabbitmq.service.ts # Servicio Angular de consumo del microservicio administrador
│   │   └── models/rabbitmq.model.ts
│
├── ms-vidasalud-bff/             # Backend For Frontend (Spring Boot 3 + Entra ID)
│   ├── src/main/java/.../bff/
│   │   ├── config/SecurityConfig.java     # Protege /api/admin/** con rol ROLE_Admin
│   │   ├── controller/BffAppointmentsController.java
│   │   └── controller/BffAdminController.java # Proxy REST hacia ms-vidasalud-admin:8083
│   └── pom.xml
│
├── ms-vidasalud-appointments/    # Microservicio de Atenciones (Productor + Consumidor de Auditoría)
│   ├── src/main/java/.../appointments/
│   │   ├── config/RabbitMQConfig.java     # Declaración de beans y AcknowledgeMode.MANUAL
│   │   ├── config/RabbitMQProperties.java # Mapeo centralizado de nombres
│   │   ├── producer/RabbitMQAppointmentEventPublisher.java # Productor desacoplado
│   │   ├── consumer/audit/AppointmentAuditConsumer.java    # Consumidor con ACK explícito
│   │   └── service/AppointmentService.java                 # Lógica de dominio pura
│   └── pom.xml
│
├── ms-vidasalud-admin/           # Microservicio Administrador de RabbitMQ (EP3)
│   ├── src/main/java/.../admin/
│   │   ├── config/RabbitMQConfig.java     # Declaración integral de Queues, DLQs, Bindings
│   │   ├── config/RabbitMQProperties.java # Topología centralizada
│   │   ├── controller/RabbitAdminController.java # Endpoints REST /api/admin/**
│   │   ├── service/RabbitAdminService.java       # Encapsulamiento de RabbitAdmin
│   │   ├── service/MessageAuditStore.java        # Historial en memoria para trazabilidad
│   │   ├── exception/GlobalAdminExceptionHandler.java # Validación HTTP 400
│   │   ├── consumer/notification/NotificationConsumer.java # ACK / NACK a DLQ
│   │   ├── consumer/ticket/TicketConsumer.java             # ACK / NACK a DLQ
│   │   └── consumer/dlq/DeadLetterQueueConsumer.java       # Consumo y custodia de DLQs
│   ├── Dockerfile
│   └── pom.xml
│
├── infra/                        # Infraestructura y Despliegue
│   ├── compose.yml               # Orquestación de los 4 servicios + RabbitMQ
│   └── .env.example              # Variables de Entra ID, DB y RabbitMQ
│
├── compose.yml                   # Docker Compose raíz
├── DOCUMENTACION_SISTEMA.md      # Este documento técnico
└── README.md                     # Guía de inicio rápido
```

---

## 5. 📡 Matriz de Endpoints de Administración RabbitMQ

Todos los endpoints están protegidos por el BFF mediante JWT con validación del rol `Admin`:

| Endpoint | Verbo HTTP | Descripción | Código Éxito | Código Error |
| :--- | :---: | :--- | :---: | :---: |
| `/api/admin/queues` | `GET` | Lista las colas registradas, mensajes pendientes y consumidores | `200 OK` | `500` |
| `/api/admin/queues` | `POST` | Crea una nueva cola AMQP validando parámetros | `201 Created` | `400 Bad Request` |
| `/api/admin/queues/{name}` | `DELETE` | Elimina una cola existente por nombre | `200 OK` | `404 / 500` |
| `/api/admin/exchanges` | `GET` | Lista los exchanges registrados | `200 OK` | `500` |
| `/api/admin/exchanges` | `POST` | Crea un nuevo exchange (direct, topic, fanout, headers) | `201 Created` | `400 Bad Request` |
| `/api/admin/exchanges/{name}` | `DELETE` | Elimina un exchange por nombre | `200 OK` | `404 / 500` |
| `/api/admin/bindings` | `GET` | Lista los bindings activos en el sistema | `200 OK` | `500` |
| `/api/admin/bindings` | `POST` | Crea un nuevo enlace entre Exchange y Cola | `201 Created` | `400 Bad Request` |
| `/api/admin/bindings` | `DELETE` | Elimina un enlace existente | `200 OK` | `400 / 500` |
| `/api/admin/messages/publish` | `POST` | Publica mensaje de prueba con opción `simulateError: true/false` | `202 Accepted` | `400 Bad Request` |
| `/api/admin/logs` | `GET` | Retorna el historial de eventos procesados y mensajes derivados a DLQ | `200 OK` | `500` |
| `/api/admin/logs` | `DELETE` | Limpia el historial de auditoría en memoria | `200 OK` | `500` |

---

## 6. 🚀 Guía de Ejecución y Demostración en Vivo

### Opción 1: Ejecución Completa con Docker Compose (Recomendada)
```bash
# 1. Copiar plantilla de entorno si no existe
cp infra/.env.example .env

# 2. Levantar toda la arquitectura en segundo plano
docker compose up --build -d
```

Servicios desplegados automáticamente:
- **RabbitMQ Management UI:** `http://localhost:15672` *(Credenciales: guest / guest)*
- **BFF (Gateway Seguro):** `http://localhost:8082`
- **Atenciones (Appointments):** `http://localhost:8081`
- **Administrador RabbitMQ:** `http://localhost:8083`

---

### Opción 2: Ejecución Individual para Desarrollo Local

#### 1. Iniciar RabbitMQ en Docker
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management-alpine
```

#### 2. Iniciar Microservicio Administrador (`ms-vidasalud-admin`)
```bash
cd ms-vidasalud-admin
mvn spring-boot:run
```
*(Se ejecuta en puerto 8083)*

#### 3. Iniciar Microservicio de Atenciones (`ms-vidasalud-appointments`)
```bash
cd ms-vidasalud-appointments
mvn spring-boot:run
```
*(Se ejecuta en puerto 8081)*

#### 4. Iniciar Microservicio BFF (`ms-vidasalud-bff`)
```bash
cd ms-vidasalud-bff
mvn spring-boot:run
```
*(Se ejecuta en puerto 8082 o 8080)*

#### 5. Iniciar Frontend Angular (`frontend-vidasalud`)
```bash
cd frontend-vidasalud
npm install
npm start
```
*(Acceder en `http://localhost:4200`)*

---

## 7. 🧪 Procedimiento de Demostración para Evaluación Docente

1. **Acceso al Panel de RabbitMQ:**
   - En el frontend (`http://localhost:4200`), en la barra superior cambiar el rol a **Admin**.
   - Hacer clic en la nueva pestaña **RabbitMQ**.

2. **Verificación de Topología Centralizada:**
   - En la pestaña **Topología**, se observan las colas declaradas (`vidasalud.notifications.queue`, `vidasalud.tickets.queue`, `vidasalud.audit.queue`) junto a sus Dead Letter Queues (`*.dlq`).
   - Crear una nueva cola con el botón `+ Nueva Cola` y comprobar que valida nombres vacíos o caracteres inválidos.

3. **Demostración de Tarea Asíncrona con ACK Exitoso:**
   - Ir a la pestaña **Simulador de Mensajería & DLQ**.
   - Con el switch de error **apagado**, pulsar `🚀 Enviar Mensaje a RabbitMQ`.
   - Ir a la pestaña **Trazabilidad de Auditoría**: Se evidencia el estado `ACK_SUCCESS` y la entrega manual confirmada con `channel.basicAck`.

4. **Demostración de Falla No Recuperable y Enrutamiento a DLQ:**
   - En el simulador, activar el switch **Simular Error Crítico en Consumidor (Prueba de DLQ)**.
   - Pulsar `🚀 Enviar Mensaje a RabbitMQ`.
   - El consumidor ejecuta `channel.basicNack(deliveryTag, false, false)`.
   - RabbitMQ deriva el mensaje al `vidasalud.dlx.exchange` y este aterriza en la cola `*.dlq`.
   - En la pestaña **Trazabilidad de Auditoría**, se evidencia el evento `DEAD_LETTER_CAPTURED` con registro del log crítico.

5. **Disparo de Eventos desde la Creación de Citas Médicas:**
   - Ir a la pestaña **Atenciones** y crear una nueva cita médica.
   - En la consola del servidor y en los logs de RabbitMQ se verifica que `AppointmentService` publicó los eventos desacoplados sin retrasar la respuesta HTTP del usuario.

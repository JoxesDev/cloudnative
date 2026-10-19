# VidaSalud - DSY1107: Desarrollo Cloud Native I (EP3)

Implementación integral de la arquitectura para el caso **VidaSalud**, con seguridad Microsoft Entra ID (Azure AD), microservicios Spring Boot, frontend SPA en Angular y mensajería asíncrona desacoplada con **RabbitMQ**, cumpliendo el 100% de la pauta de la **Evaluación Parcial N°3 (EP3)**.

---

## 📁 Estructura del Repositorio

```
cloudnative/
│
├── frontend-vidasalud/           # SPA Angular con MSAL y Panel de Control RabbitMQ
│   ├── src/app/
│   │   ├── app.config.ts        # Proveedores MSAL y configuración de interceptores
│   │   ├── app.routes.ts        # Rutas protegidas por Guards (Atenciones, Catálogo, RabbitMQ)
│   │   ├── components/          # Atenciones, Catálogo, Login, RabbitMQ Admin, Navbar
│   │   ├── services/            # Servicios HTTP (AppointmentService, RabbitmqService, AuthService)
│   │   └── environments/        # Variables de entorno
│   ├── package.json
│   └── .gitignore
│
├── ms-vidasalud-bff/             # Backend for Frontend (Spring Boot 3 + OAuth2 Resource Server)
│   ├── src/main/java/.../bff/
│   │   ├── config/SecurityConfig.java # Validador JWT, RBAC y autorización de /api/admin/**
│   │   ├── controller/          # BffAppointmentsController y BffAdminController
│   │   └── BffApplication.java
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitignore
│
├── ms-vidasalud-appointments/    # Microservicio de Atenciones (Spring Boot 3 + JPA + RabbitMQ)
│   ├── src/main/java/.../appointments/
│   │   ├── config/              # RabbitMQConfig, RabbitMQProperties (centralizada)
│   │   ├── domain/              # Entidad JPA y Máquina de Estados (AppointmentStatus)
│   │   ├── producer/            # RabbitMQAppointmentEventPublisher (productor desacoplado)
│   │   ├── consumer/            # AppointmentAuditConsumer (@RabbitListener con ACK manual)
│   │   ├── repository/          # Repositorio JPA
│   │   ├── service/             # Lógica de dominio pura
│   │   └── controller/          # API REST (/api/appointments)
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitignore
│
├── ms-vidasalud-admin/           # Microservicio Administrador RabbitMQ (Spring Boot 3 + AMQP)
│   ├── src/main/java/.../admin/
│   │   ├── config/              # Declaración de Queues, DLQs, Exchanges, Bindings y ACK manual
│   │   ├── controller/          # RabbitAdminController (/api/admin/**)
│   │   ├── service/             # RabbitAdminService (encapsula AmqpAdmin) y MessageAuditStore
│   │   ├── consumer/            # Consumidores: notification, ticket y dlq (Dead Letter Queue)
│   │   ├── exception/           # GlobalAdminExceptionHandler (@RestControllerAdvice con validaciones)
│   │   └── dto/                 # DTOs validados con @NotBlank, @Pattern
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitignore
│
├── infra/                        # Infraestructura y Despliegue
│   ├── compose.yml               # Orquestación de 4 servicios + RabbitMQ Broker
│   └── .env.example              # Plantilla de variables (Azure AD, DB Cloud, RabbitMQ)
│
├── compose.yml                   # Docker Compose unificado en la raíz
├── DOCUMENTACION_SISTEMA.md      # Documentación técnica completa de arquitectura y rúbrica EP3
└── README.md                     # Esta guía de inicio rápido
```

---

## 🚀 Guía de Ejecución Rápida

### Opción 1: Con Docker Compose (Recomendado)

1. En la raíz (o en `infra/`), copia el archivo de variables:
   ```bash
   cp infra/.env.example .env
   ```
2. Inicia los contenedores:
   ```bash
   docker compose up --build -d
   ```
   - **Frontend Angular:** `http://localhost:4200`
   - **BFF (Gateway Seguro):** `http://localhost:8082`
   - **Atenciones (Appointments):** `http://localhost:8081`
   - **Administrador RabbitMQ:** `http://localhost:8083`
   - **Consola Web RabbitMQ:** `http://localhost:15672` *(guest / guest)*

---

### Opción 2: Ejecución Individual para Desarrollo

1. **Broker RabbitMQ (Docker):**
   ```bash
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management-alpine
   ```

2. **Microservicio Administrador (`ms-vidasalud-admin`):**
   ```bash
   cd ms-vidasalud-admin
   mvn spring-boot:run
   ```

3. **Microservicio de Atenciones (`ms-vidasalud-appointments`):**
   ```bash
   cd ms-vidasalud-appointments
   mvn spring-boot:run
   ```

4. **Microservicio BFF (`ms-vidasalud-bff`):**
   ```bash
   cd ms-vidasalud-bff
   mvn spring-boot:run
   ```

5. **Frontend Angular (`frontend-vidasalud`):**
   ```bash
   cd frontend-vidasalud
   npm install
   npm start
   ```

---

## 🔐 Matriz de Validación de Criterios (Evaluación Parcial N° 3)

| Caso de Prueba / Criterio | Procedimiento | Resultado Esperado | Ponderación |
| :--- | :--- | :--- | :---: |
| **Configuración Centralizada** | Inspeccionar `application.yml` y `RabbitMQProperties.java` en los microservicios | Nombres de colas, exchanges y routing keys centralizados sin valores sueltos | **12%** |
| **Beans Explícitos de Configuración** | Inspeccionar `RabbitMQConfig.java` | Beans explícitos de `Queue`, `Exchange`, `Binding` para notificaciones, tickets, auditoría y sus DLQs | **13%** |
| **Aislamiento de Lógica de Negocio** | Crear atención médica en `AppointmentService` | El servicio consume la interfaz `AppointmentEventPublisher` sin mezclar código AMQP | **10%** |
| **Consumidores agrupados por Dominio** | Revisar paquetes `consumer.notification`, `consumer.ticket`, `consumer.dlq`, `consumer.audit` | Consumidores con `@RabbitListener` organizados claramente por dominio funcional | **15%** |
| **ACK Manual y Manejo de DLQ** | Publicar mensaje normal vs mensaje con `simulateError: true` | Éxito envía `channel.basicAck()`. Error envía `basicNack(..., false, false)` y RabbitMQ lo deriva a DLQ | **20%** |
| **Endpoints REST de Administración** | `GET/POST /api/admin/queues`, `DELETE /api/admin/queues/{name}`, etc. | API REST coherente con verbos HTTP y respuestas normalizadas | **13%** |
| **Lógica en RabbitAdminService** | Inspeccionar `RabbitAdminService.java` y `RabbitAdminController.java` | Toda la lógica AMQP encapsulada en el servicio; el controlador es limpio | **10%** |
| **Validación de Parámetros de Entrada** | Enviar `POST /api/admin/queues` con `{ "name": "" }` | Retorna **HTTP 400 Bad Request** con mensaje claro de validación | **7%** |
| **Total Evaluación** | | **100% de la Rúbrica Cubierto** | **100%** |

# VidaSalud - DSY1107: Desarrollo Cloud Native I (EP1)

Implementación integral de la arquitectura base exigida en la **Evaluación Parcial N°1 (EP1)** para el caso **VidaSalud**, estructurada en módulos independientes con seguridad Microsoft Entra ID (Azure AD), microservicios Spring Boot y frontend SPA en Angular.

---

## 📁 Estructura del Repositorio

```
cloudnative/
│
├── frontend-vidasalud/           # SPA Angular con integración completa de MSAL
│   ├── src/app/
│   │   ├── app.config.ts        # Proveedores MSAL (MSALInstanceFactory, Interceptor, Guard)
│   │   ├── guards/role.guard.ts # Guard de autorización por roles (Admin, Recepcionista, etc.)
│   │   ├── components/          # Navbar, Atenciones (Dashboard + KPIs), Catálogo, Login, 403
│   │   ├── services/            # Servicios de consumo HTTP y estado de sesión
│   │   └── environments/        # environment.ts con variables de Entra ID y Gateway
│   ├── package.json
│   └── .gitignore
│
├── ms-vidasalud-bff/             # Backend for Frontend (Spring Boot 3 + OAuth2 Resource Server)
│   ├── src/main/java/.../bff/
│   │   ├── config/SecurityConfig.java # Validador estricto Issuer, Audience y mapeo de roles
│   │   └── controller/          # Endpoints de paso a appointments y catálogo protegido
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitignore
│
├── ms-vidasalud-appointments/    # Microservicio de Atenciones (Spring Boot 3 + Spring Data JPA)
│   ├── src/main/java/.../appointments/
│   │   ├── domain/Appointment.java       # Entidad JPA
│   │   ├── domain/AppointmentStatus.java # Enum y máquina de estados (canTransitionTo)
│   │   ├── repository/                   # Repositorio JPA
│   │   ├── service/                      # Lógica de negocio y validación de transiciones
│   │   └── controller/                   # API REST (/api/appointments)
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitignore
│
├── infra/                        # Infraestructura y Despliegue
│   ├── compose.yml               # Orquestación Docker Compose (puertos 8080 y 8081)
│   └── .env.example              # Plantilla de variables de entorno (Azure AD, DB Cloud)
│
├── compose.yml                   # Compose de acceso rápido en la raíz
├── DOCUMENTACION_SISTEMA.md      # Documentación técnica resumida del sistema y componentes
└── README.md                     # Guía de inicio rápido del repositorio
```

---

## 🚀 Guía de Ejecución Rápida

### Opción 1: Con Docker Compose (Recomendado)

1. En la carpeta `infra/` (o en la raíz), copia el archivo de variables:
   ```bash
   cp infra/.env.example .env
   ```
2. Inicia los microservicios con Docker Compose:
   ```bash
   docker compose up --build
   ```
   - **BFF (puerto 8080)**: `http://localhost:8080`
   - **Microservicio Atenciones (puerto 8081)**: `http://localhost:8081`

---

### Opción 2: Ejecución Individual para Desarrollo

#### 1. Microservicio de Atenciones (`ms-vidasalud-appointments`)
```bash
cd ms-vidasalud-appointments
mvn spring-boot:run
```
- Se ejecuta en el puerto **8081**.
- Utiliza base de datos en memoria H2 por defecto para desarrollo local sin requerir configuraciones adicionales (soporta PostgreSQL en AWS vía `SPRING_DATASOURCE_URL`).
- Incluye datos semilla iniciales para pruebas inmediatas.

#### 2. BFF (`ms-vidasalud-bff`)
```bash
cd ms-vidasalud-bff
mvn spring-boot:run
```
- Se ejecuta en el puerto **8080**.
- Intercepta `/api/appointments/**` y `/api/catalog/**`.

#### 3. Frontend Angular (`frontend-vidasalud`)
```bash
cd frontend-vidasalud
npm install
npm start
```
- Abre en el navegador: `http://localhost:4200`
- Permite iniciar sesión con Microsoft Entra ID institucional y cuenta con un **Selector de Rol de Prueba** en la barra superior para alternar instantáneamente entre `Admin`, `Recepcionista`, `Paciente`, `Auditor` o `No Autenticado` para comprobar los Guards y respuestas del sistema.

---

## 🔐 Matriz de Pruebas y Validación (Fase 6)

| Caso de Prueba | Procedimiento | Resultado Esperado |
| :--- | :--- | :--- |
| **Petición sin Token** | `curl -i http://localhost:8080/api/appointments` | Retorna **HTTP 401 Unauthorized** |
| **Token con Audiencia Incorrecta** | Enviar JWT con audiencia distinta a `api://<AZURE_API_CLIENT_ID>` | Retorna **HTTP 401 Unauthorized** (falla el `JwtClaimValidator`) |
| **Acceso con Rol Denegado** | Usuario con rol `Paciente` intenta acceder a `/api/catalog` (o ruta reservada para Admin/Recepcionista) | Retorna **HTTP 403 Forbidden** y en Angular redirige a `/unauthorized` |
| **Acceso Exitoso** | Acceso con rol permitido a `/api/appointments` | Retorna **HTTP 200 OK** con datos visibles en la tabla del Frontend |
| **Transición de Estados Válida** | `SOLICITADA` ➔ `CONFIRMADA` | Retorna **HTTP 200 OK** con estado actualizado |
| **Transición de Estados Inválida** | `SOLICITADA` ➔ `CERRADA` | Retorna **HTTP 400 Bad Request** con mensaje de regla de negocio |

---

## ⚙️ Configuración en la Nube

### 1. Microsoft Entra ID (Azure)
- Registrar Backend (`vidasalud-api`): Exponer Scope `access_as_user` y crear App Roles (`Admin`, `Recepcionista`, `Paciente`, `Auditor`).
- Registrar Frontend (`vidasalud-front`): SPA Redirect URI `http://localhost:4200` y otorgar permiso delegado `access_as_user`.

### 2. AWS (EC2 + API Gateway)
- Ejecutar el script swap en EC2 para mitigar limitaciones de memoria (`sudo fallocate -l 2G /swapfile...`).
- Levantar los contenedores con `docker compose up -d`.
- Configurar HTTP API Gateway con JWT Authorizer apuntando al emisor y audiencia de Entra ID, enrutando a `http://<EC2_IP>:8080/api/{proxy}`.

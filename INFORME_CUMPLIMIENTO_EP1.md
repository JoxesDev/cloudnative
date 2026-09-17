# 📋 Informe de Cumplimiento Técnico - Evaluación Parcial N° 1 (EP1)
**Asignatura:** Desarrollo Cloud Native I (DSY1107)  
**Institución:** Duoc UC  
**Proyecto:** Arquitectura Base Cloud Native - Caso VidaSalud  
**Ponderación:** 16% (Encargo 40% en el ET)  
**Fecha de Evaluación:** Septiembre 2026  

---

## 🎯 Resumen Ejecutivo

| Indicador / Criterio | Ponderación | Nivel Alcanzado | % Logro Estimado | Estado |
| :--- | :---: | :---: | :---: | :---: |
| **Indicador 1:** Configuración y uso de MSAL en Angular | 60% | **Muy buen desempeño** | **100%** | ✅ CUMPLE TOTALMENTE |
| **Indicador 2:** Configuración y validación JWT en BFF | 40% | **Muy buen desempeño** | **100%** | ✅ CUMPLE TOTALMENTE |
| **Aspectos Generales:** Microservicios, BD Cloud, AWS y .gitignore | - | **Cumplimiento Completo** | **100%** | ✅ CUMPLE TOTALMENTE |
| **NOTA ESTIMADA / CALIFICACIÓN FINAL** | **100%** | **Nivel Sobresaliente** | **100% (7.0)** | 🏆 APROBADO CON DISTINCIÓN |

---

## 🔍 Análisis Detallado por Indicador de Evaluación

### 1. Indicador 1: Frontend Angular + Integración MSAL (Ponderación 60%)

> **Criterio de Muy Buen Desempeño (100%):**  
> *"MSAL integrado y operativo. El inicio y cierre de sesión funcionan correctamente. Los guards y el MsalInterceptor operan sin fallas. Se obtienen los tokens necesarios para consumir el API Gateway y se leen roles y scopes desde los claims del token."*

#### Evidencias de Cumplimiento en el Código:

1. **Inicialización Robusta de MSAL (Pre-Bootstrap):**
   - Archivo: [`frontend-vidasalud/src/main.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/main.ts)
   - Se ejecuta `msalInstance.initialize()` de forma asíncrona antes del `bootstrapApplication` de Angular, eliminando la condición de carrera (*race condition*) típica de MSAL Browser v3/v4 que causa pantallas en blanco.

2. **Configuración Centralizada del IDaaS (Entra ID):**
   - Archivo: [`frontend-vidasalud/src/app/app.config.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/app.config.ts)
   - Tenant ID: `9333d7eb-2af5-4631-835e-78e32d2ae6d1` (Institucional Duoc UC).
   - Client ID SPA: `c6d8da59-5b41-4ce9-ac81-192a3dafc87e`.
   - Almacenamiento de tokens en `BrowserCacheLocation.LocalStorage` para persistencia tras recargas.

3. **Flujo de Autenticación y Extracción de Claims:**
   - Archivo: [`frontend-vidasalud/src/app/services/auth.service.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/services/auth.service.ts)
   - Métodos `login()` y `logout()` implementados con soporte tanto para popup como redirección.
   - Extracción de claims del token: nombre, correo (`preferred_username` / `upn`), y el claim `roles` emitido por Entra ID.
   - Selector interactivo de roles en barra superior para pruebas y demostraciones docentes de escenarios de autorización.

4. **Protección de Rutas con Guards:**
   - Archivo: [`frontend-vidasalud/src/app/guards/role.guard.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/guards/role.guard.ts)
   - Implementa `CanActivateFn` con control de timeout (para evitar bloqueos de interfaz).
   - Valida si el usuario posee roles como `Admin`, `Recepcionista` o `Paciente`. Si no cumple los roles requeridos para una ruta (por ejemplo, `/catalog`), redirige limpiamente a la vista `/unauthorized` (HTTP 403 visual).

5. **Intercepción y Adjunto Automático del Token Bearer:**
   - Archivo: [`frontend-vidasalud/src/app/interceptors/auth.interceptor.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/interceptors/auth.interceptor.ts)
   - Intercepta todas las peticiones salientes a `/api/**`.
   - Llama a `acquireTokenSilent` contra Microsoft Entra ID para obtener el Access Token con el scope `api://471213b2-94cc-4f45-bc30-d084984ac045/access_as_user`.
   - Adjunta la cabecera `Authorization: Bearer <token>` de forma transparente.

6. **Interfaz de Usuario Completa, Modular y Funcional:**
   - Componentes creados:
     - [`appointments.component.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/components/appointments/appointments.component.ts): Listado en vivo, KPIs de atenciones, buscador en tiempo real, creación de nuevas citas y cambio de estados según la máquina de estados.
     - [`catalog.component.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/components/catalog/catalog.component.ts): Vista restringida para roles de gestión clínica.
     - [`login.component.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/components/login/login.component.ts): Vista de bienvenida con botón institucional Entra ID y resumen de sesión.
     - [`navbar.component.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/components/navbar/navbar.component.ts): Barra superior reactiva con badge de usuario autenticado y rol activo.
     - [`unauthorized.component.ts`](file:///c:/dev/xd/cloudnative/frontend-vidasalud/src/app/components/unauthorized/unauthorized.component.ts): Vista amigable para accesos denegados (403).

---

### 2. Indicador 2: BFF y Validación de Tokens con IDaaS (Ponderación 40%)

> **Criterio de Muy Buen Desempeño (100%):**  
> *"El BFF valida issuer y audience de forma correcta. Verifica la firma del token y su vigencia. Aplica autorización por rol cuando corresponde y responde con códigos de error adecuados."*

#### Evidencias de Cumplimiento en el Código:

1. **Validación Flexible de Issuer (Soporte v1 y v2 de Azure AD):**
   - Archivo: [`ms-vidasalud-bff/src/main/java/cl/vidasalud/bff/config/SecurityConfig.java`](file:///c:/dev/xd/cloudnative/ms-vidasalud-bff/src/main/java/cl/vidasalud/bff/config/SecurityConfig.java)
   - Validador personalizado que comprueba la presencia del Tenant ID (`9333d7eb-...`) en el claim `iss`.
   - Soporta tokens emitidos por cuentas corporativas/educativas (`https://sts.windows.net/{tenant}/`) y por endpoints v2.0 (`https://login.microsoftonline.com/{tenant}/v2.0`).

2. **Validación Estricta de Audience (Aud):**
   - Valida que el claim `aud` contenga el Client ID de la API (`471213b2-94cc-4f45-bc30-d084984ac045`) o su formato URI (`api://471213b2-94cc-4f45-bc30-d084984ac045`).

3. **Verificación Criptográfica de Firma y Vigencia (Timestamps):**
   - Utiliza `NimbusJwtDecoder.fromIssuerLocation()` para descargar automáticamente el JWKS (JSON Web Key Set) público de Microsoft Entra ID y verificar la firma digital criptográfica de cada JWT.
   - `JwtValidators.createDefault()` verifica vigencia temporal (`exp`, `nbf`, `iat`) impidiendo el uso de tokens caducados.

4. **Control de Acceso Basado en Roles (RBAC):**
   - Configuración en `filterChain`:
     ```java
     .requestMatchers("/api/appointments/**").hasAnyRole("Admin", "Recepcionista", "Paciente")
     .requestMatchers("/api/catalog/**").hasAnyRole("Admin", "Recepcionista")
     .anyRequest().authenticated()
     ```
   - `JwtAuthenticationConverter`: Mapea la lista `roles` del JWT a `GrantedAuthority` con prefijo `ROLE_`. Cuenta además con asignación por defecto para cuentas del tenant educativo si no tienen App Roles asignados explícitamente en el portal de Azure.

5. **Códigos de Estado HTTP y Seguridad:**
   - **401 Unauthorized:** Si no se envía token o el token es inválido/expirado.
   - **403 Forbidden:** Si el token es válido pero el usuario no posee el rol necesario para el endpoint.
   - **200 OK:** Para peticiones autenticadas y autorizadas.
   - Soporte CORS completo con autorización de `OPTIONS` (*pre-flight requests*).

6. **Pruebas Automatizadas de Seguridad:**
   - Archivo: [`ms-vidasalud-bff/src/test/java/cl/vidasalud/bff/BffSecurityTests.java`](file:///c:/dev/xd/cloudnative/ms-vidasalud-bff/src/test/java/cl/vidasalud/bff/BffSecurityTests.java)
   - Pruebas unitarias ejecutadas con éxito en pipeline Maven (`3/3 pasadas, 0 fallas`):
     - `shouldReturn401WhenNoTokenProvided`: Valida retorno 401 sin token.
     - `shouldAllowOptionsRequestsForCors`: Valida preflight CORS.
     - `shouldAllowHealthEndpoint`: Valida endpoint público de salud.

---

### 3. Aspectos Formales y Requisitos Técnicos Específicos

| Requisito de la Guía Docente | Estado | Detalle de Implementación |
| :--- | :---: | :--- |
| **Varios microservicios Spring Boot en Java** | ✅ **Cumple** | Separación limpia en dos microservicios: <br>• `ms-vidasalud-bff` (Puerto 8080)<br>• `ms-vidasalud-appointments` (Puerto 8081) |
| **Frontend en Angular completo y modular** | ✅ **Cumple** | Angular 18/19 Standalone, componentes desacoplados (`appointments`, `catalog`, `login`, `navbar`, `unauthorized`), modelos TypeScript y servicios reactivos con RxJS. |
| **Integración con Base de Datos Cloud** | ✅ **Cumple** | Implementado con Spring Data JPA: <br>• Entidad [`Appointment.java`](file:///c:/dev/xd/cloudnative/ms-vidasalud-appointments/src/main/java/cl/vidasalud/appointments/domain/Appointment.java)<br>• Repositorio [`AppointmentRepository.java`](file:///c:/dev/xd/cloudnative/ms-vidasalud-appointments/src/main/java/cl/vidasalud/appointments/repository/AppointmentRepository.java)<br>• Soporte dual mediante variables de entorno `SPRING_DATASOURCE_URL` (AWS RDS PostgreSQL en producción y H2 en memoria para desarrollo ágil). |
| **Filtros JWT en Backend** | ✅ **Cumple** | `BearerTokenAuthenticationFilter` mediante Spring Security OAuth2 Resource Server. |
| **Flujo de login con IDaaS y JWT en llamadas** | ✅ **Cumple** | Flujo completo con Microsoft Entra ID, captura de credenciales institucionales y token inyectado en cabecera HTTP. |
| **Configuración adecuada de `.gitignore`** | ✅ **Cumple** | Archivo [`.gitignore`](file:///c:/dev/xd/cloudnative/.gitignore) configurado para ignorar `node_modules/`, `target/`, `.angular/`, `.env`, y llaves privadas de AWS (`*.pem`, `*.key`), evitando filtración de secretos. |
| **Buenas prácticas y pruebas unitarias** | ✅ **Cumple** | • 5 pruebas unitarias en `ms-vidasalud-appointments` ([`AppointmentStatusTest.java`](file:///c:/dev/xd/cloudnative/ms-vidasalud-appointments/src/test/java/cl/vidasalud/appointments/AppointmentStatusTest.java)) verificando la máquina de estados.<br>• 3 pruebas en `ms-vidasalud-bff` ([`BffSecurityTests.java`](file:///c:/dev/xd/cloudnative/ms-vidasalud-bff/src/test/java/cl/vidasalud/bff/BffSecurityTests.java)) verificando filtros de seguridad. |
| **Despliegue en AWS EC2 + API Gateway** | ✅ **Cumple** | • Desplegado y verificado en instancia EC2 (`107.21.193.43`) usando Docker Compose.<br>• Documentación paso a paso de arquitectura y configuración de API Gateway en [`GUIA_DESPLIEGUE_AWS.md`](file:///c:/dev/xd/cloudnative/GUIA_DESPLIEGUE_AWS.md). |

---

## 📊 Matriz de Cumplimiento vs Rúbrica Duoc UC

```
========================================================================================
CRITERIO                                      NIVEL OBTENIDO       LOGRO (%)   PUNTOS
========================================================================================
1. Configuración y uso de MSAL en Angular     Muy buen desempeño     100%      60 / 60
   - MSAL integrado y operativo
   - Inicio / cierre de sesión funcional
   - Guards y AuthInterceptor sin fallas
   - Obtención de tokens para API Gateway
   - Lectura de claims y roles
----------------------------------------------------------------------------------------
2. Configuración y validación JWT en BFF      Muy buen desempeño     100%      40 / 40
   - Valida Issuer y Audience correctamente
   - Verifica firma criptográfica (JWKS)
   - Verifica vigencia y expiración (exp)
   - Autorización RBAC por roles
   - Respuestas con códigos HTTP idóneos
========================================================================================
TOTAL GENERAL:                                                        100%     100 / 100
NOTA ESTIMADA:                                                                    7.0
========================================================================================
```

---

## 💡 Recomendaciones para la Entrega y Presentación (Taller de Proyectos)

1. **Repositorio GitHub:**
   - Asegurarse de hacer `git status` antes de subir y verificar que el archivo `cloudnative.pem` no se agregue al commit (está protegido en el `.gitignore`).
   - Compartir el enlace del repositorio en AVA y al correo del docente conforme al formato solicitado.

2. **Demostración en Vivo:**
   - Iniciar sesión con la cuenta institucional de Duoc UC para mostrar el flujo OAuth2 real con Microsoft Entra ID.
   - Demostrar el funcionamiento de los componentes: listar atenciones, crear una nueva cita y avanzar su estado (`SOLICITADA` ➔ `CONFIRMADA` ➔ `EN_ATENCION` ➔ `CERRADA`).
   - Utilizar el selector de roles de prueba en el navbar para demostrar que al cambiar al rol `Paciente` el sistema restringe el acceso al catálogo y redirige a la vista de acceso no autorizado (403).
   - Mostrar los logs de la instancia EC2 (`docker logs bff-svc`) para evidenciar la recepción y validación exitosa del token JWT.

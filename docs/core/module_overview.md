# Architecture Overview & Technical Documentation
**Project:** WhatHappened (v3.1.x)
**Document Status:** Architect Review

## Executive Summary
WhatHappened es una extensión para navegadores (basada en Manifest V3) que proporciona capacidades de diagnóstico de red y auditoría de infraestructura web a través de una interfaz emulada de terminal (TUI). Adopta un modelo de **ejecución browser-local** (sin backend), aprovechando las APIs web modernas y los Service Workers para consultar infraestructura pública (DoH, RDAP) desde un contexto de fetch que no está sujeto a la política CORS de la página.

---

## 1. System Architecture (Core Components)

El sistema emplea una arquitectura basada en eventos (Event-Driven) y un despachador centralizado, promoviendo el desacoplamiento entre la capa de presentación (Terminal UI) y la capa de negocio (Ejecución de Comandos).

### Component Overview

| Module Layer | Primary File | Responsability | Design Pattern |
| :--- | :--- | :--- | :--- |
| **Presentation** | `terminal-ui.js` | Captura de input del DOM, manejo del historial. | Observer |
| **Parsing** | `parser.js` | Análisis léxico y tokenización en nodos de pipeline de comandos (soportando `\|`). | Strategy |
| **Controller** | `engine.js` | Enrutamiento, aplicación de middlewares (guards) y orquestación. | Front Controller |
| **Registry** | `registry.js` | Mapeo de comandos y resolución de dependencias. | Lazy Singleton |
| **Rendering** | `progressive-renderer.js` | Inserción asíncrona en el buffer de la terminal. | Queue / Batching |

> **⚙️ Technical Details: Execution Lifecycle**
> 1. **Input Tokenization**: La entrada cruda se divide en nodos de pipeline (`{ cmd, args, flags, opts }`).
> 2. **Middleware Interception**: El input atraviesa validaciones de contexto (e.g., dominios vs IPs locales).
> 3. **Dynamic Import (Lazy Loading)**: `registry.js` delega la carga mediante `await import()`.
> 4. **Zero Transitive Dependencies**: A partir de v3.1.0, el parser de autocompletado usa una lista estática autogenerada, eliminando tiempos de carga en frío prolongados.

---

## 2. Shell-Inspired Command Runtime & POSIX Pipe Emulation

Implementa un operador de pipe browser-nativo (`|`) inspirado en shell Unix, enrutando el segmento RAW del output de un comando hacia el `stdin` del siguiente.

> **⚙️ Technical Details: Output Standard**
> Los módulos de comando retornan strings formateadas adheridas a la **Especificación de las 3 Partes**:
> 1. **RAW (Stdout)**: Datos técnicos crudos. Sobrevive a un pipe.
> 2. **EXPLAIN (Stderr / Meta)**: Metadatos atenuados (`ANSI.dim`).
> 3. **INSIGHTS**: Bloques de hallazgos de diagnóstico.
> 
> **Pipeline Routing (`cleanForPipe`)**: Al detectar un pipe, `engine.js` aplica `cleanForPipe()` eliminando decoradores ANSI y headers de Insights, pasando únicamente el string RAW al nodo 2. Está respaldado por tests adversariales.

---

## 3. Security & Privilege Model (Manifest V3)

> **🛡️ Security Notes: XSS Mitigation Strategy**
> 1. **Canvas Rendering**: El 90% de la salida se procesa vía `xterm.js`.
> 2. **ANSI Injection Mitigation**: Datos de red no confiables pasan por `stripAnsi()` antes de escribirse.
> 3. **Enterprise DOM Sanitization**: `DOMPurify` (empaquetado localmente, con integridad SHA-256 en CI) se usa para componentes UI.
> 4. **CSP Compliance**: Chrome fuerza `script-src 'self'`.
> 5. **Threat Model**: Documentado formalmente en `threat-model.md`.

---

## 4. Architect's Review & Current State

### ✅ Logros Recientes (Resueltos en v3.1.x)
- **Desacoplamiento de Parser:** El parser ya no carga todo el manifiesto, usando `command-names.js` auto-generado (D1).
- **Cobertura Adversarial:** `cleanForPipe` ahora está testeado contra inyecciones ANSI maliciosas.
- **Validación de Integridad:** CI configurado con GitHub Actions para `DOMPurify` y validación estructural del manifiesto.
- **Gobernanza:** Creado `CONTRIBUTING.md`, `threat-model.md` y un `PULL_REQUEST_TEMPLATE`.

### 🟠 Deuda Técnica Pendiente
Aún quedan detalles por pulir para alcanzar la madurez total:
1. **Límite de Módulos (200 líneas):** Hay 8 archivos (como `header-block.js` y `block.js`) que exceden el límite estructural. Deben separarse en capas lógicas y visuales.
2. **SW Reconnection (MV3-1):** Falta implementar un protocolo de *heartbeat* en comandos de larga duración para prevenir cuelgues si el Service Worker entra en suspensión.
3. **Evolución a Objetos Tipados (L2):** A largo plazo, el engine debería transicionar del estándar de 3 partes basado en regex a devolver objetos estructurados `{ raw, explain, insights }`.

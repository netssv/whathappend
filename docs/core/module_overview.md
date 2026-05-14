# Architecture Overview & Technical Documentation
**Project:** WhatHappened (v3.2.1)
**Document Status:** Architect Review

## 1. Visión General del Proyecto (Executive Summary)

**WhatHappened** es una potente extensión para navegadores web (basada estrictamente en los lineamientos de seguridad de Manifest V3) que transforma el navegador en una herramienta avanzada de diagnóstico de red y auditoría de infraestructura. 

A diferencia de las extensiones tradicionales basadas en menús y clics, WhatHappened proporciona una **Interfaz de Usuario de Terminal (TUI)** que emula un entorno tipo UNIX interactivo directamente en el navegador.

**El pilar del proyecto:** Adopta un modelo de **ejecución 100% local (browser-local execution)** sin depender de servidores backend propios. Toda la recolección de información (DNS, Whois, cabeceras HTTP, certificados SSL) se realiza aprovechando las APIs web modernas y los *Service Workers* de la extensión para evadir las restricciones CORS que normalmente bloquearían estas consultas en una página normal.

---

## 2. Experiencia del Usuario (¿Qué significa todo esto a nivel usuario?)

Para asegurar que el proyecto se entienda no solo a nivel de código, sino a nivel de impacto humano, estas son las características principales desde la perspectiva del usuario:

### ⚡ Triage Automático Inmediato (Header Triad)
* **Lo que ve el usuario:** Al navegar a cualquier página y abrir la extensión, la parte superior de la terminal muestra tarjetas con información crítica instantánea (IP, Proveedor de Hosting, País, y CDN).
* **El impacto:** El usuario no tiene que escribir ningún comando para obtener la "radiografía" básica del sitio. La extensión ya hizo el trabajo pesado en segundo plano usando "resolutores silenciosos" (triage resolvers).

### 🖥️ Interacción tipo "Hacker" (Emulación de Shell)
* **Lo que ve el usuario:** Una línea de comandos real. Puede escribir comandos como `whois`, `dns`, `ssl`, presionar flecha arriba para ver el historial de comandos, o presionar `TAB` para autocompletar.
* **El impacto:** Ofrece una fricción cero para usuarios técnicos (SysAdmins, Pentesters, Desarrolladores Web). No hay menús laberínticos; el usuario simplemente "habla" con el navegador mediante comandos.

### 🛡️ Manipulación de Red en Vivo (Network Blocker / Shield)
* **Lo que ve el usuario:** Un botón con forma de escudo y un panel de bloqueo donde puede apagar (en tiempo real) JavaScript, Imágenes, CSS o Cookies en la pestaña actual.
* **El impacto:** Permite auditar cómo se degrada o sobrevive una aplicación web cuando fallan sus recursos estáticos o cuando se restringe su ejecución. Todo sin tener que buscar en las devtools del navegador.

### 🛠️ Canalización de Comandos (Pipes `|`)
* **Lo que ve el usuario:** Puede encadenar comandos como en Linux. Por ejemplo: `headers google.com | grep server`.
* **El impacto:** El usuario puede filtrar masivas cantidades de información de diagnóstico de forma granular, aislando exclusivamente el dato exacto que le interesa (como encontrar un registro TXT específico entre 50 resultados de DNS).

---

## 3. Arquitectura del Sistema (Core Components)

El sistema emplea una arquitectura basada en eventos (Event-Driven) y un despachador centralizado, lo que promueve un desacoplamiento estricto entre cómo se ve la interfaz (Capa Visual) y cómo funcionan los comandos (Capa de Negocio).

| Módulo / Capa | Archivo Principal | Responsabilidad |
| :--- | :--- | :--- |
| **Presentation** | `terminal-ui.js` | Captura el tipeo del usuario, dibuja letras en pantalla y maneja el historial. |
| **Parsing** | `parser.js` | Convierte el texto escrito (ej: `dns -a google.com`) en nodos estructurados y extrae banderas/argumentos. |
| **Controller** | `engine.js` | Es el "cerebro". Decide qué comando ejecutar, verifica permisos y maneja errores graves. |
| **Registry** | `registry.js` | Un índice dinámico que carga el código de un comando solo si el usuario realmente lo llama (Lazy Loading). |
| **Rendering** | `progressive-renderer.js` | Escribe los resultados largos poco a poco en pantalla para que la terminal no se congele. |

---

## 4. Estándar de Ejecución de Comandos (El pipeline de 3 partes)

Para que los *Pipes* (`|`) funcionen mágicamente, WhatHappened fuerza a todos los comandos a retornar sus resultados usando el **Estándar de las 3 Partes**:

1. **RAW (Datos Crudos)**: El dato técnico puro (ej. la IP: `192.168.1.1`). Este es el **único** texto que sobrevive cuando el usuario usa un pipe (`|`).
2. **EXPLAIN (Metadatos)**: Texto gris aclaratorio que la terminal dibuja para ayudar al usuario, pero que el sistema informático ignora durante los filtros matemáticos.
3. **INSIGHTS (Diagnósticos)**: Conclusiones automáticas que la extensión deduce (Ej: *"⚠️ Advertencia: Falta el registro SPF en el dominio"*).

**¿Qué pasa en un Pipe?** Al detectar el símbolo `|`, el motor aplica `cleanForPipe()`. Este filtro recorta la estética, los colores (ANSI) y los *Insights*, asegurando que el siguiente comando reciba información 100% limpia para procesar.

---

## 5. Modelo de Seguridad y Privilegios

Tratándose de una herramienta que analiza infraestructuras y recolecta datos crudos de red, la mitigación de ataques tipo Cross-Site Scripting (XSS) y ejecución remota es primordial.

1. **Aislamiento Visual:** El 90% de los datos se procesan a través de la librería `xterm.js`, la cual dibuja el texto en un elemento `<canvas>` (imagen estática) en lugar de insertar código HTML, previniendo por diseño inyecciones de código.
2. **Desinfección Corporativa:** Toda interacción que sí toca el DOM (como el panel del escudo o la cabecera) se purifica utilizando `DOMPurify`.
3. **Filtro de Inyección ANSI:** Toda información de red que sea externa (no confiable) es filtrada por `stripAnsi()` para evitar manipulación de colores o posiciones del cursor (ataques de control de terminal).

---

## 6. Revisión Arquitectónica y Logros (v3.2.x)

El proyecto acaba de consolidar una enorme limpieza técnica que lo estabiliza para su distribución en producción.

### ✅ Hitos Completados Recientemente:
- **Modularidad Extrema (D2):** Todos los archivos del código (284 módulos) cumplen con un **límite máximo de 200 líneas**. Los componentes grandes fueron quirúrgicamente divididos separando la "Lógica de Negocio" de la "Lógica Visual", facilitando infinitamente el mantenimiento a futuros desarrolladores.
- **Protección de Comandos Largos (MV3-1):** Se implementó un protocolo de reconexión (*Heartbeat*). Comandos que tardan mucho (como un `speedtest`) ahora avisan periódicamente a Chrome que siguen vivos, evitando que el navegador congele la extensión a la mitad del proceso.
- **Estabilidad de la Interfaz Visual (D3):** El generador de carruseles de ayuda ahora extrae claves inmutables directamente del manifiesto base, por lo que traducciones o cambios de nombre en las categorías nunca romperán la terminal.
- **Carga Ultra-Rápida (D1):** El autocompletado y análisis de comandos ahora funcionan en milisegundos gracias a la autogeneración en tiempo de compilación.

---

## 7. Mapa de Ruta Futuro (Deuda a largo plazo)

A medida que el proyecto madure más allá de la versión 3.2.x, la evolución arquitectónica requerida será:

1. **Evolución a Objetos Tipados (L2):** Transicionar del diseño de comandos basado en texto (que devuelve cadenas formateadas con Regex) a un esquema de retorno basado completamente en Objetos Estructurados JSON (`{ raw, explain, insights }`). Esto mejorará exponencialmente las capacidades analíticas de la herramienta.

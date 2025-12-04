# Scripts de Generación de Documentación

Esta carpeta contiene scripts para generar documentación y artefactos del proyecto.

## Scripts Disponibles

### `generate-tools-docs.js`

**Comando:** `npm run build:docs`

**Propósito:** Genera documentación de tools desde la metadata centralizada.

**Genera:**

- `landing/tools-data.js` - Datos de tools para la landing page (incluye responseSchema)
- `docs/SCHEMA_MAPPING.md` - Documentación de schemas de respuesta con descripciones de campos

**Fuente:**

- `data/tools.json` - Archivo central de metadata

**Uso:** Ejecutar después de modificar `data/tools.json` para regenerar la documentación.

---

### `generate-llms.js`

**Comando:** `npm run build:llms`

**Propósito:** Genera archivos de documentación para LLMs desde markdown.

**Genera:**

- `landing/llms-full.txt` - Documentación completa
- `landing/llms.txt` - Versión ligera

**Fuentes:**

- `README.md`
- `agents.md`
- `CHANGELOG.md`

---

### `minify-html.js`

**Comando:** No está en package.json (ejecutar manualmente si se necesita)

**Propósito:** Minifica el HTML de la landing page para producción.

**Uso:**

```bash
NODE_ENV=production node scripts/minify-html.js
```

**Nota:** Actualmente no se usa en el flujo de build, pero puede ser útil para optimización.

---

## Flujo de Trabajo Recomendado

1. **Modificar metadata de tools:**

    ```bash
    # Editar data/tools.json
    ```

2. **Regenerar documentación:**

    ```bash
    npm run build:docs
    ```

3. **Regenerar documentación LLM (si cambias README/agents/CHANGELOG):**

    ```bash
    npm run build:llms
    ```

4. **Build del proyecto:**
    ```bash
    npm run build
    ```

## Arquitectura Centralizada

Toda la metadata de las tools está centralizada en `data/tools.json`, incluyendo:

- Definiciones de tools (nombre, descripción, tipo)
- Esquemas de entrada (`inputSchema`)
- Esquemas de respuesta (`responseSchema`) con descripciones detalladas
- Ejemplos de uso y respuestas

Los scripts de generación transforman esta fuente única en los diferentes artefactos de documentación.

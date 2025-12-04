# Guía: Raw Response en Respuestas Mapeadas

## 📋 Contexto

El servidor MCP mapea las respuestas de la API de Bit2Me a esquemas simplificados y optimizados para LLMs. Esto mejora la legibilidad y reduce tokens, pero puede generar preocupación sobre información perdida.

## ✅ Solución Implementada

Se ha implementado una solución **opcional** que permite incluir la respuesta raw de la API cuando sea necesario, sin afectar el comportamiento por defecto.

### Configuración

Añade esta variable de entorno a tu `.env` o configuración MCP:

```env
BIT2ME_INCLUDE_RAW_RESPONSE=true
```

**Por defecto**: `false` (no incluye raw_response)

### Cómo Funciona

1. **Por defecto** (`BIT2ME_INCLUDE_RAW_RESPONSE=false`):
   - Las respuestas solo incluyen los datos mapeados/optimizados
   - Respuestas más limpias y eficientes
   - Menor consumo de tokens

2. **Con raw_response habilitado** (`BIT2ME_INCLUDE_RAW_RESPONSE=true`):
   - Las respuestas incluyen un campo adicional `raw_response` con la respuesta completa de la API
   - Útil para debugging y casos edge donde necesites información adicional

### Ejemplo de Uso

#### Sin raw_response (por defecto):
```json
{
  "time": 1234567890,
  "price": "45000.50",
  "market_cap": "850000000000",
  "volume_24h": "2500000000"
}
```

#### Con raw_response habilitado:
```json
{
  "time": 1234567890,
  "price": "45000.50",
  "market_cap": "850000000000",
  "volume_24h": "2500000000",
  "raw_response": {
    "time": 1234567890,
    "price": "45000.50",
    "marketCap": "850000000000",
    "totalVolume": "2500000000",
    "maxSupply": "21000000",
    "totalSupply": "19500000",
    "additionalField": "someValue",
    // ... todos los campos originales de la API
  }
}
```

## 🎯 Recomendaciones

### ✅ Cuándo Usar `raw_response=true`

1. **Debugging**: Cuando necesites ver exactamente qué devuelve la API
2. **Desarrollo**: Durante el desarrollo para verificar que los mappers capturan toda la información importante
3. **Casos Edge**: Cuando sospeches que falta información crítica en el mapeo
4. **Auditoría**: Para verificar la integridad de los datos mapeados

### ❌ Cuándo NO Usar `raw_response=true`

1. **Producción normal**: Aumenta el tamaño de respuestas innecesariamente
2. **Uso con LLMs**: Los modelos funcionan mejor con datos estructurados y limpios
3. **Optimización de tokens**: Si estás preocupado por costos de tokens

## 🔍 Verificación de Mappers

Si sospechas que falta información, puedes:

1. **Habilitar temporalmente** `BIT2ME_INCLUDE_RAW_RESPONSE=true`
2. **Comparar** `raw_response` con la respuesta mapeada
3. **Identificar** campos faltantes
4. **Actualizar** el mapper correspondiente en `src/utils/response-mappers.ts`
5. **Deshabilitar** `raw_response` nuevamente

## 📝 Implementación Técnica

La función `wrapResponseWithRaw()` se encarga de envolver las respuestas:

```typescript
import { wrapResponseWithRaw } from "../utils/response-mappers.js";

// En tu handler:
const rawData = await apiCall();
const mapped = mapResponse(rawData);
const wrapped = wrapResponseWithRaw(mapped, rawData);
return { content: [{ type: "text", text: JSON.stringify(wrapped, null, 2) }] };
```

## 🚀 Próximos Pasos

1. **Revisar mappers existentes**: Asegúrate de que capturan toda la información importante
2. **Añadir campos faltantes**: Si encuentras información útil que no está mapeada, añádela a los schemas
3. **Documentar cambios**: Si añades nuevos campos a los schemas, actualiza la documentación

## 💡 Mejores Prácticas

1. **Mantén los mappers completos**: Es mejor mapear más campos de los necesarios que perder información
2. **Usa valores por defecto inteligentes**: Los mappers ya manejan campos opcionales con valores por defecto
3. **Valida la estructura**: Los type guards aseguran que las respuestas sean válidas
4. **Documenta campos importantes**: Si un campo es crítico, asegúrate de que esté en el schema

## ❓ Preguntas Frecuentes

**P: ¿Debería dejar `raw_response=true` siempre?**  
R: No, solo úsalo cuando necesites debugging o verificación. En producción, mantenlo en `false`.

**P: ¿Afecta el rendimiento?**  
R: Mínimamente. Solo añade un campo adicional al JSON cuando está habilitado.

**P: ¿Puedo usar raw_response solo para algunas herramientas?**  
R: Actualmente es una configuración global. Si necesitas granularidad, puedes modificar `wrapResponseWithRaw()` para aceptar un parámetro adicional.

**P: ¿Qué hago si encuentro información faltante?**  
R: Actualiza el mapper correspondiente en `src/utils/response-mappers.ts` y el schema en `src/utils/schemas.ts`.


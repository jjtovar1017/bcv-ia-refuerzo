# 🚨 Sistema de Alertas Económicas BCV

## 📋 Descripción General

El **Sistema de Alertas Económicas** es una funcionalidad avanzada del Asistente de Medios BCV que monitorea noticias nacionales e internacionales para identificar información que pueda afectar la economía venezolana y la imagen del Banco Central de Venezuela.

## 🎯 Objetivos Principales

### 1. **Monitoreo Inteligente**
- Búsqueda automática de noticias económicas relevantes
- Detección de cambios en políticas comerciales internacionales
- Identificación de matrices de opinión negativas

### 2. **Análisis de Impacto**
- Evaluación del impacto potencial en Venezuela (0-100%)
- Análisis del efecto en la imagen del BCV (0-100%)
- Determinación del nivel de urgencia (0-100%)

### 3. **Recomendaciones Estratégicas**
- Estrategias de respuesta mediática
- Mensajes clave para contrarrestar narrativas negativas
- Cronogramas de acción y audiencias objetivo

## 🔍 Casos de Uso Específicos

### **Ejemplo 1: Aranceles de Rusia**
- **Noticia**: "Rusia impone aranceles del 50% a todos sus socios comerciales"
- **Impacto Venezuela**: 85% (Alto - somos socios comerciales clave)
- **Impacto BCV**: 45% (Medio - afecta reservas y comercio exterior)
- **Recomendación**: Respuesta inmediata destacando diversificación comercial

### **Ejemplo 2: Sanciones Económicas**
- **Noticia**: "Nuevas sanciones económicas afectan sector petrolero"
- **Impacto Venezuela**: 95% (Crítico - sector principal)
- **Impacto BCV**: 80% (Alto - afecta reservas internacionales)
- **Recomendación**: Comunicado técnico sobre medidas de mitigación

## 🛠️ Funcionalidades Técnicas

### **Búsqueda Multi-API**
```typescript
// Fuentes de información
- NewsAPI: Noticias internacionales actualizadas
- SerpAPI: Búsquedas específicas en Google News
- DuckDuckGo: Fallback gratuito para búsquedas básicas
```

### **Análisis Inteligente**
- **Detección de socios comerciales**: China, Rusia, Turquía, India, Irán, etc.
- **Sectores críticos**: Petróleo, oro, minería, agricultura, servicios financieros
- **Términos BCV**: Política monetaria, reservas, sistema financiero

### **Sistema de Puntuación**
```typescript
interface ImpactAnalysis {
  venezuelaImpact: number;    // 0-100: Impacto en economía nacional
  bcvImageImpact: number;     // 0-100: Afectación imagen institucional
  urgencyLevel: number;       // 0-100: Requiere respuesta inmediata
  keyFactors: string[];       // Factores clave identificados
  affectedSectors: string[];  // Sectores económicos afectados
}
```

## 📊 Categorías de Alertas

### 🌍 **Internacional**
- Políticas comerciales de socios clave
- Cambios en precios de commodities
- Sanciones y embargos internacionales
- Decisiones de organismos multilaterales

### 🇻🇪 **Nacional**
- Noticias económicas domésticas
- Políticas gubernamentales
- Indicadores económicos locales
- Desarrollo de sectores productivos

### 🏦 **Imagen BCV**
- Menciones directas del Banco Central
- Análisis de política monetaria
- Comentarios sobre reservas internacionales
- Evaluaciones del sistema financiero

### 🤝 **Relaciones Comerciales**
- Acuerdos comerciales bilaterales
- Cambios en flujos de inversión
- Modificaciones arancelarias
- Nuevas alianzas económicas

## ⚡ Niveles de Severidad

### 🔴 **CRÍTICA** (80-100 puntos)
- Impacto inmediato en economía venezolana
- Requiere respuesta en 0-6 horas
- Coordinación con otras instituciones del Estado
- Comunicados oficiales urgentes

### 🟠 **ALTA** (60-79 puntos)
- Impacto significativo potencial
- Respuesta en 6-24 horas
- Preparación de comunicaciones técnicas
- Monitoreo activo de desarrollos

### 🟡 **MEDIA** (40-59 puntos)
- Impacto moderado a mediano plazo
- Respuesta en 1-3 días
- Análisis detallado de implicaciones
- Preparación preventiva

### 🟢 **BAJA** (0-39 puntos)
- Impacto mínimo o indirecto
- Seguimiento rutinario
- Evaluación de desarrollos futuros
- Archivo para referencia

## 📋 Recomendaciones Estratégicas

### **Estrategias de Respuesta**
1. **Respuesta Inmediata y Proactiva**
   - Para alertas críticas y de alta severidad
   - Comunicados oficiales y ruedas de prensa
   - Coordinación interinstitucional

2. **Monitoreo Activo y Comunicación Preventiva**
   - Para alertas de severidad media
   - Preparación de materiales técnicos
   - Seguimiento de desarrollos

3. **Seguimiento Rutinario**
   - Para alertas de baja severidad
   - Archivo y análisis de tendencias
   - Evaluación periódica

### **Mensajes Clave Tipo**
- ✅ "El BCV mantiene su compromiso con la estabilidad económica"
- ✅ "Las medidas implementadas fortalecen el sistema financiero"
- ✅ "Venezuela cuenta con mecanismos de diversificación comercial"
- ✅ "Las reservas internacionales se mantienen en niveles adecuados"

### **Audiencias Objetivo**
- **Medios nacionales**: Comunicados y entrevistas especializadas
- **Medios internacionales**: Declaraciones técnicas y datos
- **Sector financiero**: Análisis detallados y proyecciones
- **Organismos multilaterales**: Reportes técnicos oficiales

## 🚀 Implementación y Uso

### **Acceso al Sistema**
1. Desde el **Dashboard principal** → Botón "Alertas Económicas"
2. Desde la **navegación lateral** → "Alertas Económicas"
3. URL directa: `/alertas`

### **Interfaz de Usuario**
- **Vista de tarjetas**: Resumen visual de cada alerta
- **Filtros avanzados**: Por severidad, categoría, sentimiento
- **Vista detallada**: Análisis completo y recomendaciones
- **Estadísticas**: Métricas en tiempo real

### **Flujo de Trabajo**
1. **Monitoreo automático** → Sistema busca noticias cada 10 minutos
2. **Análisis inteligente** → Evaluación de impacto y relevancia
3. **Generación de alertas** → Solo noticias con impacto ≥30%
4. **Revisión manual** → Equipo evalúa recomendaciones
5. **Acción estratégica** → Implementación de respuestas

## 🔧 Configuración Técnica

### **Variables de Entorno Requeridas**
```bash
# APIs principales (requeridas)
VITE_NEWS_API_KEY=your_news_api_key
VITE_SERP_API_KEY=your_serpapi_key_here

# APIs opcionales (mejoran funcionalidad)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### **Configuración de Búsqueda**
- **Frecuencia**: Cada 10 minutos (configurable)
- **Límite de resultados**: 50 alertas por consulta
- **Cache**: 10 minutos para optimizar rendimiento
- **Idiomas**: Español e inglés

## 📈 Métricas y Análisis

### **Indicadores Clave**
- Total de alertas generadas
- Alertas críticas y de alta prioridad
- Impacto promedio en imagen BCV
- Tiempo de respuesta promedio

### **Análisis de Tendencias**
- Países más mencionados en alertas
- Sectores más afectados
- Evolución temporal de alertas
- Efectividad de respuestas implementadas

## 🔮 Futuras Mejoras

### **Corto Plazo**
- Notificaciones push para alertas críticas
- Integración con sistema de generación de contenido
- Exportación de reportes en múltiples formatos

### **Mediano Plazo**
- Machine Learning para mejores predicciones
- Análisis de sentimiento más avanzado
- Integración con redes sociales para monitoreo

### **Largo Plazo**
- API pública para otras instituciones
- Dashboard de inteligencia económica
- Sistema de alertas predictivas

---

## 🎯 **Impacto Esperado**

El Sistema de Alertas Económicas permitirá al BCV:

1. **Anticipar crisis** antes de que afecten la imagen institucional
2. **Responder proactivamente** a matrices de opinión negativas  
3. **Proteger la reputación** del banco central venezolano
4. **Mejorar la comunicación** estratégica institucional
5. **Fortalecer la posición** en el entorno económico internacional

**Estado**: ✅ **COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL**

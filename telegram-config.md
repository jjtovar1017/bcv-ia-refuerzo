# Configuración de Telegram para Asistente de Medios BCV

## Credenciales de la Aplicación

### Información Básica
- **App title**: AsistenteComunicacionBCV
- **Short name**: Asistente de Medios BCV
- **API ID**: 24872368
- **API Hash**: 530f9c024100d709ea0f7ce47f998a9a
- **Número de teléfono**: +5804123868364

### Configuración de Servidores

#### Servidor de Prueba
- **IP**: 149.154.167.40:443
- **DC**: 2
- **Clave pública RSA**:
```
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAyMEdY1aR+sCR3ZSJrtztKTKqigvO/vBfqACJLZtS7QMgCGXJ6XIR
yy7mx66W0/sOFa7/1mAZtEoIokDP3ShoqF4fVNb6XeqgQfaUHd8wJpDWHcR2OFwv
plUUI1PLTktZ9uW2WE23b+ixNwJjJGwBDJPQEQFBE+vfmH0JP503wr5INS1poWg/
j25sIWeYPHYeOrFp/eXaqhISP6G+q2IeTaWTXpwZj4LzXq5YOpk4bYEQ6mvRq7D1
aHWfYmlEGepfaYR8Q0YqvvhYtMte3ITnuSJs171+GDqpdKcSwHnd6FudwGO4pcCO
j4WcDuXc2CTHgH8gFTNhp/Y8/SpDOhvn9QIDAQAB
-----END RSA PUBLIC KEY-----
```

#### Servidor de Producción
- **IP**: 149.154.167.50:443
- **DC**: 2
- **Clave pública RSA**:
```
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA6LszBcC1LGzyr992NzE0ieY+BSaOW622Aa9Bd4ZHLl+TuFQ4lo4g
5nKaMBwK/BIb9xUfg0Q29/2mgIR6Zr9krM7HjuIcCzFvDtr+L0GQjae9H0pRB2OO
62cECs5HKhT5DZ98K33vmWiLowc621dQuwKWSQKjWf50XYFw42h21P2KXUGyp2y/
+aEyZ+uVgLLQbRA1dEjSDZ2iGRy12Mk5gpYc397aYp438fsJoHIgJ2lgMv5h7WY9
t6N/byY9Nw9p21Og3AoXSL2q/2IJ1WRUhebgAdGVMlV1fkuOQoEzR7EdpqtQD9Cs
5+bfo3Nhmcyvk5ftB0WkJ9z6bNZ7yxrP8wIDAQAB
-----END RSA PUBLIC KEY-----
```

## Variables de Entorno Configuradas

```env
VITE_TELEGRAM_API_ID=24872368
VITE_TELEGRAM_API_HASH=530f9c024100d709ea0f7ce47f998a9a
VITE_TELEGRAM_PHONE_NUMBER=+5804123868364
```

## Canales de Noticias Monitoreados

### Canales Principales
- `bcv_oficial` - Canal oficial del BCV
- `veneconomia` - VenEconomía
- `finanzasdigital` - Finanzas Digital
- `telesurve` - Telesur Venezuela
- `efectococuyo` - Efecto Cocuyo

### Canales Adicionales
- `eluniversal` - El Universal
- `el_nacional` - El Nacional
- `ultimasnoticias` - Últimas Noticias
- `globovision` - Globovisión
- `venezuelanalysis` - Venezuela Analysis

## Funcionalidades Implementadas

### 1. Monitoreo en Tiempo Real
- Obtención de mensajes de canales públicos
- Filtrado por palabras clave relacionadas con BCV
- Análisis de sentimiento de noticias

### 2. Búsqueda Inteligente
- Búsqueda por palabras clave
- Filtrado por fecha y canal
- Análisis de tendencias

### 3. Integración con IA
- Generación de resúmenes automáticos
- Análisis de contexto de noticias
- Alertas de contenido relevante

## Estado Actual
✅ **Configuración completada**
✅ **APIs integradas**
✅ **Servidor funcionando**
✅ **Noticias reales activas**

## Próximos Pasos
1. Probar la obtención de noticias reales
2. Configurar alertas automáticas
3. Implementar análisis avanzado de sentimiento
4. Generar reportes automáticos

---
*Configurado para el Banco Central de Venezuela - Asistente de Medios BCV* 
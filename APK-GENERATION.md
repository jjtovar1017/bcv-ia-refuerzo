# 📱 Generación de APK - Asistente de Medios BCV

## 🚀 Configuración Completada

Tu aplicación **Asistente de Medios BCV** está completamente configurada para generar APK de Android usando **Capacitor**.

### ✅ Estado Actual
- **Capacitor**: Configurado y sincronizado
- **Android Studio**: Instalado y funcional
- **Plugins**: SplashScreen, StatusBar, App, Geolocation
- **Permisos**: Internet, Ubicación, Servicios en segundo plano
- **Configuración**: Optimizada para móvil

## 📋 Métodos para Generar APK

### Método 1: Script Automático (Recomendado)
```bash
# Ejecutar el script de construcción
./build-apk.bat
```

### Método 2: Manual
```bash
# 1. Compilar proyecto web
npm run build

# 2. Sincronizar con Capacitor
npx cap sync

# 3. Abrir Android Studio
npx cap open android
```

## 🏗️ Generación de APK en Android Studio

### APK de Desarrollo (Debug)
1. En Android Studio, espera a que termine la sincronización
2. Ve a: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. La APK se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### APK de Producción (Release - Firmada)
1. Ve a: **Build > Generate Signed Bundle / APK**
2. Selecciona **APK**
3. Crea o selecciona un **keystore** (archivo de firma)
4. Completa los datos del keystore:
   - **Alias**: bcv-app
   - **Password**: [tu contraseña segura]
   - **Validity**: 25 años
5. La APK firmada estará en: `android/app/build/outputs/apk/release/`

## 🔧 Configuración de la Aplicación

### Información de la App
- **App ID**: `com.bcv.asistentemedios`
- **Nombre**: "Asistente de Medios BCV"
- **Versión**: Se toma del `package.json`

### Características Móviles
- **Splash Screen**: Azul BCV con spinner blanco (2 segundos)
- **Status Bar**: Estilo oscuro con fondo azul BCV
- **Orientación**: Soporte completo para portrait y landscape
- **Permisos**: Internet, ubicación, servicios en segundo plano

### APIs Funcionales
- ✅ **Telegram Bot API**: Monitoreo de canales
- ✅ **Google Gemini AI**: Análisis de contenido
- ✅ **NewsAPI**: Noticias internacionales
- ✅ **DeepSeek AI**: Análisis alternativo
- ✅ **Geolocalización**: Tracking GPS

## 📱 Instalación de la APK

### En Dispositivo Android
1. Habilitar **"Fuentes desconocidas"** en Configuración > Seguridad
2. Transferir la APK al dispositivo
3. Tocar el archivo APK para instalar
4. Conceder permisos cuando se soliciten

### Permisos que Solicitará
- **Internet**: Para APIs y servicios web
- **Ubicación**: Para funciones de geolocalización
- **Almacenamiento**: Para cache y configuración local

## 🔄 Actualización de la APK

Para actualizar la aplicación:
1. Modificar el código fuente
2. Incrementar la versión en `package.json`
3. Ejecutar `./build-apk.bat`
4. Generar nueva APK en Android Studio
5. Instalar sobre la versión anterior

## 🛠️ Solución de Problemas

### Error: "App not installed"
- Desinstalar versión anterior
- Verificar que la APK esté firmada correctamente

### Error: "Parse error"
- La APK está corrupta, regenerar
- Verificar compatibilidad con la versión de Android

### Funcionalidades no Funcionan
- Verificar conexión a internet
- Revisar permisos de la aplicación en Configuración del dispositivo

## 📊 Tamaño Estimado de la APK
- **Debug APK**: ~15-20 MB
- **Release APK**: ~10-15 MB (optimizada)

## 🎯 Próximos Pasos Opcionales

1. **Google Play Store**: Configurar para distribución en Play Store
2. **Notificaciones Push**: Agregar Firebase Cloud Messaging
3. **Actualizaciones OTA**: Implementar actualizaciones automáticas
4. **Analytics**: Agregar seguimiento de uso

---

## 🚀 ¡Tu APK está Lista!

La aplicación **Asistente de Medios BCV** está completamente configurada para generar APK. 
Ejecuta `./build-apk.bat` y sigue las instrucciones en Android Studio.

**¡Disfruta tu aplicación móvil del BCV!** 📱✨

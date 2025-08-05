@echo off
echo ========================================
echo  Generando APK - Asistente de Medios BCV
echo ========================================

echo.
echo [1/4] Compilando proyecto web...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la compilacion web
    pause
    exit /b 1
)

echo.
echo [2/4] Sincronizando con Capacitor...
call npx cap sync
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la sincronizacion de Capacitor
    pause
    exit /b 1
)

echo.
echo [3/4] Abriendo Android Studio...
call npx cap open android

echo.
echo [4/4] Instrucciones para generar APK:
echo =====================================
echo 1. En Android Studio, espera a que termine la sincronizacion
echo 2. Ve a: Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. O usa: Build ^> Generate Signed Bundle / APK para APK firmada
echo 4. La APK se generara en: android/app/build/outputs/apk/debug/
echo.
echo Para APK de produccion (firmada):
echo 1. Build ^> Generate Signed Bundle / APK
echo 2. Selecciona APK
echo 3. Crea o selecciona un keystore
echo 4. La APK firmada estara lista para distribucion
echo.
echo ¡Proceso completado! Android Studio esta abierto.
pause

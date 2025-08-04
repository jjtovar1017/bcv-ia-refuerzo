Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Generando APK - Asistente de Medios BCV" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Configurar JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
Write-Host "JAVA_HOME configurado: $env:JAVA_HOME" -ForegroundColor Green

# Verificar que Java esté disponible
$javaPath = "$env:JAVA_HOME\bin\java.exe"
if (Test-Path $javaPath) {
    Write-Host "Java encontrado correctamente" -ForegroundColor Green
} else {
    Write-Host "ERROR: Java no encontrado en $javaPath" -ForegroundColor Red
    exit 1
}

# Cambiar al directorio android
Set-Location "android"
Write-Host "Cambiando al directorio android..." -ForegroundColor Yellow

# Limpiar builds anteriores
Write-Host "Limpiando builds anteriores..." -ForegroundColor Yellow
.\gradlew clean

# Generar APK
Write-Host "Generando APK de debug..." -ForegroundColor Yellow
.\gradlew assembleDebug

# Verificar si se generó la APK
$apkPath = "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "¡APK generada exitosamente!" -ForegroundColor Green
    Write-Host "Ubicación: $(Resolve-Path $apkPath)" -ForegroundColor Green
    
    # Mostrar información de la APK
    $apkInfo = Get-Item $apkPath
    Write-Host "Tamaño: $([math]::Round($apkInfo.Length/1MB, 2)) MB" -ForegroundColor Green
    Write-Host "Fecha: $($apkInfo.LastWriteTime)" -ForegroundColor Green
} else {
    Write-Host "ERROR: No se pudo generar la APK" -ForegroundColor Red
    Write-Host "Revisa los logs arriba para más detalles" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Proceso completado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

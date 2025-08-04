package com.bcv.app

import android.location.Location
import java.lang.Math.toRadians
import kotlin.math.*

/**
 * Filtro de Kalman simple para suavizar la ubicación
 */
class KalmanLocationFilter {
    private var isInitialized = false
    private var lastTimestamp = 0L

    // Estado: [lat, lng, lat_velocity, lng_velocity]
    private var state = doubleArrayOf(0.0, 0.0, 0.0, 0.0)
    private var errorCovariance = Array(4) { DoubleArray(4) }

    // Parámetros del filtro
    private val processNoise = 0.01

    fun filter(location: Location): Location {
        val timestamp = location.time

        if (!isInitialized) {
            initialize(location)
            return location
        }

        val dt = (timestamp - lastTimestamp) / 1000.0 // segundos
        lastTimestamp = timestamp

        if (dt <= 0 || dt > 10) { // Omitir si la diferencia de tiempo no es válida
            return location
        }

        // Paso de predicción
        predict(dt)

        // Paso de actualización
        update(location.latitude, location.longitude, location.accuracy.toDouble())

        // Crear objeto de ubicación filtrado
        val filteredLocation = Location(location.provider).apply {
            latitude = state[0]
            longitude = state[1]
            accuracy = calculateAccuracy().toFloat()
            time = timestamp
            if (location.hasAltitude()) altitude = location.altitude
            if (location.hasBearing()) bearing = location.bearing
            if (location.hasSpeed()) {
                // Calcular la velocidad a partir de los componentes de la velocidad
                val latVelMs = state[2] * 111000 // grados/s a m/s
                val lngVelMs = state[3] * 111000 * cos(toRadians(state[0]))
                speed = sqrt(latVelMs * latVelMs + lngVelMs * lngVelMs).toFloat()
            }
        }

        return filteredLocation
    }

    private fun initialize(location: Location) {
        state[0] = location.latitude
        state[1] = location.longitude
        state[2] = 0.0 // Velocidad inicial
        state[3] = 0.0

        // Inicializar la matriz de covarianza de error
        val initialError = 1.0
        for (i in 0..3) {
            for (j in 0..3) {
                errorCovariance[i][j] = if (i == j) initialError else 0.0
            }
        }

        lastTimestamp = location.time
        isInitialized = true
    }

    private fun predict(dt: Double) {
        // Actualizar estado: posición += velocidad * dt
        state[0] += state[2] * dt
        state[1] += state[3] * dt

        // Actualizar la covarianza de error con el ruido del proceso
        errorCovariance[0][0] += processNoise
        errorCovariance[1][1] += processNoise
        errorCovariance[2][2] += processNoise
        errorCovariance[3][3] += processNoise
    }

    private fun update(measuredLat: Double, measuredLng: Double, accuracy: Double) {
        // Ruido de medición basado en la precisión del GPS
        val r = (accuracy * accuracy) / 10000.0

        // Cálculo de la ganancia de Kalman (simplificado para medición de posición 2D)
        val k0 = errorCovariance[0][0] / (errorCovariance[0][0] + r)
        val k1 = errorCovariance[1][1] / (errorCovariance[1][1] + r)

        // Actualizar el estado
        state[0] += k0 * (measuredLat - state[0])
        state[1] += k1 * (measuredLng - state[1])

        // Actualizar la covarianza de error
        errorCovariance[0][0] *= (1 - k0)
        errorCovariance[1][1] *= (1 - k1)
    }

    private fun calculateAccuracy(): Double {
        return sqrt(errorCovariance[0][0] + errorCovariance[1][1]) * 111000 // Convertir a metros
    }

    fun reset() {
        isInitialized = false
        lastTimestamp = 0L
    }
}

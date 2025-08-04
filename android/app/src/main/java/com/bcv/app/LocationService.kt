package com.bcv.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.URL
import java.util.*
import kotlin.math.* // Esta línea importa toRadians y otras funciones matemáticas

/**
 * Background location service for BCV asset tracking
 * Features: High accuracy GPS, Kalman filtering, battery optimization
 */
class LocationService : Service() {

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "location_service_channel"
        private const val LOCATION_UPDATE_INTERVAL = 5000L // 5 seconds
        private const val FASTEST_UPDATE_INTERVAL = 1000L // 1 second
        private const val MAX_ACCURACY_THRESHOLD = 10.0f // meters

        const val ACTION_START_TRACKING = "START_TRACKING"
        const val ACTION_STOP_TRACKING = "STOP_TRACKING"
        const val EXTRA_ASSET_ID = "asset_id"
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var notificationManager: NotificationManager

    private var isTracking = false
    private var currentAssetId: String? = null
    private var lastKnownLocation: Location? = null
    private var kalmanFilter: KalmanLocationFilter? = null

    // Coroutine scope for background operations
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        createNotificationChannel()
        setupLocationCallback()

        // Initialize Kalman filter
        kalmanFilter = KalmanLocationFilter()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_TRACKING -> {
                val assetId = intent.getStringExtra(EXTRA_ASSET_ID)
                if (assetId != null) {
                    startLocationTracking(assetId)
                }
            }
            ACTION_STOP_TRACKING -> {
                stopLocationTracking()
            }
        }

        return START_STICKY // Restart service if killed
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopLocationTracking()
        serviceScope.cancel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Rastreo de Ubicación BCV",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Servicio de rastreo de assets del BCV"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(assetId: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BCV Asset Tracking")
            .setContentText("Rastreando asset: $assetId")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    processLocationUpdate(location)
                }
            }

            override fun onLocationAvailability(locationAvailability: LocationAvailability) {
                if (!locationAvailability.isLocationAvailable) {
                    // Handle location unavailable
                    sendLocationError("GPS signal lost")
                }
            }
        }
    }

    private fun startLocationTracking(assetId: String) {
        if (isTracking) {
            stopLocationTracking()
        }

        currentAssetId = assetId
        isTracking = true

        // Start foreground service
        startForeground(NOTIFICATION_ID, createNotification(assetId))

        // Check permissions
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            stopLocationTracking()
            return
        }

        // Configure location request
        val locationRequest = LocationRequest.Builder(PRIORITY_HIGH_ACCURACY, LOCATION_UPDATE_INTERVAL)
            .setMinUpdateIntervalMillis(FASTEST_UPDATE_INTERVAL)
            .setMaxUpdateDelayMillis(LOCATION_UPDATE_INTERVAL * 2)
            .build()

        // Start location updates
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )

        // Reset Kalman filter for new tracking session
        kalmanFilter?.reset()
    }

    private fun stopLocationTracking() {
        if (!isTracking) return

        isTracking = false
        currentAssetId = null
        lastKnownLocation = null

        // Stop location updates
        fusedLocationClient.removeLocationUpdates(locationCallback)

        // Stop foreground service
        stopForeground(true)
        stopSelf()
    }

    private fun processLocationUpdate(location: Location) {
        val assetId = currentAssetId ?: return

        // Apply accuracy filtering
        if (location.accuracy > MAX_ACCURACY_THRESHOLD) {
            return // Skip inaccurate readings
        }

        // Apply Kalman filtering for improved accuracy
        val filteredLocation = kalmanFilter?.filter(location) ?: location

        // Update last known location
        lastKnownLocation = filteredLocation

        // Create location update data
        val locationData = createLocationUpdateJson(assetId, filteredLocation)

        // Send location update to server
        serviceScope.launch {
            sendLocationUpdate(locationData)
        }

        // Update notification with current accuracy
        updateNotification(assetId, filteredLocation.accuracy)
    }

    private fun createLocationUpdateJson(assetId: String, location: Location): JSONObject {
        return JSONObject().apply {
            put("assetId", assetId)
            put("coordinate", JSONObject().apply {
                put("latitude", location.latitude)
                put("longitude", location.longitude)
                put("accuracy", location.accuracy)
                put("timestamp", Date().time)
                if (location.hasAltitude()) put("altitude", location.altitude)
                if (location.hasBearing()) put("heading", location.bearing)
                if (location.hasSpeed()) put("speed", location.speed)
            })
            put("batteryLevel", getBatteryLevel())
            put("networkType", getNetworkType())
        }
    }

    private suspend fun sendLocationUpdate(locationData: JSONObject) {
        try {
            val wsUrl = "ws://localhost:3001/location" // Replace with actual WebSocket URL

            // For now, we'll use HTTP POST as a fallback
            // In production, implement WebSocket connection
            val url = URL("http://localhost:3001/api/location")
            val connection = url.openConnection()
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")

            connection.outputStream.use { output ->
                output.write(locationData.toString().toByteArray())
            }

            val responseCode = (connection as java.net.HttpURLConnection).responseCode
            if (responseCode != 200) {
                throw Exception("HTTP $responseCode")
            }

        } catch (e: Exception) {
            // Handle network error - could queue for retry
            e.printStackTrace()
        }
    }

    private fun sendLocationError(error: String) {
        serviceScope.launch {
            try {
                val errorData = JSONObject().apply {
                    put("assetId", currentAssetId)
                    put("error", error)
                    put("timestamp", Date().time)
                }

                // Send error to server
                // Implementation similar to sendLocationUpdate

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun updateNotification(assetId: String, accuracy: Float) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BCV Asset Tracking")
            .setContentText("Asset: $assetId | Precisión: ${accuracy.toInt()}m")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun getBatteryLevel(): Int {
        val batteryManager = getSystemService(Context.BATTERY_SERVICE) as android.os.BatteryManager
        return batteryManager.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun getNetworkType(): String {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork
        val networkCapabilities = connectivityManager.getNetworkCapabilities(activeNetwork)

        return when {
            networkCapabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) == true -> "wifi"
            networkCapabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "cellular"
            else -> "gps"
        }
    }
}
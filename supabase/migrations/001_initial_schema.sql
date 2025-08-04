-- BCV Asset Tracking Database Schema
-- Migration: 001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE asset_type AS ENUM ('vehicle', 'personnel', 'equipment');
CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'maintenance', 'emergency');
CREATE TYPE geofence_type AS ENUM ('entry', 'exit', 'both');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE network_type AS ENUM ('wifi', 'cellular', 'gps');

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type asset_type NOT NULL,
    description TEXT,
    status asset_status NOT NULL DEFAULT 'active',
    assigned_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Location updates table with PostGIS support
CREATE TABLE location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy FLOAT NOT NULL,
    altitude FLOAT,
    heading FLOAT,
    speed FLOAT,
    battery_level INTEGER,
    network_type network_type,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for spatial queries
    CONSTRAINT valid_accuracy CHECK (accuracy > 0),
    CONSTRAINT valid_battery CHECK (battery_level >= 0 AND battery_level <= 100)
);

-- Create spatial index for location queries
CREATE INDEX idx_location_updates_coordinates ON location_updates USING GIST (coordinates);
CREATE INDEX idx_location_updates_asset_timestamp ON location_updates (asset_id, timestamp DESC);

-- Geofences table
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    center_coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    radius FLOAT NOT NULL,
    type geofence_type NOT NULL DEFAULT 'both',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT valid_radius CHECK (radius > 0)
);

-- Asset geofence associations
CREATE TABLE asset_geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(asset_id, geofence_id)
);

-- Geofence alerts table
CREATE TABLE geofence_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    alert_type geofence_type NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'medium',
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- DeepSeek API cache table
CREATE TABLE deepseek_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    request_type VARCHAR(50) NOT NULL, -- 'route' or 'geo_analysis'
    request_data JSONB NOT NULL,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Index for cache lookups
    INDEX idx_deepseek_cache_key ON deepseek_cache (cache_key),
    INDEX idx_deepseek_cache_expires ON deepseek_cache (expires_at)
);

-- System logs table for audit trail
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
    component VARCHAR(100) NOT NULL,
    operation VARCHAR(100),
    message TEXT NOT NULL,
    user_id VARCHAR(255),
    asset_id UUID REFERENCES assets(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for log queries
    INDEX idx_system_logs_level_created ON system_logs (level, created_at DESC),
    INDEX idx_system_logs_component_created ON system_logs (component, created_at DESC)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get current asset location
CREATE OR REPLACE FUNCTION get_current_asset_location(asset_uuid UUID)
RETURNS TABLE (
    asset_id UUID,
    latitude FLOAT,
    longitude FLOAT,
    accuracy FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lu.asset_id,
        ST_Y(lu.coordinates::geometry) as latitude,
        ST_X(lu.coordinates::geometry) as longitude,
        lu.accuracy,
        lu.timestamp
    FROM location_updates lu
    WHERE lu.asset_id = asset_uuid
    ORDER BY lu.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check geofence violations
CREATE OR REPLACE FUNCTION check_geofence_violation(
    asset_uuid UUID,
    new_coordinates GEOGRAPHY(POINT, 4326)
)
RETURNS TABLE (
    geofence_id UUID,
    geofence_name VARCHAR(255),
    violation_type geofence_type,
    distance_from_center FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as geofence_id,
        g.name as geofence_name,
        g.type as violation_type,
        ST_Distance(g.center_coordinates, new_coordinates) as distance_from_center
    FROM geofences g
    JOIN asset_geofences ag ON g.id = ag.geofence_id
    WHERE ag.asset_id = asset_uuid
      AND g.is_active = true
      AND (
          (g.type IN ('entry', 'both') AND ST_DWithin(g.center_coordinates, new_coordinates, g.radius))
          OR
          (g.type IN ('exit', 'both') AND NOT ST_DWithin(g.center_coordinates, new_coordinates, g.radius))
      );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old location data (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_location_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM location_updates 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup operation
    INSERT INTO system_logs (level, component, operation, message, metadata)
    VALUES (
        'info',
        'database',
        'cleanup',
        'Cleaned up old location data',
        jsonb_build_object('deleted_records', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired DeepSeek cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM deepseek_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO system_logs (level, component, operation, message, metadata)
    VALUES (
        'info',
        'deepseek-cache',
        'cleanup',
        'Cleaned up expired cache entries',
        jsonb_build_object('deleted_records', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_assets_type_status ON assets (type, status);
CREATE INDEX idx_location_updates_timestamp ON location_updates (timestamp DESC);
CREATE INDEX idx_geofence_alerts_timestamp ON geofence_alerts (timestamp DESC);
CREATE INDEX idx_geofence_alerts_acknowledged ON geofence_alerts (acknowledged, timestamp DESC);

-- Row Level Security (RLS) policies
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication system)
CREATE POLICY "Assets are viewable by authenticated users" ON assets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Location updates are viewable by authenticated users" ON location_updates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Geofences are viewable by authenticated users" ON geofences
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Alerts are viewable by authenticated users" ON geofence_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data for testing
INSERT INTO assets (name, type, description, status, assigned_to) VALUES
('Vehículo BCV-001', 'vehicle', 'Camioneta de valores', 'active', 'Juan Pérez'),
('Supervisor de Campo', 'personnel', 'Inspector de sucursales', 'active', 'María González'),
('ATM Móvil BCV-15', 'equipment', 'Cajero automático portátil', 'maintenance', 'Técnico de Mantenimiento');

-- Insert sample geofences (BCV headquarters area)
INSERT INTO geofences (name, center_coordinates, radius, type) VALUES
('BCV Sede Central', ST_GeogFromText('POINT(-66.9036 10.4806)'), 100, 'both'),
('Zona Segura Centro', ST_GeogFromText('POINT(-66.9086 10.4756)'), 500, 'exit'),
('Área de Mantenimiento', ST_GeogFromText('POINT(-66.8986 10.4856)'), 200, 'entry');

-- Create scheduled jobs for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-location-data', '0 2 * * *', 'SELECT cleanup_old_location_data();');
-- SELECT cron.schedule('cleanup-cache', '0 3 * * *', 'SELECT cleanup_expired_cache();');

COMMENT ON TABLE assets IS 'BCV assets being tracked (vehicles, personnel, equipment)';
COMMENT ON TABLE location_updates IS 'Real-time location updates from tracked assets';
COMMENT ON TABLE geofences IS 'Geographic boundaries for asset monitoring';
COMMENT ON TABLE geofence_alerts IS 'Alerts generated when assets enter/exit geofences';
COMMENT ON TABLE deepseek_cache IS 'Cache for DeepSeek API responses to reduce costs';
COMMENT ON TABLE system_logs IS 'System audit trail and error logs';
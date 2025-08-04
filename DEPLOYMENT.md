# 🚀 BCV Asset Tracking - Automated Deployment Pipeline

## 📋 Overview

This document describes the automated deployment pipeline for the BCV Asset Tracking application, which implements:

1️⃣ **Signed APK generation** for Android testing  
2️⃣ **Web deployment** to Vercel staging/production  
3️⃣ **Database migrations** with Supabase  
4️⃣ **Automated notifications** with download URLs  

## 🏗️ Architecture

```mermaid
graph TB
    A[GitHub Push] --> B[GitHub Actions]
    B --> C[Quality Check]
    C --> D[Web Deploy - Vercel]
    C --> E[Android Build - Fastlane]
    C --> F[Database Migration - Supabase]
    
    D --> G[Production URL]
    E --> H[Signed APK]
    F --> I[Schema Updates]
    
    G --> J[Notifications]
    H --> J
    I --> J
    
    J --> K[Slack]
    J --> L[Email]
    J --> M[GitHub Release]
```

## 🔧 Technologies

- **Android**: Fastlane + Gradle + Kotlin
- **Web**: Vercel + React + TypeScript  
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Repository**: GitHub Actions
- **Notifications**: Slack + Email
- **Monitoring**: Sentry

## 📦 Setup Instructions

### 1. Initial Configuration (One-time setup)

```bash
# Clone repository
git clone https://github.com/bcv/asistente-de-medios-bcv.git
cd asistente-de-medios-bcv

# Run automated setup
chmod +x scripts/setup-deployment.sh
./scripts/setup-deployment.sh
```

### 2. Environment Variables

#### GitHub Repository Secrets
Navigate to `Settings > Secrets and variables > Actions` and add:

**🌐 Web Deployment**
```
VERCEL_TOKEN=your_vercel_api_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
```

**📱 Android Deployment**
```
ANDROID_KEYSTORE_BASE64=base64_encoded_keystore
KEYSTORE_PASSWORD=your_keystore_password
KEY_ALIAS=your_key_alias
KEY_PASSWORD=your_key_password
```

**🗄️ Database**
```
SUPABASE_ACCESS_TOKEN=your_supabase_token
SUPABASE_DB_URL=postgresql://user:pass@host:port/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**🤖 API Keys**
```
DEEPSEEK_API_KEY=your_deepseek_api_key
REDIS_URL=redis://your-redis-url:6379
WS_URL=wss://your-websocket-url
SENTRY_DSN=https://your-sentry-dsn
```

**📢 Notifications**
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
EMAIL_USERNAME=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
NOTIFICATION_EMAIL=notifications@bcv.org.ve
```

#### Vercel Environment Variables
```bash
# Configure Vercel environments
vercel env add REACT_APP_DEEPSEEK_API_KEY "your_key" --env production
vercel env add REACT_APP_SUPABASE_URL "https://xyz.supabase.co" --env production
vercel env add REACT_APP_SUPABASE_ANON_KEY "anon_key" --env production
vercel env add REACT_APP_REDIS_URL "redis://url" --env production
vercel env add REACT_APP_WS_URL "wss://ws-url" --env production
vercel env add REACT_APP_SENTRY_DSN "sentry_dsn" --env production
```

### 3. Android Keystore Setup

```bash
# Generate keystore (if you don't have one)
keytool -genkey -v -keystore android/app/keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias bcv-asset-tracking

# Convert to base64 for GitHub secrets
base64 -i android/app/keystore.jks | pbcopy
```

### 4. Supabase Database Setup

```bash
# Initialize Supabase
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 🚀 Deployment Triggers

### Automatic Deployments

| Trigger | Web Deploy | Android Build | Database Migration |
|---------|------------|---------------|-------------------|
| `push main` | ✅ Production | ✅ Release APK | ✅ Run migrations |
| `push develop` | ✅ Preview | ❌ | ❌ |
| `tag v*` | ✅ Production | ✅ GitHub Release | ✅ Run migrations |
| `pull_request` | ✅ Preview | ❌ | ❌ |

### Manual Deployments

```bash
# Web deployment
npm run build
vercel --prod

# Android APK
cd android
bundle exec fastlane build_apk version_name:1.0.0

# Database migration
supabase db push --db-url "$SUPABASE_DB_URL"
```

## 📱 Android Build Process

### Fastlane Lanes

```bash
# Build signed APK
fastlane build_apk version_name:1.0.0

# Deploy to Firebase App Distribution
fastlane deploy_firebase version_name:1.0.0

# Build AAB for Play Store
fastlane build_aab version_name:1.0.0

# Deploy to Play Store (Internal Testing)
fastlane deploy_play_store version_name:1.0.0

# Full release process
fastlane release version_name:1.0.0
```

### Build Configuration

The Android build process:

1. **Clean** previous builds
2. **Update** version name and code
3. **Build** signed APK/AAB with release keystore
4. **Test** APK integrity
5. **Upload** to distribution platform
6. **Notify** stakeholders

### Version Management

- **Version Name**: Semantic versioning (e.g., `1.0.0`)
- **Version Code**: Auto-generated timestamp (`YYYYMMDDHH`)
- **Git Tags**: Automatic tagging for releases

## 🌐 Web Deployment Process

### Vercel Configuration

The web deployment process:

1. **Build** React application with production optimizations
2. **Deploy** to Vercel with environment variables
3. **Configure** custom domains and SSL
4. **Enable** analytics and monitoring
5. **Set up** preview deployments for PRs

### Environment-specific Builds

- **Production** (`main` branch): Full optimizations, analytics enabled
- **Preview** (`develop` branch): Debug mode, staging APIs
- **PR Previews**: Isolated environments for testing

## 🗄️ Database Management

### Migration Strategy

```sql
-- Example migration structure
-- supabase/migrations/001_initial_schema.sql
-- supabase/migrations/002_add_geofencing.sql
-- supabase/migrations/003_deepseek_cache.sql
```

### Backup & Recovery

- **Automated backups**: Daily snapshots
- **Point-in-time recovery**: 7-day retention
- **Migration rollback**: Automated rollback on failure

## 📊 Monitoring & Notifications

### GitHub Actions Workflow

The pipeline provides comprehensive monitoring:

```yaml
# Workflow stages
1. Quality Check (TypeScript, Tests, Linting)
2. Web Deployment (Vercel)
3. Android Build (Fastlane)
4. Database Migration (Supabase)
5. Notifications (Slack, Email, GitHub)
```

### Notification Channels

**📧 Email Notifications**
- Deployment status (success/failure)
- Download links for APKs
- Performance metrics

**💬 Slack Integration**
- Real-time deployment updates
- Channel: `#bcv-deployments`
- Mentions on failures

**📦 GitHub Releases**
- Automatic release creation for tags
- APK attachments
- Changelog generation

### Success Notification Example

```
🚀 BCV Asset Tracking Deployment

Branch: main
Commit: abc123f
Status: ✅ Success

🌐 Web: https://bcv-asset-tracking.vercel.app
📱 Android: v1.0.0 (Download from GitHub Releases)
🗄️ Database: Migration completed successfully

📋 Features:
✅ GPS-based asset tracking with ≤5m accuracy
✅ DeepSeek AI integration for route optimization
✅ Battery-optimized background location updates
✅ Real-time WebSocket communication
```

## 🔍 Troubleshooting

### Common Issues

**❌ Android Build Failures**
```bash
# Check keystore configuration
ls -la android/app/keystore.jks

# Verify environment variables
echo $KEYSTORE_PASSWORD

# Clean and rebuild
cd android
./gradlew clean
bundle exec fastlane build_apk
```

**❌ Vercel Deployment Failures**
```bash
# Check build logs
vercel logs

# Test local build
npm run build

# Verify environment variables
vercel env ls
```

**❌ Database Migration Failures**
```bash
# Check connection
supabase status

# Validate SQL syntax
supabase db lint

# Manual migration
supabase db push --dry-run
```

### Debug Commands

```bash
# Check GitHub Actions logs
gh run list
gh run view [run-id]

# Test Fastlane locally
cd android
bundle exec fastlane test

# Validate Vercel configuration
vercel --debug

# Test Supabase connection
supabase projects list
```

## 📈 Performance Metrics

### Build Times (Target)

- **Quality Check**: < 3 minutes
- **Web Deployment**: < 5 minutes  
- **Android Build**: < 10 minutes
- **Database Migration**: < 2 minutes
- **Total Pipeline**: < 15 minutes

### Success Rates (Target)

- **Overall Pipeline**: > 95%
- **Web Deployment**: > 98%
- **Android Build**: > 90%
- **Database Migration**: > 99%

## 🔐 Security Considerations

### Secret Management
- All sensitive data stored in GitHub Secrets
- Environment-specific variable isolation
- Automatic secret rotation recommendations

### Code Signing
- Android APKs signed with production keystore
- Certificate pinning for API communications
- Integrity verification for all builds

### Database Security
- Row Level Security (RLS) enabled
- Encrypted connections only
- Audit logging for all operations

## 📚 Additional Resources

### Documentation Links
- [Fastlane Documentation](https://docs.fastlane.tools/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### Support Contacts
- **DevOps Team**: devops@bcv.org.ve
- **Mobile Team**: mobile@bcv.org.ve
- **Database Team**: dba@bcv.org.ve

---

**Last Updated**: 2025-08-03  
**Version**: 1.0  
**Maintained by**: BCV DevOps Team
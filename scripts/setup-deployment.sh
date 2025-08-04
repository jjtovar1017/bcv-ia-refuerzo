#!/bin/bash

# BCV Asset Tracking - Deployment Setup Script
# This script sets up the automated deployment pipeline

set -e

echo "🚀 BCV Asset Tracking - Deployment Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Check Supabase CLI
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. Installing..."
        npm install -g @supabase/cli
    fi
    
    # Check Ruby (for Fastlane)
    if ! command -v ruby &> /dev/null; then
        missing_deps+=("Ruby")
    fi
    
    # Check Bundler
    if ! command -v bundle &> /dev/null; then
        print_warning "Bundler not found. Installing..."
        gem install bundler
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All dependencies are installed!"
}

# Setup Vercel project
setup_vercel() {
    print_status "Setting up Vercel project..."
    
    if [ ! -f ".vercel/project.json" ]; then
        print_status "Linking Vercel project..."
        vercel link --yes
    else
        print_success "Vercel project already linked!"
    fi
    
    # Set environment variables
    print_status "Setting up Vercel environment variables..."
    
    # Check if environment variables are set
    local env_vars=(
        "DEEPSEEK_API_KEY"
        "REDIS_URL"
        "WEBSOCKET_URL"
        "SENTRY_DSN"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
    )
    
    for var in "${env_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_warning "Environment variable $var is not set."
            read -p "Enter value for $var: " -s value
            echo
            vercel env add "$var" "$value" --env production,preview,development
        else
            print_success "$var is already set!"
        fi
    done
}

# Setup Supabase
setup_supabase() {
    print_status "Setting up Supabase..."
    
    if [ ! -f "supabase/config.toml" ]; then
        print_status "Initializing Supabase project..."
        supabase init
    else
        print_success "Supabase project already initialized!"
    fi
    
    # Check if we can connect to Supabase
    if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
        print_status "Testing Supabase connection..."
        supabase projects list > /dev/null 2>&1 && print_success "Supabase connection successful!" || print_warning "Could not connect to Supabase. Please check your access token."
    else
        print_warning "SUPABASE_ACCESS_TOKEN not set. Please set it for database migrations."
    fi
}

# Setup Android/Fastlane
setup_android() {
    print_status "Setting up Android/Fastlane..."
    
    cd android
    
    # Install Fastlane dependencies
    if [ -f "Gemfile" ]; then
        print_status "Installing Fastlane dependencies..."
        bundle install
    else
        print_error "Gemfile not found in android directory!"
        cd ..
        return 1
    fi
    
    # Initialize Fastlane if not already done
    if [ ! -f "fastlane/Fastfile" ]; then
        print_status "Initializing Fastlane..."
        bundle exec fastlane init
    else
        print_success "Fastlane already initialized!"
    fi
    
    # Check Android environment
    if [ -z "$ANDROID_HOME" ]; then
        print_warning "ANDROID_HOME not set. Please set it to your Android SDK path."
    else
        print_success "Android SDK found at $ANDROID_HOME"
    fi
    
    cd ..
}

# Setup GitHub repository secrets
setup_github_secrets() {
    print_status "GitHub Secrets Setup Instructions"
    print_status "================================="
    
    echo
    print_status "Please add the following secrets to your GitHub repository:"
    print_status "(Go to Settings > Secrets and variables > Actions)"
    echo
    
    cat << EOF
🔐 Required GitHub Secrets:

Web Deployment:
- VERCEL_TOKEN: Your Vercel API token
- VERCEL_ORG_ID: Your Vercel organization ID
- VERCEL_PROJECT_ID: Your Vercel project ID

Android Deployment:
- ANDROID_KEYSTORE_BASE64: Base64 encoded keystore file
- KEYSTORE_PASSWORD: Keystore password
- KEY_ALIAS: Key alias
- KEY_PASSWORD: Key password

Database:
- SUPABASE_ACCESS_TOKEN: Supabase access token
- SUPABASE_DB_URL: Direct database URL for migrations

API Keys:
- DEEPSEEK_API_KEY: DeepSeek API key
- REDIS_URL: Redis connection URL
- WS_URL: WebSocket server URL
- SENTRY_DSN: Sentry error tracking DSN
- SUPABASE_URL: Supabase project URL
- SUPABASE_ANON_KEY: Supabase anonymous key

Notifications:
- SLACK_WEBHOOK_URL: Slack webhook for notifications
- EMAIL_USERNAME: SMTP username for email notifications
- EMAIL_PASSWORD: SMTP password
- NOTIFICATION_EMAIL: Email address for notifications

Optional:
- CODECOV_TOKEN: Codecov token for coverage reports
- FIREBASE_APP_ID: Firebase App Distribution ID
- FIREBASE_CLI_TOKEN: Firebase CLI token
- GOOGLE_PLAY_JSON_KEY_PATH: Google Play Console service account key

EOF
}

# Create local environment file
create_env_file() {
    print_status "Creating local environment file..."
    
    if [ ! -f ".env.local" ]; then
        cat << EOF > .env.local
# BCV Asset Tracking - Local Environment Variables
# Copy this file and fill in your actual values

# DeepSeek AI
REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Redis Cache
REACT_APP_REDIS_URL=redis://localhost:6379

# WebSocket Server
REACT_APP_WS_URL=ws://localhost:3001

# Sentry Error Tracking
REACT_APP_SENTRY_DSN=your_sentry_dsn_here

# Supabase Database
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development
NODE_ENV=development
EOF
        print_success "Created .env.local file. Please fill in your actual values."
    else
        print_success ".env.local already exists!"
    fi
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Install Node.js dependencies
    npm install
    
    # Install Android dependencies
    if [ -d "android" ]; then
        cd android
        if [ -f "Gemfile" ]; then
            bundle install
        fi
        cd ..
    fi
    
    print_success "Dependencies installed!"
}

# Run setup tests
run_setup_tests() {
    print_status "Running setup tests..."
    
    # Test TypeScript compilation
    print_status "Testing TypeScript compilation..."
    npx tsc --noEmit && print_success "TypeScript compilation successful!" || print_error "TypeScript compilation failed!"
    
    # Test build process
    print_status "Testing build process..."
    npm run build && print_success "Build process successful!" || print_error "Build process failed!"
    
    # Test Fastlane (if Android setup is complete)
    if [ -d "android" ] && [ -f "android/fastlane/Fastfile" ]; then
        print_status "Testing Fastlane setup..."
        cd android
        bundle exec fastlane --version && print_success "Fastlane setup successful!" || print_error "Fastlane setup failed!"
        cd ..
    fi
}

# Main setup function
main() {
    echo
    print_status "Starting BCV Asset Tracking deployment setup..."
    echo
    
    # Run setup steps
    check_dependencies
    echo
    
    install_dependencies
    echo
    
    create_env_file
    echo
    
    setup_vercel
    echo
    
    setup_supabase
    echo
    
    setup_android
    echo
    
    run_setup_tests
    echo
    
    setup_github_secrets
    echo
    
    print_success "🎉 Deployment setup completed!"
    print_status "Next steps:"
    echo "1. Fill in your .env.local file with actual values"
    echo "2. Add the required secrets to your GitHub repository"
    echo "3. Push your code to trigger the first deployment"
    echo "4. Monitor the GitHub Actions workflow for any issues"
    echo
    print_status "For manual deployment:"
    echo "- Web: npm run build && vercel --prod"
    echo "- Android: cd android && bundle exec fastlane build_apk"
    echo
}

# Run main function
main "$@"
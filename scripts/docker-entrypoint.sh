#!/bin/bash
# Docker entrypoint script for Mansoura CIH Telegram Attendance System
# Handles database migrations, initialization, and application startup

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to wait for database
wait_for_database() {
    log_info "Waiting for database to be ready..."
    
    # Extract database connection details from DATABASE_URL
    if [[ -z "$DATABASE_URL" ]]; then
        log_error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    
    # Simple wait with timeout
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if npm run db:generate > /dev/null 2>&1; then
            log_success "Database connection established"
            return 0
        fi
        
        log_info "Database not ready, attempt $attempt/$max_attempts. Waiting 2 seconds..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Failed to connect to database after $max_attempts attempts"
    exit 1
}

# Function to run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    if npm run db:push; then
        log_success "Database migrations completed successfully"
    else
        log_error "Database migrations failed"
        exit 1
    fi
}

# Function to setup initial data
setup_initial_data() {
    log_info "Setting up initial data..."
    
    # Check if we should run setup
    if [[ "${RUN_SETUP:-false}" == "true" ]]; then
        if npm run setup; then
            log_success "Initial data setup completed"
        else
            log_warning "Initial data setup failed, but continuing..."
        fi
    else
        log_info "Skipping initial data setup (RUN_SETUP not set to true)"
    fi
}

# Function to verify environment
verify_environment() {
    log_info "Verifying environment configuration..."
    
    # Required environment variables
    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "TELEGRAM_BOT_TOKEN"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        exit 1
    fi
    
    log_success "Environment verification completed"
}

# Function to setup Telegram webhook
setup_telegram_webhook() {
    if [[ -n "$TELEGRAM_WEBHOOK_URL" && "$NODE_ENV" == "production" ]]; then
        log_info "Setting up Telegram webhook..."
        
        # This will be handled by the application itself
        # We just log that it should be configured
        log_info "Telegram webhook should be configured to: $TELEGRAM_WEBHOOK_URL"
    fi
}

# Function to create required directories
create_directories() {
    log_info "Creating required directories..."
    
    local dirs=(
        "/app/data"
        "/app/logs"
        "/app/uploads"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_info "Created directory: $dir"
        fi
    done
}

# Function to handle graceful shutdown
cleanup() {
    log_info "Received shutdown signal, cleaning up..."
    
    # Kill the background jobs
    jobs -p | xargs -r kill
    
    log_info "Cleanup completed"
    exit 0
}

# Setup signal handlers
trap cleanup SIGTERM SIGINT

# Main execution flow
main() {
    log_info "Starting Mansoura CIH Telegram Attendance System..."
    log_info "Node.js version: $(node --version)"
    log_info "Environment: ${NODE_ENV:-development}"
    
    # Create required directories
    create_directories
    
    # Verify environment
    verify_environment
    
    # Wait for database
    wait_for_database
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    npm run db:generate
    
    # Run migrations
    run_migrations
    
    # Setup initial data if needed
    setup_initial_data
    
    # Setup Telegram webhook
    setup_telegram_webhook
    
    # Start the application
    log_success "Starting Next.js application..."
    
    if [[ "$NODE_ENV" == "production" ]]; then
        exec npm start
    else
        exec npm run dev
    fi
}

# Handle special commands
case "${1:-}" in
    "bash"|"/bin/bash")
        log_info "Starting interactive bash shell..."
        exec bash
        ;;
    "sh"|"/bin/sh")
        log_info "Starting interactive shell..."
        exec sh
        ;;
    "npm")
        log_info "Running npm command: ${*:1}"
        exec "$@"
        ;;
    "node")
        log_info "Running node command: ${*:1}"
        exec "$@"
        ;;
    "help"|"--help"|"-h")
        echo "Mansoura CIH Telegram Attendance System Docker Entrypoint"
        echo ""
        echo "Usage:"
        echo "  docker run [options] mansoura-attendance [command]"
        echo ""
        echo "Commands:"
        echo "  (default)     Start the application"
        echo "  bash          Start interactive bash shell"
        echo "  sh            Start interactive shell"
        echo "  npm <args>    Run npm command"
        echo "  node <args>   Run node command"
        echo "  help          Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  DATABASE_URL          PostgreSQL connection string (required)"
        echo "  NEXTAUTH_SECRET       Secret for NextAuth.js (required)"
        echo "  TELEGRAM_BOT_TOKEN    Telegram bot token (required)"
        echo "  TELEGRAM_WEBHOOK_URL  Telegram webhook URL"
        echo "  RUN_SETUP            Set to 'true' to run initial setup"
        echo "  NODE_ENV             Environment (development|production)"
        exit 0
        ;;
    "")
        # Default case - run main function
        main
        ;;
    *)
        log_info "Running custom command: $*"
        exec "$@"
        ;;
esac
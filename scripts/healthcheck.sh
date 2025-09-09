#!/bin/bash
# Health check script for Mansoura CIH Telegram Attendance System
# Comprehensive system health monitoring

set -e

# Configuration
APP_HOST="${APP_HOST:-localhost}"
APP_PORT="${APP_PORT:-3000}"
DATABASE_HOST="${POSTGRES_HOST:-postgres}"
DATABASE_PORT="${POSTGRES_PORT:-5432}"
DATABASE_NAME="${POSTGRES_DB:-mansoura_attendance}"
DATABASE_USER="${POSTGRES_USER:-postgres}"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status tracking
OVERALL_STATUS=0
CHECKS_PASSED=0
CHECKS_FAILED=0

# Logging functions
log_info() {
    echo -e "${BLUE}[HEALTH INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[HEALTH OK]${NC} $1"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[HEALTH WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[HEALTH ERROR]${NC} $1"
    ((CHECKS_FAILED++))
    OVERALL_STATUS=1
}

# Function to check if a TCP port is open
check_port() {
    local host=$1
    local port=$2
    local service=$3
    local timeout=${4:-5}
    
    if timeout $timeout bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        log_success "$service is reachable at $host:$port"
        return 0
    else
        log_error "$service is not reachable at $host:$port"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local service=$3
    local timeout=${4:-10}
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        log_success "$service HTTP endpoint is healthy: $url (Status: $response)"
        return 0
    else
        log_error "$service HTTP endpoint is unhealthy: $url (Status: $response, Expected: $expected_status)"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    log_info "Checking database connectivity..."
    
    # Check port connectivity
    if ! check_port "$DATABASE_HOST" "$DATABASE_PORT" "PostgreSQL Database"; then
        return 1
    fi
    
    # Check database with pg_isready
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -t $TIMEOUT >/dev/null 2>&1; then
            log_success "Database is accepting connections"
        else
            log_error "Database is not accepting connections"
            return 1
        fi
    else
        log_warning "pg_isready not available, skipping detailed database check"
    fi
    
    return 0
}

# Function to check Redis connectivity
check_redis() {
    log_info "Checking Redis connectivity..."
    
    # Check port connectivity
    if ! check_port "$REDIS_HOST" "$REDIS_PORT" "Redis Cache"; then
        log_warning "Redis is not available (this may be optional)"
        return 0  # Redis is optional, so don't fail the health check
    fi
    
    # Check Redis with redis-cli if available
    if command -v redis-cli >/dev/null 2>&1; then
        local redis_auth=""
        [[ -n "${REDIS_PASSWORD}" ]] && redis_auth="-a ${REDIS_PASSWORD}"
        
        if timeout $TIMEOUT redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $redis_auth ping >/dev/null 2>&1; then
            log_success "Redis is responding to ping"
        else
            log_warning "Redis ping failed (authentication issue or service down)"
        fi
    else
        log_info "redis-cli not available, basic connectivity check passed"
    fi
    
    return 0
}

# Function to check application health
check_application() {
    log_info "Checking application health..."
    
    # Check if application port is open
    if ! check_port "$APP_HOST" "$APP_PORT" "Next.js Application"; then
        return 1
    fi
    
    # Check health endpoint
    local health_url="http://${APP_HOST}:${APP_PORT}/api/health"
    if ! check_http_endpoint "$health_url" "200" "Application Health Endpoint"; then
        return 1
    fi
    
    # Check if the health endpoint returns valid JSON
    local health_response=$(curl -s --max-time $TIMEOUT "$health_url" 2>/dev/null || echo "{}")
    if echo "$health_response" | jq . >/dev/null 2>&1; then
        log_success "Health endpoint returns valid JSON"
        
        # Parse health response for additional checks
        local app_status=$(echo "$health_response" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        if [[ "$app_status" == "ok" || "$app_status" == "healthy" ]]; then
            log_success "Application reports healthy status: $app_status"
        else
            log_warning "Application reports status: $app_status"
        fi
    else
        log_warning "Health endpoint does not return valid JSON"
    fi
    
    return 0
}

# Function to check disk space
check_disk_space() {
    log_info "Checking disk space..."
    
    # Check root filesystem
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
    if [[ "$disk_usage" -lt 80 ]]; then
        log_success "Root filesystem disk usage: ${disk_usage}%"
    elif [[ "$disk_usage" -lt 90 ]]; then
        log_warning "Root filesystem disk usage: ${disk_usage}% (Warning: >80%)"
    else
        log_error "Root filesystem disk usage: ${disk_usage}% (Critical: >90%)"
        return 1
    fi
    
    # Check application data directory if it exists
    if [[ -d "/app/data" ]]; then
        local app_disk_usage=$(df /app/data | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
        if [[ "$app_disk_usage" -lt 80 ]]; then
            log_success "Application data disk usage: ${app_disk_usage}%"
        elif [[ "$app_disk_usage" -lt 90 ]]; then
            log_warning "Application data disk usage: ${app_disk_usage}% (Warning: >80%)"
        else
            log_error "Application data disk usage: ${app_disk_usage}% (Critical: >90%)"
            return 1
        fi
    fi
    
    return 0
}

# Function to check memory usage
check_memory() {
    log_info "Checking memory usage..."
    
    if command -v free >/dev/null 2>&1; then
        local memory_info=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
        local memory_usage=$(echo "$memory_info" | cut -d. -f1)
        
        if [[ "$memory_usage" -lt 80 ]]; then
            log_success "Memory usage: ${memory_info}%"
        elif [[ "$memory_usage" -lt 90 ]]; then
            log_warning "Memory usage: ${memory_info}% (Warning: >80%)"
        else
            log_error "Memory usage: ${memory_info}% (Critical: >90%)"
            return 1
        fi
    else
        log_warning "free command not available, skipping memory check"
    fi
    
    return 0
}

# Function to check process health
check_processes() {
    log_info "Checking critical processes..."
    
    # Check if Node.js process is running
    if pgrep -f "node.*next" >/dev/null; then
        log_success "Next.js process is running"
    else
        log_error "Next.js process is not running"
        return 1
    fi
    
    return 0
}

# Function to check application-specific health
check_application_health() {
    log_info "Checking application-specific health..."
    
    # Check if Telegram bot is configured
    if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
        log_success "Telegram bot token is configured"
    else
        log_warning "Telegram bot token is not configured"
    fi
    
    # Check webhook URL configuration
    if [[ -n "$TELEGRAM_WEBHOOK_URL" ]]; then
        log_success "Telegram webhook URL is configured"
    else
        log_warning "Telegram webhook URL is not configured"
    fi
    
    return 0
}

# Function to generate health report
generate_health_report() {
    local status=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat << EOF
=================================================================
Mansoura CIH Telegram Attendance System - Health Check Report
=================================================================

Timestamp: $timestamp
Overall Status: $status
Checks Passed: $CHECKS_PASSED
Checks Failed: $CHECKS_FAILED

System Information:
- Hostname: $(hostname 2>/dev/null || echo "unknown")
- Uptime: $(uptime 2>/dev/null || echo "unknown")
- Load Average: $(cat /proc/loadavg 2>/dev/null | cut -d' ' -f1-3 || echo "unknown")

Service Status:
- Application: $([[ $OVERALL_STATUS -eq 0 ]] && echo "HEALTHY" || echo "UNHEALTHY")
- Database: $(check_port "$DATABASE_HOST" "$DATABASE_PORT" "Database" 1 >/dev/null 2>&1 && echo "AVAILABLE" || echo "UNAVAILABLE")
- Redis: $(check_port "$REDIS_HOST" "$REDIS_PORT" "Redis" 1 >/dev/null 2>&1 && echo "AVAILABLE" || echo "UNAVAILABLE")

Configuration:
- App Host: $APP_HOST:$APP_PORT
- Database: $DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME
- Redis: $REDIS_HOST:$REDIS_PORT
- Environment: ${NODE_ENV:-development}

=================================================================
EOF
}

# Main health check function
main() {
    log_info "Starting health check for Mansoura CIH Telegram Attendance System"
    log_info "Timestamp: $(date)"
    
    # Run all health checks
    check_database || true
    check_redis || true
    check_application || true
    check_disk_space || true
    check_memory || true
    check_processes || true
    check_application_health || true
    
    # Generate summary
    echo ""
    echo "=========================================="
    echo "           HEALTH CHECK SUMMARY"
    echo "=========================================="
    
    if [[ $OVERALL_STATUS -eq 0 ]]; then
        log_success "Overall system status: HEALTHY"
        log_info "Passed: $CHECKS_PASSED, Failed: $CHECKS_FAILED"
    else
        log_error "Overall system status: UNHEALTHY"
        log_error "Passed: $CHECKS_PASSED, Failed: $CHECKS_FAILED"
    fi
    
    echo "=========================================="
    
    # Generate detailed report in verbose mode
    if [[ "${VERBOSE:-false}" == "true" ]]; then
        generate_health_report $([[ $OVERALL_STATUS -eq 0 ]] && echo "HEALTHY" || echo "UNHEALTHY")
    fi
    
    exit $OVERALL_STATUS
}

# Handle command line arguments
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "Mansoura CIH Telegram Attendance System - Health Check Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  -v, --verbose     Show detailed health report"
        echo "  --json           Output results in JSON format"
        echo "  --quiet          Minimal output (exit codes only)"
        echo "  help             Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  APP_HOST                Application host (default: localhost)"
        echo "  APP_PORT                Application port (default: 3000)"
        echo "  POSTGRES_HOST           Database host (default: postgres)"
        echo "  POSTGRES_PORT           Database port (default: 5432)"
        echo "  POSTGRES_DB             Database name (default: mansoura_attendance)"
        echo "  POSTGRES_USER           Database user (default: postgres)"
        echo "  REDIS_HOST              Redis host (default: redis)"
        echo "  REDIS_PORT              Redis port (default: 6379)"
        echo "  HEALTH_CHECK_TIMEOUT    Timeout for checks (default: 10)"
        echo ""
        echo "Exit Codes:"
        echo "  0    All health checks passed"
        echo "  1    One or more health checks failed"
        exit 0
        ;;
    "-v"|"--verbose")
        VERBOSE=true
        main
        ;;
    "--json")
        # JSON output mode (simplified for now)
        main 2>/dev/null
        echo "{\"status\": \"$([[ $OVERALL_STATUS -eq 0 ]] && echo healthy || echo unhealthy)\", \"checks_passed\": $CHECKS_PASSED, \"checks_failed\": $CHECKS_FAILED, \"timestamp\": \"$(date -Iseconds)\"}"
        exit $OVERALL_STATUS
        ;;
    "--quiet")
        main >/dev/null 2>&1
        exit $OVERALL_STATUS
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
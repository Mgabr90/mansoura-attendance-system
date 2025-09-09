#!/bin/bash
# Database backup script for Mansoura CIH Telegram Attendance System
# Supports automated backups with rotation and optional encryption

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-mansoura_attendance}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mansoura_attendance_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[BACKUP INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[BACKUP SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[BACKUP WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[BACKUP ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to create backup directory
create_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        chmod 750 "$BACKUP_DIR"
    fi
}

# Function to check database connectivity
check_database_connection() {
    log_info "Checking database connectivity..."
    
    if ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; then
        log_error "Cannot connect to database at $POSTGRES_HOST:$POSTGRES_PORT"
        return 1
    fi
    
    log_success "Database connection verified"
    return 0
}

# Function to create database backup
create_backup() {
    log_info "Creating database backup: $BACKUP_FILE"
    log_info "Database: $POSTGRES_DB"
    log_info "Host: $POSTGRES_HOST:$POSTGRES_PORT"
    log_info "User: $POSTGRES_USER"
    
    # Create the backup
    if pg_dump -h "$POSTGRES_HOST" \
               -p "$POSTGRES_PORT" \
               -U "$POSTGRES_USER" \
               -d "$POSTGRES_DB" \
               --verbose \
               --clean \
               --if-exists \
               --create \
               --format=plain \
               --no-owner \
               --no-privileges > "$BACKUP_PATH"; then
        
        # Verify backup file was created and has content
        if [[ -f "$BACKUP_PATH" && -s "$BACKUP_PATH" ]]; then
            local file_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null || echo "unknown")
            log_success "Backup created successfully: $BACKUP_PATH (${file_size} bytes)"
            return 0
        else
            log_error "Backup file is empty or was not created"
            return 1
        fi
    else
        log_error "pg_dump command failed"
        return 1
    fi
}

# Function to compress backup
compress_backup() {
    if [[ "${BACKUP_COMPRESS:-true}" == "true" ]]; then
        log_info "Compressing backup..."
        
        if gzip -9 "$BACKUP_PATH"; then
            BACKUP_PATH="${BACKUP_PATH}.gz"
            BACKUP_FILE="${BACKUP_FILE}.gz"
            local compressed_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null || echo "unknown")
            log_success "Backup compressed: ${BACKUP_FILE} (${compressed_size} bytes)"
        else
            log_warning "Failed to compress backup, keeping uncompressed version"
        fi
    fi
}

# Function to encrypt backup
encrypt_backup() {
    if [[ -n "${BACKUP_ENCRYPTION_PASSWORD}" ]]; then
        log_info "Encrypting backup..."
        
        local encrypted_file="${BACKUP_PATH}.enc"
        if openssl enc -aes-256-cbc -salt -in "$BACKUP_PATH" -out "$encrypted_file" -pass pass:"$BACKUP_ENCRYPTION_PASSWORD"; then
            # Remove unencrypted backup
            rm "$BACKUP_PATH"
            BACKUP_PATH="$encrypted_file"
            BACKUP_FILE="${BACKUP_FILE}.enc"
            log_success "Backup encrypted: $BACKUP_FILE"
        else
            log_warning "Failed to encrypt backup, keeping unencrypted version"
        fi
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    find "$BACKUP_DIR" -name "mansoura_attendance_backup_*" -type f -mtime +${RETENTION_DAYS} -print0 | while IFS= read -r -d '' file; do
        log_info "Deleting old backup: $(basename "$file")"
        rm "$file"
        ((deleted_count++))
    done
    
    if [[ $deleted_count -gt 0 ]]; then
        log_success "Deleted $deleted_count old backup files"
    else
        log_info "No old backup files found to delete"
    fi
}

# Function to validate backup
validate_backup() {
    log_info "Validating backup integrity..."
    
    local temp_file="${BACKUP_PATH}.test"
    
    # If backup is compressed, decompress for validation
    if [[ "$BACKUP_PATH" == *.gz ]]; then
        if ! zcat "$BACKUP_PATH" > "$temp_file" 2>/dev/null; then
            log_error "Failed to decompress backup for validation"
            rm -f "$temp_file"
            return 1
        fi
    elif [[ "$BACKUP_PATH" == *.enc ]]; then
        if [[ -n "${BACKUP_ENCRYPTION_PASSWORD}" ]]; then
            if ! openssl enc -aes-256-cbc -d -in "$BACKUP_PATH" -out "$temp_file" -pass pass:"$BACKUP_ENCRYPTION_PASSWORD" 2>/dev/null; then
                log_error "Failed to decrypt backup for validation"
                rm -f "$temp_file"
                return 1
            fi
        else
            log_warning "Cannot validate encrypted backup without password"
            return 0
        fi
    else
        temp_file="$BACKUP_PATH"
    fi
    
    # Check if backup contains expected content
    if grep -q "PostgreSQL database dump" "$temp_file" && grep -q "$POSTGRES_DB" "$temp_file"; then
        log_success "Backup validation passed"
        [[ "$temp_file" != "$BACKUP_PATH" ]] && rm -f "$temp_file"
        return 0
    else
        log_error "Backup validation failed - backup may be corrupted"
        [[ "$temp_file" != "$BACKUP_PATH" ]] && rm -f "$temp_file"
        return 1
    fi
}

# Function to send notification (placeholder for integration with notification systems)
send_notification() {
    local status=$1
    local message=$2
    
    # This is a placeholder for notification integration
    # You can integrate with email, Slack, Discord, etc.
    log_info "Notification: $status - $message"
    
    # Example: Send to a webhook
    # curl -X POST "$NOTIFICATION_WEBHOOK" -d "{\"status\": \"$status\", \"message\": \"$message\"}" -H "Content-Type: application/json"
}

# Function to generate backup report
generate_report() {
    local status=$1
    local backup_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null || echo "0")
    local backup_count=$(find "$BACKUP_DIR" -name "mansoura_attendance_backup_*" -type f | wc -l)
    
    cat > "${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt" << EOF
Mansoura CIH Telegram Attendance System - Backup Report
=======================================================

Backup Date: $(date)
Status: $status
Database: $POSTGRES_DB
Host: $POSTGRES_HOST:$POSTGRES_PORT
User: $POSTGRES_USER

Backup Details:
- File: $BACKUP_FILE
- Size: $backup_size bytes
- Location: $BACKUP_PATH
- Compressed: ${BACKUP_COMPRESS:-true}
- Encrypted: $([ -n "${BACKUP_ENCRYPTION_PASSWORD}" ] && echo "Yes" || echo "No")

Retention:
- Retention Period: $RETENTION_DAYS days
- Total Backups: $backup_count files

System Information:
- Hostname: $(hostname)
- Disk Usage: $(df -h "$BACKUP_DIR" | tail -1)
- Memory Usage: $(free -h | head -2 | tail -1)

EOF

    log_info "Backup report generated: backup_report_${TIMESTAMP}.txt"
}

# Main backup function
main() {
    log_info "Starting backup process for Mansoura CIH Telegram Attendance System"
    log_info "Timestamp: $TIMESTAMP"
    
    # Create backup directory
    create_backup_dir
    
    # Check database connection
    if ! check_database_connection; then
        send_notification "ERROR" "Database connection failed"
        exit 1
    fi
    
    # Create backup
    if ! create_backup; then
        send_notification "ERROR" "Backup creation failed"
        generate_report "FAILED"
        exit 1
    fi
    
    # Compress backup
    compress_backup
    
    # Encrypt backup
    encrypt_backup
    
    # Validate backup
    if ! validate_backup; then
        log_error "Backup validation failed"
        send_notification "ERROR" "Backup validation failed"
        generate_report "FAILED"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Generate report
    generate_report "SUCCESS"
    
    # Send success notification
    send_notification "SUCCESS" "Database backup completed successfully: $BACKUP_FILE"
    
    log_success "Backup process completed successfully"
    log_info "Backup file: $BACKUP_PATH"
}

# Handle command line arguments
case "${1:-}" in
    "help"|"--help"|"-h")
        echo "Mansoura CIH Telegram Attendance System - Database Backup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (default)     Run backup process"
        echo "  list          List available backups"
        echo "  cleanup       Only run cleanup of old backups"
        echo "  verify        Verify the latest backup"
        echo "  help          Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  POSTGRES_HOST             Database host (default: postgres)"
        echo "  POSTGRES_PORT             Database port (default: 5432)"
        echo "  POSTGRES_DB               Database name (default: mansoura_attendance)"
        echo "  POSTGRES_USER             Database user (default: postgres)"
        echo "  PGPASSWORD                Database password"
        echo "  BACKUP_RETENTION_DAYS     Retention period (default: 30)"
        echo "  BACKUP_COMPRESS           Compress backup (default: true)"
        echo "  BACKUP_ENCRYPTION_PASSWORD Encrypt backup with password"
        echo "  NOTIFICATION_WEBHOOK      Webhook URL for notifications"
        exit 0
        ;;
    "list")
        log_info "Available backups:"
        ls -la "$BACKUP_DIR"/mansoura_attendance_backup_* 2>/dev/null || log_info "No backups found"
        exit 0
        ;;
    "cleanup")
        create_backup_dir
        cleanup_old_backups
        exit 0
        ;;
    "verify")
        latest_backup=$(ls -t "$BACKUP_DIR"/mansoura_attendance_backup_* 2>/dev/null | head -1)
        if [[ -n "$latest_backup" ]]; then
            BACKUP_PATH="$latest_backup"
            validate_backup
        else
            log_error "No backups found to verify"
            exit 1
        fi
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown command: $1"
        log_info "Use '$0 help' for usage information"
        exit 1
        ;;
esac
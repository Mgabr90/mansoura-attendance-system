# Docker Deployment Guide
## Mansoura CIH Telegram Attendance System

This guide provides comprehensive instructions for deploying the Mansoura CIH Telegram Attendance System using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+ and Docker Compose v2.0+
- At least 4GB RAM and 20GB disk space
- Valid Telegram Bot Token
- Domain name (for production deployment)
- SSL certificates (for HTTPS in production)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd mansoura-attendance-system

# Copy environment template
cp .env.docker .env

# Edit environment variables
nano .env
```

### 2. Basic Development Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Access the application
open http://localhost:3000
```

### 3. Production Deployment

```bash
# Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

## 🔧 Configuration

### Environment Variables

Copy `.env.docker` to `.env` and configure the following:

#### Required Variables

```env
# Database
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=mansoura_attendance

# Application
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_minimum
NEXTAUTH_URL=https://your-domain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/bot/webhook

# Security
JWT_SECRET=your_jwt_secret_32_chars_minimum
```

#### Optional Variables

```env
# Office Location (El Mansoura CIH)
OFFICE_LATITUDE=31.0417
OFFICE_LONGITUDE=31.3778
OFFICE_RADIUS=100

# Work Hours
DEFAULT_WORK_START=09:00
DEFAULT_WORK_END=17:00

# Admin Credentials
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=your_secure_admin_password
```

### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 64

# Generate JWT_SECRET
openssl rand -base64 32

# Generate secure passwords
pwgen -s 32 1
```

## 🏗️ Architecture

The Docker setup includes:

- **Next.js Application**: Main web app with Telegram bot integration
- **PostgreSQL**: Primary database with automatic migrations
- **Redis**: Session storage and caching (optional)
- **Nginx**: Reverse proxy with SSL termination
- **Monitoring**: Prometheus, Grafana, and Loki (production)

## 📦 Services

### Application Service (`app`)

- **Image**: Custom Next.js application
- **Ports**: 3000 (internal)
- **Health Check**: `/api/health`
- **Volumes**: Data, logs, uploads

### Database Service (`postgres`)

- **Image**: postgres:15-alpine
- **Ports**: 5432 (internal)
- **Volumes**: Persistent data storage
- **Health Check**: pg_isready

### Cache Service (`redis`)

- **Image**: redis:7-alpine  
- **Ports**: 6379 (internal)
- **Volumes**: Persistent cache storage
- **Health Check**: redis-cli ping

### Reverse Proxy (`nginx`)

- **Image**: nginx:alpine
- **Ports**: 80, 443
- **Features**: SSL, caching, rate limiting
- **Health Check**: curl health endpoint

## 🔒 Security Features

### Container Security

- Non-root user execution
- Read-only filesystems where possible
- Minimal attack surface with Alpine images
- Resource limits and restart policies

### Network Security

- Internal network isolation
- External port exposure only where needed
- Rate limiting and DDoS protection
- Security headers implementation

### Data Security

- Encrypted data at rest options
- Secret management via Docker secrets
- Database backup encryption
- SSL/TLS for all communications

## 🚀 Production Deployment

### SSL Certificate Setup

#### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/your-domain.com/* ./ssl/
```

#### Using Custom Certificates

```bash
# Create ssl directory
mkdir -p ssl

# Copy your certificates
cp your-cert.crt ssl/
cp your-private.key ssl/
cp your-ca-bundle.crt ssl/
```

### Docker Secrets Setup

```bash
# Create Docker secrets
echo "your_postgres_password" | docker secret create postgres_password -
echo "your_redis_password" | docker secret create redis_password -
echo "your_nextauth_secret" | docker secret create nextauth_secret -
echo "your_jwt_secret" | docker secret create jwt_secret -
echo "your_bot_token" | docker secret create telegram_bot_token -
```

### Production Environment

```env
# Production overrides
NODE_ENV=production
DOMAIN=your-domain.com
NEXTAUTH_URL=https://your-domain.com
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/bot/webhook
```

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost/api/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping

# Comprehensive health check
docker-compose exec app /app/scripts/healthcheck.sh --verbose
```

### Monitoring Stack (Production)

- **Prometheus**: Metrics collection (http://localhost:9090)
- **Grafana**: Dashboards and visualization (http://localhost:3001)
- **Loki**: Log aggregation and analysis

### Log Management

```bash
# View application logs
docker-compose logs -f app

# View database logs  
docker-compose logs -f postgres

# View nginx access logs
docker-compose logs -f nginx

# Export logs for analysis
docker-compose logs app > app-logs.txt
```

## 🗄️ Database Management

### Backup and Restore

#### Automated Backups

```bash
# Run backup script
docker-compose exec app /app/scripts/backup.sh

# List available backups
docker-compose exec app /app/scripts/backup.sh list

# Verify backup integrity
docker-compose exec app /app/scripts/backup.sh verify
```

#### Manual Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres -d mansoura_attendance > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres -d mansoura_attendance < backup.sql
```

### Database Migration

```bash
# Run migrations manually
docker-compose exec app npm run db:push

# Generate Prisma client
docker-compose exec app npm run db:generate

# Reset database (CAUTION: This deletes all data)
docker-compose exec app npm run db:reset
```

## 🔧 Maintenance

### Container Updates

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d --force-recreate

# Remove old images
docker image prune -f
```

### System Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (CAUTION: This deletes all data)
docker-compose down -v

# Clean up Docker system
docker system prune -f
docker volume prune -f
```

### Scaling

```bash
# Scale application horizontally
docker-compose up -d --scale app=3

# Check service status
docker-compose ps

# View resource usage
docker stats
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
netstat -tulpn | grep :3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

#### Database Connection Issues

```bash
# Check database logs
docker-compose logs postgres

# Test database connectivity
docker-compose exec app npm run db:generate

# Reset database connection
docker-compose restart postgres app
```

#### Permission Issues

```bash
# Fix file permissions
sudo chown -R 1001:1001 ./data ./logs
sudo chmod -R 755 ./scripts

# Make scripts executable
chmod +x scripts/*.sh
```

#### Memory Issues

```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
# Restart services
docker-compose restart
```

### Debug Mode

```bash
# Run in debug mode
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up

# Access container shell
docker-compose exec app bash

# View detailed logs
docker-compose logs --details app
```

### Performance Optimization

```bash
# Check container resource usage
docker stats

# Optimize database queries
docker-compose exec app npm run analyze

# Check application performance
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost/api/health"
```

## 📝 Telegram Bot Setup

### Webhook Configuration

The webhook is automatically configured when the container starts. Manual setup:

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"https://your-domain.com/api/bot/webhook\"}"

# Verify webhook
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

### Bot Commands

The bot supports these commands:
- `/start` - Initialize the bot
- `/checkin` - Record check-in time
- `/checkout` - Record check-out time  
- `/status` - View attendance status
- `/help` - Show available commands

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/app && docker-compose exec app /app/scripts/backup.sh
```

## 📞 Support

### Log Collection

```bash
# Collect all logs for support
mkdir -p support-logs
docker-compose logs > support-logs/all-services.log
docker-compose exec app /app/scripts/healthcheck.sh --verbose > support-logs/health-check.log
docker system info > support-logs/docker-info.log
```

### Performance Metrics

```bash
# Generate performance report
docker stats --no-stream > support-logs/resource-usage.log
docker-compose exec app npm run health:check > support-logs/app-health.log
```

For additional support, please include these logs when reporting issues.

## 📋 Checklists

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates in place (production)
- [ ] Domain DNS configured (production)
- [ ] Telegram bot token valid
- [ ] Webhook URL accessible
- [ ] Database credentials secure
- [ ] Backup strategy implemented
- [ ] Monitoring configured

### Post-deployment Checklist

- [ ] All services running (`docker-compose ps`)
- [ ] Health checks passing
- [ ] Application accessible via web
- [ ] Telegram bot responding
- [ ] Database connections working
- [ ] SSL certificates valid (production)
- [ ] Monitoring dashboards accessible
- [ ] Log rotation configured
- [ ] Backup verification completed

---

**Documentation Version**: 2.0.0  
**Last Updated**: 2025-09-09  
**Maintainer**: El Mansoura CIH
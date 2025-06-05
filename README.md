# El Mansoura CIH Telegram Attendance System

A modern, location-based attendance management system using Telegram bot integration, built with Next.js, TypeScript, Prisma, and PostgreSQL.

## 🌟 Features

- **Location-Based Verification**: GPS validation within 100m radius of office
- **Telegram Bot Integration**: Easy-to-use bot interface for employees
- **Real-Time Tracking**: Instant check-in/check-out with working hours calculation
- **Admin Dashboard**: Comprehensive web interface for management
- **Late/Early Detection**: Automatic detection with reason collection
- **Secure & Scalable**: Modern architecture with comprehensive logging

## 🏢 Office Configuration

- **Location**: El Mansoura CIH Office
- **Coordinates**: 31.0417°N, 31.3778°E (29R3+7Q El Mansoura 1, Egypt)
- **Verification Radius**: 100 meters
- **Work Hours**: 09:00 - 17:00 (configurable)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Telegram Bot Token (from @BotFather)

### Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd mansoura-attendance-system
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/attendance_db"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_bot_token_here"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/bot/webhook"

# Office Location (El Mansoura CIH)
OFFICE_LATITUDE=31.0417
OFFICE_LONGITUDE=31.3778
OFFICE_RADIUS=100

# Work Hours
WORK_START_HOUR=9
WORK_END_HOUR=17

# Security
NEXTAUTH_SECRET="your_secure_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Admin Settings
ADMIN_PASSWORD="secure_admin_password"
```

3. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Add sample data
npx prisma db seed
```

4. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📱 Telegram Bot Setup

1. **Create Bot with @BotFather**
   - Send `/newbot` to @BotFather
   - Choose name: `CIH Mansoura Attendance`
   - Choose username: `CIH_Mansoura_bot`
   - Save the token to your `.env` file

2. **Set Webhook**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/bot/webhook"
```

3. **Bot Commands**
   - `/start` - Register as new employee
   - `/status` - Check current attendance status
   - `/history` - View attendance history
   - `/help` - Show available commands

## 🏗️ Project Structure

```
mansoura-attendance-system/
├── prisma/
│   └── schema.prisma         # Database schema
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── attendance/  # Attendance management
│   │   │   ├── bot/         # Telegram webhook
│   │   │   └── employees/   # Employee management
│   │   ├── admin/           # Admin dashboard
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/          # React components
│   ├── lib/
│   │   ├── prisma.ts        # Database connection
│   │   └── telegram-bot.ts  # Bot implementation
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── utils/
│       ├── date.ts          # Date utilities
│       └── location.ts      # Location utilities
├── .env.example             # Environment template
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind CSS config
└── tsconfig.json           # TypeScript config
```

## 🔧 API Endpoints

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record

### Employees  
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees` - Update employee
- `DELETE /api/employees` - Deactivate employee

### Bot Webhook
- `POST /api/bot/webhook` - Telegram webhook endpoint

## 📊 Admin Dashboard

Access the admin dashboard at `/admin` to:

- View real-time attendance statistics
- Monitor recent employee activity
- Manage employee records
- Generate attendance reports
- Configure system settings

## 🛠️ Development

### Database Operations

```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate new migration
npx prisma migrate dev --name description
```

### Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 🚀 Deployment

### Environment Setup

1. **Database**: Set up PostgreSQL (recommended: Vercel Postgres, Supabase, or Railway)
2. **Hosting**: Deploy to Vercel, Netlify, or similar platform
3. **Environment Variables**: Configure all required environment variables

### Vercel Deployment

1. **Connect Repository**
   - Import project to Vercel
   - Configure environment variables
   - Deploy

2. **Database Setup**
   ```bash
   # After deployment, run migrations
   npx prisma db push
   ```

3. **Webhook Configuration**
   ```bash
   # Update Telegram webhook with production URL
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://your-app.vercel.app/api/bot/webhook"
   ```

### Docker Deployment

```bash
# Build Docker image
docker build -t mansoura-attendance .

# Run container
docker run -p 3000:3000 --env-file .env mansoura-attendance
```

## 📱 Employee Usage

### Registration
1. Start conversation with the bot
2. Share contact information
3. Complete registration form

### Daily Check-In/Out
1. Go to office location (within 100m)
2. Send location to bot via Telegram
3. Bot automatically detects check-in/out intent
4. Receive confirmation with working hours

### View Status
- Send `/status` to see current attendance
- Send `/history` for attendance history

## 🔐 Security Features

- Location-based verification
- Encrypted data transmission
- Comprehensive audit logging
- Rate limiting on API endpoints
- Input validation and sanitization

## 🔧 Configuration

### Work Hours
Modify work hours in environment variables:
```env
WORK_START_HOUR=9
WORK_END_HOUR=17
```

### Office Location
Update office coordinates:
```env
OFFICE_LATITUDE=31.0417
OFFICE_LONGITUDE=31.3778
OFFICE_RADIUS=100
```

### Telegram Bot
Configure bot settings:
```env
TELEGRAM_BOT_TOKEN="your_token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/bot/webhook"
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check webhook URL configuration
   - Verify bot token
   - Check server logs

2. **Location verification failing**
   - Ensure GPS permissions enabled
   - Check office coordinates configuration
   - Verify radius settings

3. **Database connection issues**
   - Verify DATABASE_URL format
   - Check database server status
   - Run `npx prisma db push`

### Support

For support or questions:
- Check logs in admin dashboard
- Review environment configuration
- Verify all required services are running

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**El Mansoura CIH** - Modern Attendance Management System
📍 29R3+7Q El Mansoura 1, Egypt 
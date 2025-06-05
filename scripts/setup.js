#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function setupDatabase() {
  console.log('🚀 Setting up El Mansoura CIH Attendance System Database...\n')

  try {
    // Check database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst()
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Skipping admin setup.')
    } else {
      console.log('\n📝 Creating admin user...')
      
      const username = await question('Enter admin username (default: admin): ') || 'admin'
      const email = await question('Enter admin email: ')
      const password = await question('Enter admin password (min 8 characters): ')

      if (!email || password.length < 8) {
        console.log('❌ Invalid email or password too short')
        process.exit(1)
      }

      // In a real application, you would hash the password
      const admin = await prisma.admin.create({
        data: {
          username,
          email,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      })

      console.log(`✅ Admin user created: ${admin.username}`)
    }

    // Check if system settings exist
    const existingSettings = await prisma.settings.findFirst()
    
    if (existingSettings) {
      console.log('⚠️  System settings already exist. Skipping settings setup.')
    } else {
      console.log('\n⚙️  Creating default system settings...')
      
      const settings = [
        {
          key: 'OFFICE_NAME',
          value: 'El Mansoura CIH',
          type: 'STRING',
          description: 'Office name'
        },
        {
          key: 'OFFICE_LATITUDE',
          value: '31.0417',
          type: 'DECIMAL',
          description: 'Office latitude coordinate'
        },
        {
          key: 'OFFICE_LONGITUDE',
          value: '31.3778',
          type: 'DECIMAL',
          description: 'Office longitude coordinate'
        },
        {
          key: 'OFFICE_RADIUS',
          value: '100',
          type: 'INTEGER',
          description: 'Allowed radius from office in meters'
        },
        {
          key: 'WORK_START_HOUR',
          value: '9',
          type: 'INTEGER',
          description: 'Work start hour (24-hour format)'
        },
        {
          key: 'WORK_END_HOUR',
          value: '17',
          type: 'INTEGER',
          description: 'Work end hour (24-hour format)'
        },
        {
          key: 'LATE_THRESHOLD_MINUTES',
          value: '15',
          type: 'INTEGER',
          description: 'Minutes after work start time to mark as late'
        },
        {
          key: 'EARLY_DEPARTURE_THRESHOLD_MINUTES',
          value: '30',
          type: 'INTEGER',
          description: 'Minutes before work end time to mark as early departure'
        }
      ]

      for (const setting of settings) {
        await prisma.settings.create({
          data: setting
        })
      }

      console.log('✅ Default system settings created')
    }

    // Check if sample employees exist
    const employeeCount = await prisma.employee.count()
    
    if (employeeCount === 0) {
      const createSample = await question('\n❓ Create sample employees? (y/N): ')
      
      if (createSample.toLowerCase() === 'y' || createSample.toLowerCase() === 'yes') {
        console.log('👥 Creating sample employees...')
        
        const sampleEmployees = [
          {
            telegramId: '123456789',
            firstName: 'Ahmed',
            lastName: 'Mohamed',
            phoneNumber: '+201234567890',
            department: 'IT',
            position: 'Software Developer',
            isActive: true
          },
          {
            telegramId: '987654321',
            firstName: 'Fatma',
            lastName: 'Ali',
            phoneNumber: '+201234567891',
            department: 'HR',
            position: 'HR Manager',
            isActive: true
          },
          {
            telegramId: '456789123',
            firstName: 'Mohamed',
            lastName: 'Hassan',
            phoneNumber: '+201234567892',
            department: 'Finance',
            position: 'Accountant',
            isActive: true
          }
        ]

        for (const employee of sampleEmployees) {
          await prisma.employee.create({
            data: {
              ...employee,
              registrationDate: new Date()
            }
          })
        }

        console.log('✅ Sample employees created')
      }
    } else {
      console.log(`ℹ️  Found ${employeeCount} existing employees`)
    }

    // Log setup completion
    await prisma.serverActivity.create({
      data: {
        action: 'SYSTEM_SETUP',
        details: 'Database setup completed successfully',
        ipAddress: 'localhost',
        userAgent: 'setup-script'
      }
    })

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Configure your .env file with Telegram bot token')
    console.log('2. Start the development server: npm run dev')
    console.log('3. Set up Telegram webhook for your bot')
    console.log('4. Visit http://localhost:3000 to access the application')
    console.log('5. Visit http://localhost:3000/admin for the admin dashboard')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

async function resetDatabase() {
  console.log('⚠️  DANGER: This will delete ALL data in the database!')
  const confirm = await question('Are you sure you want to reset the database? (yes/no): ')
  
  if (confirm !== 'yes') {
    console.log('❌ Database reset cancelled')
    process.exit(0)
  }

  try {
    console.log('🗑️  Resetting database...')
    
    // Delete all data in reverse dependency order
    await prisma.notificationLog.deleteMany()
    await prisma.serverActivity.deleteMany()
    await prisma.conversationState.deleteMany()
    await prisma.attendanceRecord.deleteMany()
    await prisma.exceptionalHours.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.webUser.deleteMany()
    await prisma.admin.deleteMany()
    await prisma.settings.deleteMany()

    console.log('✅ Database reset completed')
    
    // Run setup after reset
    await setupDatabase()
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--reset')) {
    await resetDatabase()
  } else {
    await setupDatabase()
  }
}

main().catch(console.error) 
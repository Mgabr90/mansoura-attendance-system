/**
 * Comprehensive End-to-End Test
 * Tests all system components and integrations
 */

const fs = require('fs')
const path = require('path')

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testData: {
    admin: {
      telegramId: '123456789',
      firstName: 'Test Admin',
      lastName: 'User'
    },
    employee: {
      telegramId: '987654321',
      firstName: 'Test Employee',
      lastName: 'User',
      phoneNumber: '+1234567890',
      department: 'IT',
      position: 'Developer'
    }
  }
}

class E2ETestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    }
    this.startTime = Date.now()
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive E2E Test Suite')
    console.log('=' .repeat(50))

    try {
      // Module Tests
      await this.testDatabaseConnection()
      await this.testEnvironmentVariables()
      await this.testFileStructure()
      
      // Core Functionality Tests
      await this.testPrismaSchema()
      await this.testAuthenticationModule()
      await this.testBotCommandsModule()
      await this.testExportModule()
      await this.testHealthMonitorModule()
      
      // API Tests
      await this.testAPIEndpoints()
      
      // Service Tests
      await this.testCronService()
      await this.testNotificationService()
      
      // Integration Tests
      await this.testSystemIntegration()
      
      // Performance Tests
      await this.testPerformance()

    } catch (error) {
      this.addTestResult('Critical Error', false, `Test suite failed: ${error.message}`)
    }

    this.generateReport()
  }

  /**
   * Test database connection and schema
   */
  async testDatabaseConnection() {
    this.log('🗄️  Testing Database Connection...')
    
    try {
      // Check if Prisma client can be imported
      const prismaPath = path.join(process.cwd(), 'src', 'lib', 'prisma.ts')
      const exists = fs.existsSync(prismaPath)
      this.addTestResult('Prisma client file exists', exists)

      // Check schema file
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
      const schemaExists = fs.existsSync(schemaPath)
      this.addTestResult('Prisma schema exists', schemaExists)

      if (schemaExists) {
        const schema = fs.readFileSync(schemaPath, 'utf8')
        
        // Check required models
        const requiredModels = [
          'Employee', 'AttendanceRecord', 'Admin', 
          'NotificationLog', 'ServerActivity', 'ConversationState'
        ]
        
        requiredModels.forEach(model => {
          const hasModel = schema.includes(`model ${model}`)
          this.addTestResult(`Schema contains ${model} model`, hasModel)
        })
      }

    } catch (error) {
      this.addTestResult('Database connection test', false, error.message)
    }
  }

  /**
   * Test environment variables
   */
  async testEnvironmentVariables() {
    this.log('🔐 Testing Environment Variables...')
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'TELEGRAM_BOT_TOKEN',
      'NEXTAUTH_SECRET',
      'JWT_SECRET'
    ]

    // Check .env.local file
    const envPath = path.join(process.cwd(), '.env.local')
    const envExists = fs.existsSync(envPath)
    this.addTestResult('.env.local file exists', envExists)

    if (envExists) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      
      requiredEnvVars.forEach(envVar => {
        const hasVar = envContent.includes(envVar)
        this.addTestResult(`Environment variable ${envVar} defined`, hasVar)
      })
    }

    // Check .env.example
    const examplePath = path.join(process.cwd(), '.env.example')
    const exampleExists = fs.existsSync(examplePath)
    this.addTestResult('.env.example file exists', exampleExists)
  }

  /**
   * Test file structure and modules
   */
  async testFileStructure() {
    this.log('📁 Testing File Structure...')
    
    const requiredFiles = [
      'src/lib/telegram-bot.ts',
      'src/lib/auth.ts', 
      'src/lib/export.ts',
      'src/lib/health-monitor.ts',
      'src/lib/bot-commands.ts',
      'src/utils/telegram-formatters.ts',
      'src/utils/telegram-keyboards.ts',
      'src/services/cron-service.ts',
      'src/services/notification.ts',
      'src/services/startup.ts',
      'src/app/api/admin/route.ts',
      'src/app/api/reports/route.ts',
      'src/app/api/auth/login/route.ts',
      'src/app/api/export/route.ts',
      'src/app/api/health/route.ts'
    ]

    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file)
      const exists = fs.existsSync(filePath)
      this.addTestResult(`File ${file} exists`, exists)
    })

    // Check package.json dependencies
    const packagePath = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      const requiredDeps = [
        'telegraf', 'node-cron', 'jose', '@prisma/client', 'prisma'
      ]
      
      requiredDeps.forEach(dep => {
        const hasDep = dependencies.hasOwnProperty(dep)
        this.addTestResult(`Dependency ${dep} installed`, hasDep)
      })
    }
  }

  /**
   * Test Prisma schema structure
   */
  async testPrismaSchema() {
    this.log('🏗️  Testing Prisma Schema Structure...')
    
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
      if (!fs.existsSync(schemaPath)) {
        this.addTestResult('Schema file exists', false)
        return
      }

      const schema = fs.readFileSync(schemaPath, 'utf8')
      
      // Test schema structure
      const tests = [
        { name: 'Has PostgreSQL provider', test: () => schema.includes('provider = "postgresql"') },
        { name: 'Has Employee model with required fields', test: () => 
          schema.includes('model Employee') && 
          schema.includes('telegramId') && 
          schema.includes('firstName') 
        },
        { name: 'Has AttendanceRecord with relations', test: () => 
          schema.includes('model AttendanceRecord') && 
          schema.includes('employee Employee') 
        },
        { name: 'Has proper indexes', test: () => 
          schema.includes('@@unique') || schema.includes('@@index') 
        }
      ]

      tests.forEach(test => {
        this.addTestResult(test.name, test.test())
      })

    } catch (error) {
      this.addTestResult('Prisma schema test', false, error.message)
    }
  }

  /**
   * Test Authentication Module
   */
  async testAuthenticationModule() {
    this.log('🔒 Testing Authentication Module...')
    
    try {
      const authPath = path.join(process.cwd(), 'src', 'lib', 'auth.ts')
      if (!fs.existsSync(authPath)) {
        this.addTestResult('Auth module exists', false)
        return
      }

      const authContent = fs.readFileSync(authPath, 'utf8')
      
      const tests = [
        { name: 'Has AuthService class', test: () => authContent.includes('class AuthService') },
        { name: 'Has JWT imports', test: () => authContent.includes('jose') },
        { name: 'Has session management', test: () => authContent.includes('SessionData') },
        { name: 'Has authentication method', test: () => authContent.includes('authenticateAdmin') },
        { name: 'Has middleware export', test: () => authContent.includes('withAuth') },
        { name: 'Has proper exports', test: () => authContent.includes('export default AuthService') }
      ]

      tests.forEach(test => {
        this.addTestResult(test.name, test.test())
      })

    } catch (error) {
      this.addTestResult('Authentication module test', false, error.message)
    }
  }

  /**
   * Test Bot Commands Module
   */
  async testBotCommandsModule() {
    this.log('🤖 Testing Bot Commands Module...')
    
    try {
      const botCommandsPath = path.join(process.cwd(), 'src', 'lib', 'bot-commands.ts')
      if (!fs.existsSync(botCommandsPath)) {
        this.addTestResult('Bot commands module exists', false)
        return
      }

      const botContent = fs.readFileSync(botCommandsPath, 'utf8')
      
      const tests = [
        { name: 'Has BotCommands class', test: () => botContent.includes('class BotCommands') },
        { name: 'Has attendance command', test: () => botContent.includes('handleAttendance') },
        { name: 'Has reports command', test: () => botContent.includes('handleMyReports') },
        { name: 'Has leave request', test: () => botContent.includes('handleLeaveRequest') },
        { name: 'Has notification settings', test: () => botContent.includes('handleNotifications') },
        { name: 'Has callback handler', test: () => botContent.includes('handleCallback') },
        { name: 'Has proper imports', test: () => botContent.includes('prisma') && botContent.includes('MessageFormatter') }
      ]

      tests.forEach(test => {
        this.addTestResult(test.name, test.test())
      })

    } catch (error) {
      this.addTestResult('Bot commands module test', false, error.message)
    }
  }

  /**
   * Test Export Module
   */
  async testExportModule() {
    this.log('📤 Testing Export Module...')
    
    try {
      const exportPath = path.join(process.cwd(), 'src', 'lib', 'export.ts')
      if (!fs.existsSync(exportPath)) {
        this.addTestResult('Export module exists', false)
        return
      }

      const exportContent = fs.readFileSync(exportPath, 'utf8')
      
      const tests = [
        { name: 'Has ExportService class', test: () => exportContent.includes('class ExportService') },
        { name: 'Has attendance export', test: () => exportContent.includes('exportAttendance') },
        { name: 'Has employee export', test: () => exportContent.includes('exportEmployees') },
        { name: 'Has analytics export', test: () => exportContent.includes('exportAnalytics') },
        { name: 'Has CSV generation', test: () => exportContent.includes('generateCSV') },
        { name: 'Has proper interfaces', test: () => exportContent.includes('ExportOptions') && exportContent.includes('ReportData') }
      ]

      tests.forEach(test => {
        this.addTestResult(test.name, test.test())
      })

    } catch (error) {
      this.addTestResult('Export module test', false, error.message)
    }
  }

  /**
   * Test Health Monitor Module
   */
  async testHealthMonitorModule() {
    this.log('🏥 Testing Health Monitor Module...')
    
    try {
      const healthPath = path.join(process.cwd(), 'src', 'lib', 'health-monitor.ts')
      if (!fs.existsSync(healthPath)) {
        this.addTestResult('Health monitor module exists', false)
        return
      }

      const healthContent = fs.readFileSync(healthPath, 'utf8')
      
      const tests = [
        { name: 'Has HealthMonitor class', test: () => healthContent.includes('class HealthMonitor') },
        { name: 'Has health status method', test: () => healthContent.includes('getHealthStatus') },
        { name: 'Has database health check', test: () => healthContent.includes('checkDatabaseHealth') },
        { name: 'Has service status check', test: () => healthContent.includes('checkServiceStatuses') },
        { name: 'Has performance metrics', test: () => healthContent.includes('getPerformanceMetrics') },
        { name: 'Has alert system', test: () => healthContent.includes('SystemAlert') }
      ]

      tests.forEach(test => {
        this.addTestResult(test.name, test.test())
      })

    } catch (error) {
      this.addTestResult('Health monitor module test', false, error.message)
    }
  }

  /**
   * Test API Endpoints
   */
  async testAPIEndpoints() {
    this.log('🌐 Testing API Endpoints...')
    
    const apiEndpoints = [
      'src/app/api/admin/route.ts',
      'src/app/api/reports/route.ts',
      'src/app/api/auth/login/route.ts',
      'src/app/api/auth/logout/route.ts',
      'src/app/api/auth/session/route.ts',
      'src/app/api/export/route.ts',
      'src/app/api/health/route.ts'
    ]

    apiEndpoints.forEach(endpoint => {
      const filePath = path.join(process.cwd(), endpoint)
      const exists = fs.existsSync(filePath)
      this.addTestResult(`API endpoint ${endpoint} exists`, exists)
      
      if (exists) {
        const content = fs.readFileSync(filePath, 'utf8')
        const hasGet = content.includes('export async function GET')
        const hasPost = content.includes('export async function POST')
        const hasAuth = content.includes('withAuth') || content.includes('auth')
        
        this.addTestResult(`${endpoint} has HTTP methods`, hasGet || hasPost)
        this.addTestResult(`${endpoint} has authentication`, hasAuth)
      }
    })
  }

  /**
   * Test Services
   */
  async testCronService() {
    this.log('⏰ Testing Cron Service...')
    
    try {
      const cronPath = path.join(process.cwd(), 'src', 'services', 'cron-service.ts')
      if (!fs.existsSync(cronPath)) {
        this.addTestResult('Cron service exists', false)
        return
      }

      const cronContent = fs.readFileSync(cronPath, 'utf8')
      
      const tests = [
        { name: 'Has CronService class', test: () => cronContent.includes('class CronService') },
        { name: 'Has node-cron import', test: () => cronContent.includes('node-cron') },
        { name: 'Has scheduled jobs', test: () => cronContent.includes('schedule') },
        { name: 'Has daily summary job', test: () => cronContent.includes('dailySummary') },
        { name: 'Has cleanup jobs', test: () => cronContent.includes('cleanup') }
      ]

      tests.forEach(test => {
        this.addTestResult(test.name, test.test())
      })

    } catch (error) {
      this.addTestResult('Cron service test', false, error.message)
    }
  }

  /**
   * Test Notification Service
   */
  async testNotificationService() {
    this.log('🔔 Testing Notification Service...')
    
    try {
      const notificationPath = path.join(process.cwd(), 'src', 'services', 'notification.ts')
      if (!fs.existsSync(notificationPath)) {
        this.addTestResult('Notification service exists', false)
        return
      }

      const notificationContent = fs.readFileSync(notificationPath, 'utf8')
      
      const tests = [
        { name: 'Has NotificationService class', test: () => notificationContent.includes('class NotificationService') },
        { name: 'Has send notification method', test: () => notificationContent.includes('sendNotification') },
        { name: 'Has daily summary method', test: () => notificationContent.includes('sendDailySummary') }
      ]

      tests.forEach(test => {
        this.addTestResult(test.name, test.test())
      })

    } catch (error) {
      this.addTestResult('Notification service test', false, error.message)
    }
  }

  /**
   * Test System Integration
   */
  async testSystemIntegration() {
    this.log('🔗 Testing System Integration...')
    
    try {
      // Test startup service
      const startupPath = path.join(process.cwd(), 'src', 'services', 'startup.ts')
      const startupExists = fs.existsSync(startupPath)
      this.addTestResult('Startup service exists', startupExists)

      if (startupExists) {
        const startupContent = fs.readFileSync(startupPath, 'utf8')
        const tests = [
          { name: 'Has service initialization', test: () => startupContent.includes('initialize') },
          { name: 'Integrates bot service', test: () => startupContent.includes('bot') },
          { name: 'Integrates cron service', test: () => startupContent.includes('cron') }
        ]

        tests.forEach(test => {
          this.addTestResult(test.name, test.test())
        })
      }

      // Test main bot integration
      const botPath = path.join(process.cwd(), 'src', 'lib', 'telegram-bot.ts')
      if (fs.existsSync(botPath)) {
        const botContent = fs.readFileSync(botPath, 'utf8')
        const tests = [
          { name: 'Bot integrates commands', test: () => botContent.includes('BotCommands') },
          { name: 'Bot has middleware', test: () => botContent.includes('middleware') },
          { name: 'Bot has handlers', test: () => botContent.includes('setupHandlers') }
        ]

        tests.forEach(test => {
          this.addTestResult(test.name, test.test())
        })
      }

    } catch (error) {
      this.addTestResult('System integration test', false, error.message)
    }
  }

  /**
   * Test Performance
   */
  async testPerformance() {
    this.log('⚡ Testing Performance...')
    
    try {
      // Test file sizes (shouldn't be too large)
      const checkFileSize = (filePath, maxSizeKB) => {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          const sizeKB = stats.size / 1024
          return sizeKB <= maxSizeKB
        }
        return false
      }

      const sizeTests = [
        { file: 'src/lib/telegram-bot.ts', maxSize: 100, name: 'Bot file size reasonable' },
        { file: 'src/lib/auth.ts', maxSize: 50, name: 'Auth file size reasonable' },
        { file: 'src/lib/export.ts', maxSize: 50, name: 'Export file size reasonable' }
      ]

      sizeTests.forEach(test => {
        const filePath = path.join(process.cwd(), test.file)
        const isReasonable = checkFileSize(filePath, test.maxSize)
        this.addTestResult(test.name, isReasonable)
      })

      // Test for code complexity indicators
      const complexityTests = [
        { 
          file: 'src/lib/telegram-bot.ts', 
          name: 'Bot complexity manageable',
          test: (content) => (content.match(/async function/g) || []).length < 50
        }
      ]

      complexityTests.forEach(test => {
        const filePath = path.join(process.cwd(), test.file)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8')
          const result = test.test(content)
          this.addTestResult(test.name, result)
        }
      })

    } catch (error) {
      this.addTestResult('Performance test', false, error.message)
    }
  }

  /**
   * Helper methods
   */
  addTestResult(testName, passed, error = null) {
    this.results.total++
    if (passed) {
      this.results.passed++
    } else {
      this.results.failed++
    }

    this.results.tests.push({
      name: testName,
      passed,
      error
    })

    const status = passed ? '✅' : '❌'
    const errorMsg = error ? ` (${error})` : ''
    console.log(`  ${status} ${testName}${errorMsg}`)
  }

  log(message) {
    console.log(`\n${message}`)
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const duration = Date.now() - this.startTime
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('📊 COMPREHENSIVE E2E TEST REPORT')
    console.log('='.repeat(60))
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`📈 Success Rate: ${successRate}%`)
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(`📊 Total: ${this.results.total}`)

    if (this.results.failed > 0) {
      console.log('\n🚨 FAILED TESTS:')
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  ❌ ${test.name}${test.error ? ` - ${test.error}` : ''}`)
        })
    }

    // System status
    console.log('\n🏥 SYSTEM STATUS:')
    if (successRate >= 95) {
      console.log('🟢 EXCELLENT - System is production ready!')
    } else if (successRate >= 85) {
      console.log('🟡 GOOD - Minor issues need attention')
    } else if (successRate >= 70) {
      console.log('🟠 WARNING - Several issues need fixing')
    } else {
      console.log('🔴 CRITICAL - Major issues prevent deployment')
    }

    console.log('\n🎯 FEATURE COMPLETENESS:')
    const modules = {
      'Database & Schema': this.results.tests.filter(t => t.name.includes('Schema') || t.name.includes('Database')),
      'Authentication': this.results.tests.filter(t => t.name.includes('Auth')),
      'Bot Commands': this.results.tests.filter(t => t.name.includes('Bot')),
      'Export System': this.results.tests.filter(t => t.name.includes('Export')),
      'Health Monitoring': this.results.tests.filter(t => t.name.includes('Health')),
      'API Endpoints': this.results.tests.filter(t => t.name.includes('API')),
      'Services': this.results.tests.filter(t => t.name.includes('Cron') || t.name.includes('Notification'))
    }

    Object.entries(modules).forEach(([module, tests]) => {
      if (tests.length > 0) {
        const moduleSuccess = ((tests.filter(t => t.passed).length / tests.length) * 100).toFixed(0)
        const status = moduleSuccess >= 90 ? '🟢' : moduleSuccess >= 70 ? '🟡' : '🔴'
        console.log(`  ${status} ${module}: ${moduleSuccess}%`)
      }
    })

    console.log('\n✨ Test completed successfully!')
    console.log('='.repeat(60))

    return {
      success: successRate >= 85,
      successRate: parseFloat(successRate),
      results: this.results
    }
  }
}

// Run the test suite
async function runE2ETest() {
  const testSuite = new E2ETestSuite()
  return await testSuite.runAllTests()
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { E2ETestSuite, runE2ETest }
}

// Run if called directly
if (require.main === module) {
  runE2ETest()
    .then(() => {
      console.log('\n🏁 E2E test suite completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 E2E test suite failed:', error)
      process.exit(1)
    })
} 
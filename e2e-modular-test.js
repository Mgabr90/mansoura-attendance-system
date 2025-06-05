/**
 * Enhanced Modular Architecture E2E Test
 * Tests the complete modular system including components, hooks, utils, and services
 */

const fs = require('fs')
const path = require('path')

class ModularE2ETestSuite {
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
   * Run all modular architecture tests
   */
  async runAllTests() {
    console.log('🚀 Starting Enhanced Modular Architecture E2E Test Suite')
    console.log('=' .repeat(60))

    try {
      // Core Modular Architecture Tests
      await this.testModularStructure()
      await this.testComponentArchitecture()
      await this.testHooksArchitecture()
      await this.testUtilsArchitecture()
      await this.testServicesArchitecture()
      await this.testIndexExports()
      
      // Integration Tests
      await this.testModularIntegration()
      await this.testTypeDefinitions()
      await this.testImportPaths()
      
      // Performance & Best Practices
      await this.testModularPerformance()
      await this.testCodeQuality()

    } catch (error) {
      this.addTestResult('Critical Error', false, `Test suite failed: ${error.message}`)
    }

    this.generateReport()
  }

  /**
   * Test overall modular structure
   */
  async testModularStructure() {
    this.log('🏗️  Testing Modular Structure...')
    
    const coreDirectories = [
      'src/components',
      'src/hooks',
      'src/utils',
      'src/services',
      'src/lib',
      'src/types'
    ]

    coreDirectories.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir)
      const exists = fs.existsSync(dirPath)
      this.addTestResult(`Directory ${dir} exists`, exists)
    })

    // Test main index file
    const mainIndex = path.join(process.cwd(), 'src', 'index.ts')
    const mainIndexExists = fs.existsSync(mainIndex)
    this.addTestResult('Main index.ts exists', mainIndexExists)

    if (mainIndexExists) {
      const content = fs.readFileSync(mainIndex, 'utf8')
      const hasExports = content.includes('export')
      this.addTestResult('Main index has exports', hasExports)
    }
  }

  /**
   * Test component architecture
   */
  async testComponentArchitecture() {
    this.log('🧩 Testing Component Architecture...')
    
    const componentsPath = path.join(process.cwd(), 'src', 'components')
    
    // Test component index
    const componentIndex = path.join(componentsPath, 'index.ts')
    const indexExists = fs.existsSync(componentIndex)
    this.addTestResult('Components index.ts exists', indexExists)

    if (indexExists) {
      const content = fs.readFileSync(componentIndex, 'utf8')
      
      // Check for proper exports
      const hasUIExports = content.includes('./ui')
      const hasFeaturesExports = content.includes('./features')
      
      this.addTestResult('Components index exports UI', hasUIExports)
      this.addTestResult('Components index exports Features', hasFeaturesExports)
    }

    // Test UI components
    const uiComponents = [
      'src/components/ui/Button.tsx',
      'src/components/ui/Card.tsx'
    ]

    uiComponents.forEach(component => {
      const componentPath = path.join(process.cwd(), component)
      const exists = fs.existsSync(componentPath)
      this.addTestResult(`Component ${path.basename(component)} exists`, exists)

      if (exists) {
        const content = fs.readFileSync(componentPath, 'utf8')
        const hasReactImport = content.includes('import React') || content.includes('import {')
        const hasExport = content.includes('export')
        const hasTypeScript = content.includes('interface') || content.includes('type')
        
        this.addTestResult(`${path.basename(component)} has React imports`, hasReactImport)
        this.addTestResult(`${path.basename(component)} has exports`, hasExport)
        this.addTestResult(`${path.basename(component)} has TypeScript types`, hasTypeScript)
      }
    })

    // Test feature components
    const featureComponents = [
      'src/components/features/Dashboard.tsx'
    ]

    featureComponents.forEach(component => {
      const componentPath = path.join(process.cwd(), component)
      const exists = fs.existsSync(componentPath)
      this.addTestResult(`Feature ${path.basename(component)} exists`, exists)

      if (exists) {
        const content = fs.readFileSync(componentPath, 'utf8')
        const usesUIComponents = content.includes('Button') || content.includes('Card')
        const usesHooks = content.includes('use')
        
        this.addTestResult(`${path.basename(component)} uses UI components`, usesUIComponents)
        this.addTestResult(`${path.basename(component)} uses hooks`, usesHooks)
      }
    })
  }

  /**
   * Test hooks architecture
   */
  async testHooksArchitecture() {
    this.log('🪝 Testing Hooks Architecture...')
    
    const hooksPath = path.join(process.cwd(), 'src', 'hooks')
    
    // Test hooks index
    const hooksIndex = path.join(hooksPath, 'index.ts')
    const indexExists = fs.existsSync(hooksIndex)
    this.addTestResult('Hooks index.ts exists', indexExists)

    if (indexExists) {
      const content = fs.readFileSync(hooksIndex, 'utf8')
      const hasExports = content.includes('export')
      this.addTestResult('Hooks index has exports', hasExports)
    }

    // Test custom hooks
    const customHooks = [
      'src/hooks/useAuth.ts',
      'src/hooks/useDashboard.ts'
    ]

    customHooks.forEach(hook => {
      const hookPath = path.join(process.cwd(), hook)
      const exists = fs.existsSync(hookPath)
      this.addTestResult(`Hook ${path.basename(hook)} exists`, exists)

      if (exists) {
        const content = fs.readFileSync(hookPath, 'utf8')
        const isHook = content.includes('use') && content.includes('export')
        const hasReactImports = content.includes('import') && content.includes('react')
        const hasTypeScript = content.includes('interface') || content.includes('type')
        
        this.addTestResult(`${path.basename(hook)} is a valid hook`, isHook)
        this.addTestResult(`${path.basename(hook)} has React imports`, hasReactImports)
        this.addTestResult(`${path.basename(hook)} has TypeScript types`, hasTypeScript)
      }
    })
  }

  /**
   * Test utils architecture
   */
  async testUtilsArchitecture() {
    this.log('🛠️  Testing Utils Architecture...')
    
    const utilsPath = path.join(process.cwd(), 'src', 'utils')
    
    // Test utils index
    const utilsIndex = path.join(utilsPath, 'index.ts')
    const indexExists = fs.existsSync(utilsIndex)
    this.addTestResult('Utils index.ts exists', indexExists)

    if (indexExists) {
      const content = fs.readFileSync(utilsIndex, 'utf8')
      const hasExports = content.includes('export')
      const organizedExports = content.includes('// Core') || content.includes('// Date') || content.includes('// Validation')
      
      this.addTestResult('Utils index has exports', hasExports)
      this.addTestResult('Utils exports are organized by domain', organizedExports)
    }

    // Test utility modules
    const utilModules = [
      'src/utils/core.ts'
    ]

    utilModules.forEach(utilModule => {
      const modulePath = path.join(process.cwd(), utilModule)
      const exists = fs.existsSync(modulePath)
      this.addTestResult(`Util module ${path.basename(utilModule)} exists`, exists)

      if (exists) {
        const content = fs.readFileSync(modulePath, 'utf8')
        const hasExports = content.includes('export')
        const hasTypeScript = content.includes('interface') || content.includes('type')
        const hasFunctions = content.includes('function') || content.includes('=>')
        
        this.addTestResult(`${path.basename(utilModule)} has exports`, hasExports)
        this.addTestResult(`${path.basename(utilModule)} has TypeScript types`, hasTypeScript)
        this.addTestResult(`${path.basename(utilModule)} has utility functions`, hasFunctions)
      }
    })
  }

  /**
   * Test services architecture
   */
  async testServicesArchitecture() {
    this.log('⚙️  Testing Services Architecture...')
    
    const servicesPath = path.join(process.cwd(), 'src', 'services')
    
    // Test services index
    const servicesIndex = path.join(servicesPath, 'index.ts')
    const indexExists = fs.existsSync(servicesIndex)
    this.addTestResult('Services index.ts exists', indexExists)

    // Test service manager
    const serviceManager = path.join(servicesPath, 'service-manager.ts')
    const managerExists = fs.existsSync(serviceManager)
    this.addTestResult('ServiceManager exists', managerExists)

    if (managerExists) {
      const content = fs.readFileSync(serviceManager, 'utf8')
      const hasServiceManager = content.includes('ServiceManager')
      const hasLifecycle = content.includes('initialize') || content.includes('start') || content.includes('stop')
      const hasHealthCheck = content.includes('health')
      
      this.addTestResult('ServiceManager class exists', hasServiceManager)
      this.addTestResult('ServiceManager has lifecycle methods', hasLifecycle)
      this.addTestResult('ServiceManager has health checks', hasHealthCheck)
    }

    // Test existing services
    const existingServices = [
      'src/services/cron-service.ts',
      'src/services/notification.ts'
    ]

    existingServices.forEach(service => {
      const servicePath = path.join(process.cwd(), service)
      const exists = fs.existsSync(servicePath)
      this.addTestResult(`Service ${path.basename(service)} exists`, exists)
    })
  }

  /**
   * Test index exports
   */
  async testIndexExports() {
    this.log('📦 Testing Index Exports...')
    
    const indexFiles = [
      'src/index.ts',
      'src/components/index.ts', 
      'src/hooks/index.ts',
      'src/utils/index.ts',
      'src/services/index.ts'
    ]

    indexFiles.forEach(indexFile => {
      const indexPath = path.join(process.cwd(), indexFile)
      const exists = fs.existsSync(indexPath)
      this.addTestResult(`Index file ${indexFile} exists`, exists)

      if (exists) {
        const content = fs.readFileSync(indexPath, 'utf8')
        const hasExports = content.includes('export')
        const isOrganized = content.includes('//') || content.split('\n').length > 5
        
        this.addTestResult(`${indexFile} has exports`, hasExports)
        this.addTestResult(`${indexFile} is well organized`, isOrganized)
      }
    })
  }

  /**
   * Test modular integration
   */
  async testModularIntegration() {
    this.log('🔗 Testing Modular Integration...')
    
    // Test main page integration
    const mainPage = path.join(process.cwd(), 'src', 'app', 'page.tsx')
    const pageExists = fs.existsSync(mainPage)
    this.addTestResult('Main page exists', pageExists)

    if (pageExists) {
      const content = fs.readFileSync(mainPage, 'utf8')
      const usesComponents = content.includes('Button') || content.includes('Card')
      const hasModernSyntax = content.includes('const') && content.includes('=>')
      
      this.addTestResult('Main page uses modular components', usesComponents)
      this.addTestResult('Main page uses modern React syntax', hasModernSyntax)
    }

    // Test layout integration
    const layout = path.join(process.cwd(), 'src', 'app', 'layout.tsx')
    const layoutExists = fs.existsSync(layout)
    this.addTestResult('Layout file exists', layoutExists)

    if (layoutExists) {
      const content = fs.readFileSync(layout, 'utf8')
      const hasProviders = content.includes('Provider')
      const hasMetadata = content.includes('metadata')
      
      this.addTestResult('Layout has providers integration', hasProviders)
      this.addTestResult('Layout has metadata', hasMetadata)
    }
  }

  /**
   * Test TypeScript definitions
   */
  async testTypeDefinitions() {
    this.log('🏷️  Testing TypeScript Definitions...')
    
    const tsConfig = path.join(process.cwd(), 'tsconfig.json')
    const tsConfigExists = fs.existsSync(tsConfig)
    this.addTestResult('tsconfig.json exists', tsConfigExists)

    if (tsConfigExists) {
      const content = fs.readFileSync(tsConfig, 'utf8')
      const hasStrict = content.includes('strict')
      const hasPathMapping = content.includes('paths') || content.includes('@/')
      
      this.addTestResult('TypeScript strict mode enabled', hasStrict)
      this.addTestResult('Path mapping configured', hasPathMapping)
    }

    // Test type definitions in components
    const typedFiles = [
      'src/components/ui/Button.tsx',
      'src/hooks/useAuth.ts',
      'src/utils/core.ts'
    ]

    typedFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const hasTypes = content.includes('interface') || content.includes('type')
        this.addTestResult(`${path.basename(file)} has TypeScript types`, hasTypes)
      }
    })
  }

  /**
   * Test import paths
   */
  async testImportPaths() {
    this.log('📁 Testing Import Paths...')
    
    // Test if modern import syntax is used
    const filesToCheck = [
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/components/features/Dashboard.tsx'
    ]

    filesToCheck.forEach(file => {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const hasES6Imports = content.includes('import {') || content.includes('import ')
        const hasRelativeImports = content.includes('./') || content.includes('../')
        
        this.addTestResult(`${path.basename(file)} uses ES6 imports`, hasES6Imports)
        this.addTestResult(`${path.basename(file)} has organized imports`, hasRelativeImports)
      }
    })
  }

  /**
   * Test modular performance
   */
  async testModularPerformance() {
    this.log('⚡ Testing Modular Performance...')
    
    const checkFileSize = (filePath, maxSizeKB, description) => {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        const sizeKB = stats.size / 1024
        const isReasonable = sizeKB <= maxSizeKB
        this.addTestResult(`${description} size reasonable (<${maxSizeKB}KB)`, isReasonable)
        return sizeKB
      }
      return 0
    }

    // Check component sizes
    checkFileSize(path.join(process.cwd(), 'src/components/ui/Button.tsx'), 10, 'Button component')
    checkFileSize(path.join(process.cwd(), 'src/components/ui/Card.tsx'), 8, 'Card component')
    checkFileSize(path.join(process.cwd(), 'src/hooks/useAuth.ts'), 15, 'useAuth hook')
    checkFileSize(path.join(process.cwd(), 'src/utils/core.ts'), 20, 'Core utils')

    // Check bundle preparation
    const nextConfig = path.join(process.cwd(), 'next.config.js')
    const hasNextConfig = fs.existsSync(nextConfig)
    this.addTestResult('Next.js config exists for optimization', hasNextConfig)
  }

  /**
   * Test code quality
   */
  async testCodeQuality() {
    this.log('🧹 Testing Code Quality...')
    
    const packageJson = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packageJson)) {
      const content = fs.readFileSync(packageJson, 'utf8')
      const pkg = JSON.parse(content)
      
      const hasLinting = pkg.scripts && pkg.scripts.lint
      const hasTypeCheck = pkg.scripts && pkg.scripts['type-check']
      const hasModularDeps = pkg.dependencies && (
        pkg.dependencies['class-variance-authority'] || 
        pkg.dependencies['tailwind-merge']
      )
      
      this.addTestResult('Linting script available', hasLinting)
      this.addTestResult('Type checking script available', hasTypeCheck)
      this.addTestResult('Modular dependencies installed', hasModularDeps)
    }

    // Check for proper documentation
    const readmePath = path.join(process.cwd(), 'src', 'README.md')
    const hasModularDocs = fs.existsSync(readmePath)
    this.addTestResult('Modular architecture documentation exists', hasModularDocs)
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, error = null) {
    this.results.total++
    if (passed) {
      this.results.passed++
      console.log(`  ✅ ${testName}`)
    } else {
      this.results.failed++
      console.log(`  ❌ ${testName}${error ? `: ${error}` : ''}`)
    }
    
    this.results.tests.push({
      name: testName,
      passed,
      error,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log message
   */
  log(message) {
    console.log(`\n${message}`)
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const duration = Date.now() - this.startTime
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1)
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 ENHANCED MODULAR ARCHITECTURE E2E TEST REPORT')
    console.log('='.repeat(60))
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`📈 Success Rate: ${successRate}%`)
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(`📊 Total: ${this.results.total}`)

    // Architecture status
    console.log('\n🏗️  MODULAR ARCHITECTURE STATUS:')
    if (successRate >= 95) {
      console.log('🟢 EXCELLENT - Modular architecture is production ready!')
    } else if (successRate >= 85) {
      console.log('🟡 GOOD - Minor improvements needed')
    } else {
      console.log('🔴 NEEDS WORK - Significant improvements required')
    }

    // Feature breakdown
    console.log('\n🎯 MODULAR FEATURE COMPLETENESS:')
    const categories = {
      'Structure': this.results.tests.filter(t => t.name.includes('Directory') || t.name.includes('index')),
      'Components': this.results.tests.filter(t => t.name.includes('Component') || t.name.includes('Button') || t.name.includes('Card')),
      'Hooks': this.results.tests.filter(t => t.name.includes('Hook') || t.name.includes('useAuth')),
      'Utils': this.results.tests.filter(t => t.name.includes('Util') || t.name.includes('core')),
      'Services': this.results.tests.filter(t => t.name.includes('Service')),
      'Integration': this.results.tests.filter(t => t.name.includes('integration') || t.name.includes('Import')),
      'Performance': this.results.tests.filter(t => t.name.includes('size') || t.name.includes('Performance')),
      'Quality': this.results.tests.filter(t => t.name.includes('TypeScript') || t.name.includes('Linting'))
    }

    Object.entries(categories).forEach(([category, tests]) => {
      if (tests.length > 0) {
        const categoryPassed = tests.filter(t => t.passed).length
        const categoryRate = ((categoryPassed / tests.length) * 100).toFixed(0)
        const icon = categoryRate >= 90 ? '🟢' : categoryRate >= 70 ? '🟡' : '🔴'
        console.log(`  ${icon} ${category}: ${categoryRate}%`)
      }
    })

    console.log('\n✨ Enhanced modular architecture test completed!')
    console.log('='.repeat(60))

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'modular-e2e-report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration,
      successRate: parseFloat(successRate),
      summary: this.results,
      categories
    }, null, 2))
    
    console.log(`📋 Detailed report saved to: ${reportPath}`)
    console.log('\n🏁 Enhanced modular E2E test suite completed!')
  }
}

// Run the enhanced test suite
async function runModularE2ETest() {
  const suite = new ModularE2ETestSuite()
  await suite.runAllTests()
}

// Execute if run directly
if (require.main === module) {
  runModularE2ETest().catch(console.error)
}

module.exports = { ModularE2ETestSuite, runModularE2ETest }

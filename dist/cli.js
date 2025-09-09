#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Import new core modules
import { ProjectScanner } from './core/scanner.js';
import { TemplateEngine } from './core/templates/engine.js';
import { NextjsFramework } from './core/frameworks/nextjs.js';
import { ReactFramework } from './core/frameworks/react.js';
import { ExpressFramework } from './core/frameworks/express.js';
import { ShopifyFramework } from './core/frameworks/shopify.js';
import { VersionChecker } from './core/version-checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Show banner on startup
console.log(chalk.blue.bold('\n🎭 Playwright Route Tester'));
console.log(chalk.gray('Smart test generation for web applications\n'));

// Check if user is running old commands and provide guidance
const args = process.argv.slice(2);
if (args.length === 0 || (args[0] === 'init' && !args.includes('--scan'))) {
  // Show smart features info for users who might be using old workflow
  setTimeout(async () => {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = await fs.readJson(packageJsonPath).catch(() => ({ version: '2.0.0' }));
    const versionChecker = new VersionChecker(packageJson.version);
    
    if (args.length === 0) {
      versionChecker.showSmartFeaturesInfo();
    }
  }, 100);
}

const program = new Command();

program
  .name('playwright-route-tester')
  .description('🎭 Smart Playwright test generator for route testing with authentication validation')
  .version('2.2.0', '-v, --version', 'Output the current version')
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage()
  });

// Help and information commands
program
  .command('info')
  .description('ℹ️  Show project information and detected settings')
  .action(async () => {
    try {
      const scanner = new ProjectScanner();
      const results = await scanner.scan();
      
      console.log(chalk.blue.bold('📋 Project Information\n'));
      
      console.log(chalk.cyan('Project Details:'));
      console.log(`  Framework: ${chalk.white(results.framework.name)} ${chalk.gray(results.framework.version || '')}`);
      console.log(`  Base URL: ${chalk.white(results.config.baseURL)}`);
      console.log(`  Login URL: ${chalk.white(results.config.loginURL)}`);
      console.log(`  Project Path: ${chalk.white(results.config.projectPath)}`);
      
      const existingTests = await directoryHasContents('./playwright-tests');
      console.log(`  Tests Setup: ${existingTests ? chalk.green('✅ Configured') : chalk.yellow('❌ Not configured')}`);
      
      console.log(chalk.cyan('\nRoute Summary:'));
      console.log(`  🌐 Public Routes: ${chalk.white(results.routes.public.length)}`);
      console.log(`  🔒 Protected Routes: ${chalk.white(results.routes.protected.length)}`);
      console.log(`  🔌 API Routes: ${chalk.white(results.routes.api.length)}`);
      
      if (results.routes.public.length + results.routes.protected.length + results.routes.api.length === 0) {
        console.log(chalk.yellow('\n⚠️  No routes detected. Try running with manual configuration.'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to get project info:'), error.message);
    }
  });

// New smart setup command
program
  .command('setup')
  .description('🚀 Smart zero-configuration setup - automatically detects your project')
  .option('-d, --directory <path>', 'Target directory', './playwright-tests')
  .option('--jenkins', 'Include Jenkins pipeline configuration')
  .option('--force', 'Overwrite existing files')
  .option('--no-version-check', 'Skip version update check')
  .action(async (options) => {
    await smartSetup(options);
  });

// Enhanced scan command
program
  .command('scan')
  .description('🔍 Scan current project for routes and framework detection')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    await scanProject(options);
  });

// Legacy init command (maintained for backwards compatibility)
program
  .command('init')
  .description('Initialize Playwright route testing setup (interactive mode)')
  .option('-d, --directory <path>', 'Target directory', './playwright-tests')
  .option('-b, --bare', 'Create minimal setup without prompts')
  .option('--scan', 'Auto-scan project first, then prompt for confirmation')
  .action(async (options) => {
    console.log(chalk.blue.bold('🎭 Playwright Route Tester Setup\n'));
    
    // Show smart setup recommendation for new users
    if (!options.scan && !options.bare) {
      console.log(chalk.yellow('💡 New Smart Setup Available!'));
      console.log(chalk.white('   For zero-configuration setup, try:'));
      console.log(chalk.green('   playwright-route-tester setup'));
      console.log(chalk.gray('   (Automatically detects your framework and routes)\n'));
      
      console.log(chalk.cyan('   Continuing with interactive setup...\n'));
    }
    
    let scanResults = null;
    if (options.scan || !options.bare) {
      console.log(chalk.yellow('🔍 Scanning your project first...\n'));
      try {
        const scanner = new ProjectScanner();
        scanResults = await scanner.scan();
        
        console.log(chalk.green(`✅ Detected ${scanResults.framework.name} project`));
        console.log(chalk.cyan(`📊 Found ${scanResults.routes.public.length} public, ${scanResults.routes.protected.length} protected, ${scanResults.routes.api.length} API routes\n`));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not auto-scan project, falling back to manual setup\n'));
      }
    }

    let config;
    if (options.bare) {
      config = scanResults ? {
        baseURL: scanResults.config.baseURL,
        loginURL: scanResults.config.loginURL,
        includeAPI: scanResults.routes.api.length > 0,
        routes: scanResults.routes,
        framework: scanResults.framework
      } : {
        baseURL: 'http://localhost:3000',
        loginURL: '/login',
        includeAPI: true,
        routes: {
          public: [{ url: '/', title: 'Home Page' }, { url: '/about', title: 'About' }],
          protected: [{ url: '/dashboard', title: 'Dashboard' }],
          api: [{ url: '/api/users', title: 'Users API' }]
        },
        framework: { name: 'unknown' }
      };
    } else {
      config = await interactiveSetup(scanResults);
    }

    await generateSmartProject(options.directory, config, options.bare);
  });

// Enhanced add-route command
program
  .command('add-route')
  .description('📝 Add a new route to existing test configuration')
  .option('-t, --type <type>', 'Route type (public, protected, api)', 'public')
  .option('-u, --url <url>', 'Route URL')
  .option('-n, --name <name>', 'Route name/title')
  .action(async (options) => {
    if (!options.url) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'What type of route?',
          choices: [
            { name: '🌐 Public Route (accessible without auth)', value: 'public' },
            { name: '🔒 Protected Route (requires auth)', value: 'protected' },
            { name: '🔌 API Route (backend endpoint)', value: 'api' }
          ],
          default: options.type
        },
        {
          type: 'input',
          name: 'url',
          message: 'Enter the route URL:',
          validate: (input) => {
            if (!input.trim()) return 'URL is required';
            if (!input.startsWith('/')) return 'URL must start with /';
            return true;
          }
        },
        {
          type: 'input',
          name: 'name',
          message: 'Enter a descriptive name:',
          validate: (input) => input.length > 0 || 'Name is required'
        }
      ]);
      
      options.type = answers.type;
      options.url = answers.url;
      options.name = answers.name;
    }

    await addRoute(options.type, options.url, options.name);
  });

// New smart setup function
async function smartSetup(options) {
  try {
    console.log(chalk.blue.bold('🚀 Smart Playwright Route Tester Setup\n'));
    
    // Get current version from package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = await fs.readJson(packageJsonPath).catch(() => ({ version: '2.0.0' }));
    const currentVersion = packageJson.version;
    
    // Check for updates (unless disabled)
    if (!options.noVersionCheck) {
      const versionChecker = new VersionChecker(currentVersion);
      await versionChecker.checkForUpdates();
    }
    
    // Check for existing setup
    const versionChecker = new VersionChecker(currentVersion);
    const existingSetup = await versionChecker.detectExistingSetup();
    
    if (existingSetup.hasPlaywrightTests && !options.force) {
      const action = await versionChecker.promptExistingSetupAction(existingSetup);
      
      if (action === 'upgrade_available') {
        console.log(chalk.yellow('\n⏳ Continuing with smart upgrade...'));
      } else if (action === 'already_updated') {
        console.log(chalk.cyan('\n🔄 Refreshing your smart setup...'));
      } else if (action === 'basic_detected') {
        console.log(chalk.yellow('\n💡 To overwrite existing setup, use --force flag'));
        console.log(chalk.white(`   Example: playwright-route-tester setup --force\n`));
        return;
      }
    }
    
    const scanner = new ProjectScanner();
    const scanResults = await scanner.scan();
    
    console.log(chalk.green(`✅ Auto-detected ${scanResults.framework.name} project`));
    console.log(chalk.cyan(`📊 Found ${scanResults.routes.public.length} public, ${scanResults.routes.protected.length} protected, ${scanResults.routes.api.length} API routes`));
    
    if (scanResults.routes.public.length > 0) {
      console.log(chalk.white('   Public routes:'), scanResults.routes.public.map(r => r.url).join(', '));
    }
    if (scanResults.routes.protected.length > 0) {
      console.log(chalk.white('   Protected routes:'), scanResults.routes.protected.map(r => r.url).join(', '));
    }
    if (scanResults.routes.api.length > 0) {
      console.log(chalk.white('   API routes:'), scanResults.routes.api.map(r => r.url).join(', '));
    }
    
    console.log();
    
    const config = {
      ...scanResults.config,
      routes: scanResults.routes,
      framework: scanResults.framework,
      features: {
        jenkins: options.jenkins,
        bare: true // Smart setup always uses bare mode for simplicity
      },
      targetDir: options.directory,
      projectPath: process.cwd()
    };
    
    await generateSmartProject(options.directory, config, true);
    
    // Generate Jenkins config if requested
    if (options.jenkins) {
      await generateJenkinsConfig(config);
    }
    
    console.log(chalk.green.bold('\n✅ Smart setup completed!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`1. cd ${options.directory}`));
    console.log(chalk.white('2. npm install'));
    console.log(chalk.white('3. npx playwright install'));
    console.log(chalk.white('4. npm test'));
    
    if (options.jenkins) {
      console.log(chalk.yellow('\n🔧 Jenkins pipeline created! Import your repo into Jenkins and run the pipeline.'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Smart setup failed:'), error.message);
    console.log(chalk.yellow('\n💡 Try running `playwright-route-tester init` for manual setup'));
    process.exit(1);
  }
}

async function scanProject(options) {
  try {
    const scanner = new ProjectScanner();
    const results = await scanner.scan();
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(chalk.blue.bold('🔍 Project Scan Results\n'));
      
      console.log(chalk.green('Framework:'), `${results.framework.name} ${results.framework.version || ''}`);
      console.log(chalk.green('Base URL:'), results.config.baseURL);
      console.log(chalk.green('Login URL:'), results.config.loginURL);
      
      console.log(chalk.cyan('\n📊 Routes Found:'));
      console.log(`  Public: ${results.routes.public.length}`);
      console.log(`  Protected: ${results.routes.protected.length}`);
      console.log(`  API: ${results.routes.api.length}`);
      
      if (results.routes.public.length > 0) {
        console.log(chalk.white('\n🌐 Public Routes:'));
        results.routes.public.forEach(route => {
          console.log(`  ${route.url} - ${route.title}`);
        });
      }
      
      if (results.routes.protected.length > 0) {
        console.log(chalk.white('\n🔒 Protected Routes:'));
        results.routes.protected.forEach(route => {
          console.log(`  ${route.url} - ${route.title}`);
        });
      }
      
      if (results.routes.api.length > 0) {
        console.log(chalk.white('\n🔌 API Routes:'));
        results.routes.api.forEach(route => {
          console.log(`  ${route.method || 'GET'} ${route.url} - ${route.title}`);
        });
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Scan failed:'), error.message);
    process.exit(1);
  }
}

async function interactiveSetup(scanResults) {
  const prompts = [];
  
  // Base URL prompt with smart default
  prompts.push({
    type: 'input',
    name: 'baseURL',
    message: 'What is your application base URL?',
    default: scanResults?.config?.baseURL || 'http://localhost:3000',
    validate: (input) => {
      try {
        new URL(input);
        return true;
      } catch {
        return 'Please enter a valid URL';
      }
    }
  });
  
  // Login URL with smart default
  prompts.push({
    type: 'input',
    name: 'loginURL',
    message: 'What is your login page URL?',
    default: scanResults?.config?.loginURL || '/login'
  });
  
  // Confirm detected routes or enter manually
  if (scanResults && scanResults.routes.public.length > 0) {
    prompts.push({
      type: 'confirm',
      name: 'useDetectedRoutes',
      message: `Use detected routes? (${scanResults.routes.public.length} public, ${scanResults.routes.protected.length} protected, ${scanResults.routes.api.length} API)`,
      default: true
    });
  } else {
    prompts.push({ type: 'input', name: 'useDetectedRoutes', default: false, when: () => false });
  }
  
  const answers = await inquirer.prompt(prompts);
  
  if (answers.useDetectedRoutes) {
    return {
      baseURL: answers.baseURL,
      loginURL: answers.loginURL,
      routes: scanResults.routes,
      framework: scanResults.framework,
      includeAPI: scanResults.routes.api.length > 0
    };
  } else {
    // Manual route entry
    const manualPrompts = [
      {
        type: 'confirm',
        name: 'includeAPI',
        message: 'Include API route testing?',
        default: true
      },
      {
        type: 'input',
        name: 'publicRoutes',
        message: 'Enter public routes (comma-separated):',
        default: '/, /about, /contact',
        filter: (input) => input.split(',').map(route => route.trim())
      },
      {
        type: 'input',
        name: 'protectedRoutes',
        message: 'Enter protected routes (comma-separated):',
        default: '/dashboard, /profile, /settings',
        filter: (input) => input.split(',').map(route => route.trim())
      }
    ];
    
    const manualAnswers = await inquirer.prompt(manualPrompts);
    
    if (manualAnswers.includeAPI) {
      const apiAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiRoutes',
          message: 'Enter API routes (comma-separated):',
          default: '/api/users, /api/products',
          filter: (input) => input.split(',').map(route => route.trim())
        }
      ]);
      manualAnswers.apiRoutes = apiAnswers.apiRoutes;
    }
    
    return {
      baseURL: answers.baseURL,
      loginURL: answers.loginURL,
      includeAPI: manualAnswers.includeAPI,
      routes: {
        public: manualAnswers.publicRoutes.map(url => ({ url, title: generateRouteTitle(url) })),
        protected: manualAnswers.protectedRoutes.map(url => ({ url, title: generateRouteTitle(url), requiresAuth: true })),
        api: manualAnswers.apiRoutes ? manualAnswers.apiRoutes.map(url => ({ url, title: generateRouteTitle(url), method: 'GET' })) : []
      },
      framework: scanResults?.framework || { name: 'unknown' }
    };
  }
}

async function generateSmartProject(targetDir, config, isBare = false) {
  try {
    console.log(chalk.yellow(`📁 Creating project in ${targetDir}...\n`));

    const templateEngine = new TemplateEngine();
    
    const templateConfig = {
      framework: config.framework,
      routes: config.routes,
      baseURL: config.baseURL,
      loginURL: config.loginURL,
      bare: isBare,
      features: config.features || {},
      projectPath: config.projectPath || process.cwd()
    };
    
    const result = await templateEngine.generateProject(templateConfig, targetDir);
    
    if (result.success) {
      console.log(chalk.green.bold('✅ Project setup complete!\n'));
      
      if (isBare) {
        console.log(chalk.cyan('Smart setup created with:'));
        console.log(chalk.white(`• ${config.routes.public.length} public route tests`));
        console.log(chalk.white(`• ${config.routes.protected.length} protected route tests`));
        console.log(chalk.white(`• ${config.routes.api.length} API route tests`));
        console.log(chalk.white(`• ${config.framework.name} framework optimizations`));
        
        console.log(chalk.yellow('\nSetup:'));
        console.log(chalk.white(`1. cd ${targetDir} && npm install && npx playwright install`));
        console.log(chalk.yellow('\nRun tests:'));
        console.log(chalk.white(`npm test`));
        
        if (config.framework.name !== 'unknown') {
          console.log(chalk.cyan(`\n🎯 Framework-specific features enabled for ${config.framework.name}`));
        }
      } else {
        console.log(chalk.cyan('Interactive setup completed with:'));
        console.log(chalk.white(`• Custom route configuration`));
        console.log(chalk.white(`• ${config.framework.name} framework support`));
        
        console.log(chalk.yellow('\nNext steps:'));
        console.log(chalk.white(`1. cd ${targetDir}`));
        console.log(chalk.white('2. npm install'));
        console.log(chalk.white('3. npx playwright install'));
        console.log(chalk.white('4. npm test'));
      }
    } else {
      throw new Error('Template generation failed');
    }

  } catch (error) {
    console.error(chalk.red('❌ Error generating project:'), error.message);
    if (error.stack) {
      console.log(chalk.gray('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
}

async function generateJenkinsConfig(config) {
  try {
    console.log(chalk.yellow('🔧 Generating Jenkins pipeline configuration...'));
    
    const templateEngine = new TemplateEngine();
    
    const jenkinsConfig = {
      framework: config.framework,
      baseURL: config.baseURL,
      loginURL: config.loginURL,
      routes: config.routes,
      features: config.features,
      projectPath: config.projectPath
    };
    
    const pipelineContent = await templateEngine.generateJenkinsConfig(jenkinsConfig);
    
    const jenkinsfilePath = path.join(config.projectPath || process.cwd(), 'Jenkinsfile');
    await fs.writeFile(jenkinsfilePath, pipelineContent);
    
    console.log(chalk.green('✅ Jenkins pipeline created at'), jenkinsfilePath);
  } catch (error) {
    console.error(chalk.red('❌ Failed to generate Jenkins config:'), error.message);
  }
}

function generateRouteTitle(url) {
  if (url === '/') return 'Home Page';
  
  return url
    .split('/')
    .filter(Boolean)
    .map(segment => {
      if (segment.startsWith(':')) {
        return segment.substring(1).charAt(0).toUpperCase() + segment.substring(2);
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(' ') + ' Page';
}

// Utility function to check if a directory exists and has contents
async function directoryHasContents(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) return false;
    
    const contents = await fs.readdir(dirPath);
    return contents.length > 0;
  } catch {
    return false;
  }
}

// Enhanced add-route command implementation
async function addRoute(type, url, name) {
  try {
    console.log(chalk.blue(`📝 Adding ${type} route: ${url} (${name})`));
    
    const testsDir = './playwright-tests';
    if (!await fs.pathExists(testsDir)) {
      console.error(chalk.red('❌ No existing test project found. Run setup first.'));
      process.exit(1);
    }
    
    const routeData = {
      url,
      title: name,
      ...(type === 'protected' && { requiresAuth: true, expectedRedirect: '/login' }),
      ...(type === 'api' && { method: 'GET', requiresAuth: true, expectedStatus: 401 })
    };
    
    const routeFilePath = path.join(testsDir, 'routes', `${type}-routes.js`);
    
    if (await fs.pathExists(routeFilePath)) {
      const content = await fs.readFile(routeFilePath, 'utf8');
      const routesMatch = content.match(/export const \w+Routes = (\[[\s\S]*\]);/);
      
      if (routesMatch) {
        const routes = JSON.parse(routesMatch[1]);
        routes.push(routeData);
        
        const newContent = content.replace(
          routesMatch[0],
          `export const ${type}Routes = ${JSON.stringify(routes, null, 2)};`
        );
        
        await fs.writeFile(routeFilePath, newContent);
        console.log(chalk.green(`✅ Added ${type} route to ${routeFilePath}`));
      }
    } else {
      console.log(chalk.yellow(`⚠️  Route file not found: ${routeFilePath}`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to add route:'), error.message);
    process.exit(1);
  }
}

// Add Jenkins pipeline generation command
program
  .command('jenkins')
  .description('🔧 Generate Jenkins pipeline configuration')
  .option('--framework <name>', 'Specify framework (nextjs, react, express)')
  .action(async (options) => {
    try {
      const scanner = new ProjectScanner();
      const scanResults = await scanner.scan();
      
      const config = {
        framework: options.framework ? { name: options.framework } : scanResults.framework,
        baseURL: scanResults.config.baseURL,
        loginURL: scanResults.config.loginURL,
        routes: scanResults.routes,
        features: { jenkins: true },
        projectPath: process.cwd()
      };
      
      await generateJenkinsConfig(config);
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate Jenkins config:'), error.message);
      process.exit(1);
    }
  });

program.parse();

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('💥 Unhandled Rejection:'), reason);
  process.exit(1);
});
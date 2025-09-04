#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('playwright-route-tester')
  .description('Generate Playwright tests for route testing with authentication validation')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Playwright route testing setup')
  .option('-d, --directory <path>', 'Target directory', './playwright-tests')
  .option('-b, --bare', 'Create minimal setup without prompts - generates barebone public, protected and API tests')
  .action(async (options) => {
    console.log(chalk.blue.bold('🎭 Playwright Route Tester Setup\n'));

    let answers;

    if (options.bare) {
      // Bare mode - use defaults without prompts
      answers = {
        baseURL: 'http://localhost:3000',
        loginURL: '/login',
        includeAPI: true,
        publicRoutes: ['/', '/about', '/contact'],
        protectedRoutes: ['/dashboard', '/profile', '/settings'],
        apiRoutes: ['/api/users', '/api/products']
      };
      console.log(chalk.yellow('🚀 Creating bare setup with default routes...\n'));
    } else {
      answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'baseURL',
          message: 'What is your application base URL?',
          default: 'http://localhost:3000',
          validate: (input) => {
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          }
        },
        {
          type: 'input',
          name: 'loginURL',
          message: 'What is your login page URL (relative to base URL)?',
          default: '/login'
        },
        {
          type: 'confirm',
          name: 'includeAPI',
          message: 'Do you want to include API route testing?',
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
      ]);

      if (answers.includeAPI) {
        const apiAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'apiRoutes',
            message: 'Enter API routes to test (comma-separated):',
            default: '/api/users, /api/products',
            filter: (input) => input.split(',').map(route => route.trim())
          }
        ]);
        answers.apiRoutes = apiAnswers.apiRoutes;
      }
    }

    await generateProject(options.directory, answers, options.bare);
  });

program
  .command('add-route')
  .description('Add a new route to existing test configuration')
  .option('-t, --type <type>', 'Route type (public, protected, api)', 'public')
  .option('-u, --url <url>', 'Route URL')
  .option('-n, --name <name>', 'Route name/title')
  .action(async (options) => {
    if (!options.url) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter the route URL:',
          validate: (input) => input.length > 0 || 'URL is required'
        },
        {
          type: 'input',
          name: 'name',
          message: 'Enter a descriptive name for this route:',
          validate: (input) => input.length > 0 || 'Name is required'
        }
      ]);
      options.url = answers.url;
      options.name = answers.name;
    }

    await addRoute(options.type, options.url, options.name);
  });

async function generateProject(targetDir, config, isBare = false) {
  try {
    console.log(chalk.yellow(`📁 Creating project in ${targetDir}...\n`));

    await fs.ensureDir(targetDir);

    const templatesDir = path.join(__dirname, '../templates');
    
    // Copy and process templates
    if (isBare) {
      await processTemplate(
        path.join(templatesDir, 'bare.playwright.config.js.template'),
        path.join(targetDir, 'playwright.config.js'),
        config
      );

      await processTemplate(
        path.join(templatesDir, 'config/bare.test-config.js.template'),
        path.join(targetDir, 'config/test-config.js'),
        config
      );
    } else {
      await processTemplate(
        path.join(templatesDir, 'playwright.config.js.template'),
        path.join(targetDir, 'playwright.config.js'),
        config
      );

      await processTemplate(
        path.join(templatesDir, 'config/test-config.js.template'),
        path.join(targetDir, 'config/test-config.js'),
        config
      );
    }

    await processTemplate(
      path.join(templatesDir, 'helpers/redirect-helper.js.template'),
      path.join(targetDir, 'helpers/redirect-helper.js'),
      config
    );

    // Generate route files
    await generateRouteFiles(targetDir, config);

    // Generate test files
    await generateTestFiles(targetDir, config, isBare);

    // Generate package.json for the test project
    await generateTestPackageJson(targetDir, isBare);

    console.log(chalk.green.bold('✅ Project setup complete!\n'));
    
    if (isBare) {
      console.log(chalk.cyan('Bare setup created with:'));
      console.log(chalk.white('• Public route tests'));
      console.log(chalk.white('• Protected route authentication tests'));
      console.log(chalk.white('• API route tests'));
      console.log(chalk.yellow('\nSetup:'));
      console.log(chalk.white(`1. cd ${targetDir} && npm install && npx playwright install`));
      console.log(chalk.yellow('\nAdd to your main package.json scripts:'));
      console.log(chalk.green(`"test:routes": "npx playwright test --config=${targetDir}/playwright.config.js"`));
      console.log(chalk.yellow('\nThen run from project root:'));
      console.log(chalk.white(`npm run test:routes`));
    } else {
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.white(`1. cd ${targetDir}`));
      console.log(chalk.white('2. npm install'));
      console.log(chalk.white('3. npx playwright install'));
      console.log(chalk.white('4. npm test'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error generating project:'), error.message);
    process.exit(1);
  }
}

async function processTemplate(templatePath, outputPath, config) {
  await fs.ensureDir(path.dirname(outputPath));
  
  const template = await fs.readFile(templatePath, 'utf8');
  const processed = template
    .replace(/\{\{baseURL\}\}/g, config.baseURL)
    .replace(/\{\{loginURL\}\}/g, config.loginURL);
    
  await fs.writeFile(outputPath, processed);
}

async function generateRouteFiles(targetDir, config) {
  const routesDir = path.join(targetDir, 'routes');
  await fs.ensureDir(routesDir);

  // Public routes
  const publicRoutes = config.publicRoutes.map((route, index) => ({
    url: route,
    title: `Public Route ${index + 1}`,
    expectedStatus: 200,
    timeout: 10000,
    keyElement: null
  }));

  await fs.writeFile(
    path.join(routesDir, 'public-routes.js'),
    `export const publicRoutes = ${JSON.stringify(publicRoutes, null, 2)};`
  );

  // Protected routes
  const protectedRoutes = config.protectedRoutes.map((route, index) => ({
    url: route,
    title: `Protected Route ${index + 1}`,
    requiresAuth: true,
    expectedRedirect: config.loginURL
  }));

  await fs.writeFile(
    path.join(routesDir, 'protected-routes.js'),
    `export const protectedRoutes = ${JSON.stringify(protectedRoutes, null, 2)};`
  );

  // API routes (if requested)
  if (config.apiRoutes) {
    const apiRoutes = config.apiRoutes.map((route, index) => ({
      url: route,
      title: `API Route ${index + 1}`,
      method: 'GET',
      requiresAuth: true,
      expectedStatus: 401 // Unauthorized when not authenticated
    }));

    await fs.writeFile(
      path.join(routesDir, 'api-routes.js'),
      `export const apiRoutes = ${JSON.stringify(apiRoutes, null, 2)};`
    );
  }
}

async function generateTestFiles(targetDir, config, isBare = false) {
  const testsDir = path.join(targetDir, 'tests');
  await fs.ensureDir(testsDir);
  
  const templatesDir = path.join(__dirname, '../templates');

  if (isBare) {
    // Use bare templates with direct processing
    await processTemplate(
      path.join(templatesDir, 'tests/bare.public-routes.spec.js.template'),
      path.join(testsDir, 'public-routes.spec.js'),
      config
    );

    await processTemplate(
      path.join(templatesDir, 'tests/bare.auth-redirect.spec.js.template'),
      path.join(testsDir, 'auth-redirect.spec.js'),
      config
    );

    if (config.apiRoutes) {
      await processTemplate(
        path.join(templatesDir, 'tests/bare.api-routes.spec.js.template'),
        path.join(testsDir, 'api-routes.spec.js'),
        config
      );
    }
  } else {
    // Copy test templates (original behavior)
    await fs.copy(
      path.join(templatesDir, 'tests/public-routes.spec.js.template'),
      path.join(testsDir, 'public-routes.spec.js')
    );

    await fs.copy(
      path.join(templatesDir, 'tests/auth-redirect.spec.js.template'),
      path.join(testsDir, 'auth-redirect.spec.js')
    );

    if (config.apiRoutes) {
      await fs.copy(
        path.join(templatesDir, 'tests/api-routes.spec.js.template'),
        path.join(testsDir, 'api-routes.spec.js')
      );
    }
  }
}

async function generateTestPackageJson(targetDir, isBare = false) {
  const packageJson = {
    name: "playwright-route-tests",
    version: "1.0.0",
    description: "Generated Playwright route tests",
    type: "module",
    scripts: {
      "test": "playwright test",
      "test:headed": "playwright test --headed",
      "test:debug": "playwright test --debug",
      "report": "playwright show-report"
    },
    dependencies: {
      "@playwright/test": "^1.37.0"
    }
  };

  await fs.writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

async function addRoute(type, url, name) {
  // Implementation for adding routes to existing configuration
  console.log(chalk.blue(`Adding ${type} route: ${url} (${name})`));
  // This would modify existing route files
}

program.parse();
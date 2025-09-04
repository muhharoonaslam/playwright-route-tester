#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const templatesDir = path.join(__dirname, '../templates');

async function build() {
  console.log('🔨 Building playwright-route-tester...');
  
  try {
    // Clean dist directory
    await fs.remove(distDir);
    await fs.ensureDir(distDir);
    
    // Copy source files to dist
    console.log('📁 Copying source files...');
    await fs.copy(srcDir, distDir);
    
    // Make CLI executable
    const cliPath = path.join(distDir, 'cli.js');
    if (await fs.pathExists(cliPath)) {
      await fs.chmod(cliPath, '755');
      console.log('✅ Made CLI executable');
    }
    
    // Verify templates directory exists for packaging
    if (await fs.pathExists(templatesDir)) {
      console.log('✅ Templates directory ready for packaging');
    } else {
      throw new Error('Templates directory not found');
    }
    
    // Create a simple test to verify build
    await verifyBuild();
    
    console.log('✅ Build completed successfully!');
    console.log(`📦 Built files are in: ${distDir}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function verifyBuild() {
  console.log('🧪 Verifying build...');
  
  // Check main files exist
  const requiredFiles = [
    path.join(distDir, 'cli.js'),
    path.join(distDir, 'index.js')
  ];
  
  for (const file of requiredFiles) {
    if (!await fs.pathExists(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  // Check template files exist
  const requiredTemplates = [
    'playwright.config.js.template',
    'config/test-config.js.template',
    'helpers/redirect-helper.js.template',
    'tests/public-routes.spec.js.template',
    'tests/auth-redirect.spec.js.template',
    'tests/api-routes.spec.js.template'
  ];
  
  for (const template of requiredTemplates) {
    const templatePath = path.join(templatesDir, template);
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Required template missing: ${templatePath}`);
    }
  }
  
  // Verify package.json has correct structure
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  if (!packageJson.bin || !packageJson.bin['playwright-route-tester']) {
    throw new Error('package.json missing bin configuration');
  }
  
  if (!packageJson.main) {
    throw new Error('package.json missing main field');
  }
  
  console.log('✅ Build verification passed');
}

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch(error => {
    console.error('❌ Build script failed:', error);
    process.exit(1);
  });
}
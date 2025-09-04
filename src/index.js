// Programmatic API for playwright-route-tester

import fs from 'fs-extra';
import path from 'path';

export class PlaywrightRouteTester {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:3000',
      loginURL: config.loginURL || '/login',
      timeout: config.timeout || 10000,
      ...config
    };
  }

  async generateTests(targetDir, routes) {
    await fs.ensureDir(targetDir);
    
    // Generate configuration files
    await this.generateConfig(targetDir);
    
    // Generate route files
    await this.generateRouteFiles(targetDir, routes);
    
    // Generate test files
    await this.generateTestFiles(targetDir, routes);
    
    return {
      success: true,
      message: `Tests generated in ${targetDir}`,
      files: await this.getGeneratedFiles(targetDir)
    };
  }

  async generateConfig(targetDir) {
    const configDir = path.join(targetDir, 'config');
    await fs.ensureDir(configDir);

    const testConfig = `export const testConfig = {
  baseURL: '${this.config.baseURL}',
  loginURL: '${this.config.loginURL}',
  timeout: ${this.config.timeout}
};`;

    await fs.writeFile(path.join(configDir, 'test-config.js'), testConfig);
  }

  async generateRouteFiles(targetDir, routes) {
    const routesDir = path.join(targetDir, 'routes');
    await fs.ensureDir(routesDir);

    if (routes.public) {
      await fs.writeFile(
        path.join(routesDir, 'public-routes.js'),
        `export const publicRoutes = ${JSON.stringify(routes.public, null, 2)};`
      );
    }

    if (routes.protected) {
      await fs.writeFile(
        path.join(routesDir, 'protected-routes.js'),
        `export const protectedRoutes = ${JSON.stringify(routes.protected, null, 2)};`
      );
    }

    if (routes.api) {
      await fs.writeFile(
        path.join(routesDir, 'api-routes.js'),
        `export const apiRoutes = ${JSON.stringify(routes.api, null, 2)};`
      );
    }
  }

  async generateTestFiles(targetDir, routes) {
    // Implementation would generate test files based on routes
    // This is a simplified version for the programmatic API
  }

  async getGeneratedFiles(targetDir) {
    const files = [];
    const walk = async (dir) => {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await walk(fullPath);
        } else {
          files.push(path.relative(targetDir, fullPath));
        }
      }
    };
    
    await walk(targetDir);
    return files;
  }
}

export default PlaywrightRouteTester;
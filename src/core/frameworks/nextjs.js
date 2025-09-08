import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class NextjsFramework {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.hasAppRouter = false;
    this.hasPagesRouter = false;
  }

  async detect() {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return false;
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (!deps.next) {
      return false;
    }
    
    this.hasAppRouter = await fs.pathExists(path.join(this.projectPath, 'app'));
    this.hasPagesRouter = await fs.pathExists(path.join(this.projectPath, 'pages'));
    
    return {
      name: 'nextjs',
      version: deps.next,
      hasAppRouter: this.hasAppRouter,
      hasPagesRouter: this.hasPagesRouter
    };
  }

  async scanRoutes() {
    const routes = { public: [], protected: [], api: [] };
    
    if (this.hasAppRouter) {
      await this.scanAppRouter(routes);
    }
    
    if (this.hasPagesRouter) {
      await this.scanPagesRouter(routes);
    }
    
    return routes;
  }

  async scanAppRouter(routes) {
    const appDir = path.join(this.projectPath, 'app');
    
    // Find all page files
    const pageFiles = await glob('**/page.{js,jsx,ts,tsx}', { cwd: appDir });
    
    // Find all route files (API routes)
    const routeFiles = await glob('**/route.{js,jsx,ts,tsx}', { cwd: appDir });
    
    // Process page files
    for (const file of pageFiles) {
      const routePath = this.convertAppRouterPathToUrl(file);
      const isProtected = this.isProtectedRoute(routePath);
      
      const route = {
        url: routePath,
        title: this.generateRouteTitle(routePath),
        file: path.join(appDir, file),
        type: 'page'
      };
      
      if (isProtected) {
        routes.protected.push({
          ...route,
          requiresAuth: true,
          expectedRedirect: '/login'
        });
      } else {
        routes.public.push({
          ...route,
          expectedStatus: 200
        });
      }
    }
    
    // Process API route files
    for (const file of routeFiles) {
      const routePath = this.convertAppRouterPathToUrl(file);
      
      routes.api.push({
        url: routePath,
        title: this.generateRouteTitle(routePath),
        method: 'GET', // Default, could be enhanced to detect actual methods
        file: path.join(appDir, file),
        type: 'api',
        requiresAuth: true,
        expectedStatus: 401
      });
    }
  }

  async scanPagesRouter(routes) {
    const pagesDir = path.join(this.projectPath, 'pages');
    
    if (!await fs.pathExists(pagesDir)) {
      return;
    }
    
    const pageFiles = await glob('**/*.{js,jsx,ts,tsx}', {
      cwd: pagesDir,
      ignore: ['_app.*', '_document.*', '_error.*', '404.*', '500.*']
    });
    
    for (const file of pageFiles) {
      const routePath = this.convertPagesRouterPathToUrl(file);
      const isApiRoute = file.startsWith('api/');
      
      if (isApiRoute) {
        routes.api.push({
          url: routePath,
          title: this.generateRouteTitle(routePath),
          method: 'GET',
          file: path.join(pagesDir, file),
          type: 'api',
          requiresAuth: true,
          expectedStatus: 401
        });
      } else {
        const isProtected = this.isProtectedRoute(routePath);
        const route = {
          url: routePath,
          title: this.generateRouteTitle(routePath),
          file: path.join(pagesDir, file),
          type: 'page'
        };
        
        if (isProtected) {
          routes.protected.push({
            ...route,
            requiresAuth: true,
            expectedRedirect: '/login'
          });
        } else {
          routes.public.push({
            ...route,
            expectedStatus: 200
          });
        }
      }
    }
  }

  convertAppRouterPathToUrl(filePath) {
    return '/' + filePath
      .replace(/\/(page|route)\.(js|jsx|ts|tsx)$/, '') // Remove page/route files
      .replace(/\(.*?\)/g, '') // Remove route groups like (auth)
      .replace(/\[\.\.\.(\w+)\]/g, '*') // Convert [...slug] to *
      .replace(/\[(\w+)\]/g, ':$1') // Convert [id] to :id
      .replace(/\/+/g, '/') // Clean up multiple slashes
      .replace(/\/$/, '') || '/'; // Remove trailing slash except for root
  }

  convertPagesRouterPathToUrl(filePath) {
    return '/' + filePath
      .replace(/\.(js|jsx|ts|tsx)$/, '') // Remove file extension
      .replace(/\/index$/, '') // Remove /index from the end
      .replace(/\[\.\.\.(\w+)\]/g, '*') // Convert [...slug] to *
      .replace(/\[(\w+)\]/g, ':$1') // Convert [id] to :id
      .replace(/\/+/g, '/') // Clean up multiple slashes
      .replace(/\/$/, '') || '/'; // Remove trailing slash except for root
  }

  isProtectedRoute(url) {
    const protectedPatterns = [
      '/dashboard', '/admin', '/profile', '/settings', '/account',
      '/user', '/management', '/private', '/secure', '/auth'
    ];
    
    return protectedPatterns.some(pattern =>
      url.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  generateRouteTitle(url) {
    if (url === '/') return 'Home Page';
    
    return url
      .split('/')
      .filter(Boolean)
      .map(segment => {
        // Handle dynamic segments
        if (segment.startsWith(':')) {
          return segment.substring(1).charAt(0).toUpperCase() + segment.substring(2);
        }
        return segment.charAt(0).toUpperCase() + segment.slice(1);
      })
      .join(' ') + ' Page';
  }

  async getNextConfig() {
    const configFiles = ['next.config.js', 'next.config.mjs'];
    
    for (const configFile of configFiles) {
      const configPath = path.join(this.projectPath, configFile);
      if (await fs.pathExists(configPath)) {
        try {
          // For now, just return that config exists
          // Could be enhanced to parse actual config values
          return { exists: true, file: configFile };
        } catch (error) {
          continue;
        }
      }
    }
    
    return { exists: false };
  }

  generateJenkinsConfig() {
    return {
      buildCommand: 'npm run build',
      testCommand: 'npm run test:routes',
      devCommand: 'npm run dev',
      port: 3000,
      environment: {
        NODE_ENV: 'test'
      }
    };
  }
}

export default NextjsFramework;
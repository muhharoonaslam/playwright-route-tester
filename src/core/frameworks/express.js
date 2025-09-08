import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class ExpressFramework {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  async detect() {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return false;
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (!deps.express) {
      return false;
    }
    
    return {
      name: 'express',
      version: deps.express,
      mainFile: this.findMainFile(packageJson)
    };
  }

  findMainFile(packageJson) {
    return packageJson.main || 'index.js';
  }

  async scanRoutes() {
    const routes = { public: [], protected: [], api: [] };
    
    // Find all JavaScript/TypeScript files that might contain routes
    const routeFiles = await glob('**/*.{js,ts}', {
      cwd: this.projectPath,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    });
    
    for (const file of routeFiles) {
      try {
        const filePath = path.join(this.projectPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        const extractedRoutes = this.extractExpressRoutes(content, file);
        
        for (const route of extractedRoutes) {
          this.categorizeExpressRoute(route, routes);
        }
        
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
    
    // If no routes found, add common defaults
    if (this.getTotalRoutes(routes) === 0) {
      this.addDefaultExpressRoutes(routes);
    }
    
    return routes;
  }

  extractExpressRoutes(content, filename) {
    const routes = [];
    
    // Express route patterns
    const routePatterns = [
      // app.get('/path', ...)
      /(?:app|router)\.(get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // router.method('/path', ...)
      /router\.(get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // express.Router() patterns
      /\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.(get|post|put|patch|delete)/g
    ];
    
    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const routePath = match[2] || match[1]; // Handle different capture groups
        
        // Skip middleware routes
        if (method === 'USE' && !routePath.startsWith('/api')) {
          continue;
        }
        
        routes.push({
          url: this.normalizeRoutePath(routePath),
          method: method === 'USE' ? 'GET' : method,
          title: this.generateRouteTitle(routePath),
          file: filename,
          framework: 'express'
        });
      }
    }
    
    return routes;
  }

  normalizeRoutePath(routePath) {
    // Convert Express route parameters to a standard format
    return routePath
      .replace(/:\w+/g, (match) => `:${match.substring(1)}`) // Ensure colon prefix
      .replace(/\*/, '*') // Handle wildcards
      .replace(/\/+/g, '/') // Clean up multiple slashes
      .replace(/\/$/, '') || '/'; // Remove trailing slash except for root
  }

  categorizeExpressRoute(route, routes) {
    const isApiRoute = route.url.startsWith('/api') || 
                      route.method !== 'GET' ||
                      this.isApiEndpoint(route.url);
    
    if (isApiRoute) {
      routes.api.push({
        ...route,
        requiresAuth: this.requiresAuthentication(route.url),
        expectedStatus: this.requiresAuthentication(route.url) ? 401 : 200
      });
    } else {
      const isProtected = this.isProtectedRoute(route.url);
      
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

  isApiEndpoint(url) {
    const apiPatterns = [
      '/api/', '/v1/', '/v2/', '/graphql', '/webhook',
      '/rest/', '/service/', '/data/'
    ];
    
    return apiPatterns.some(pattern => url.includes(pattern));
  }

  isProtectedRoute(url) {
    const protectedPatterns = [
      '/admin', '/dashboard', '/profile', '/settings', '/account',
      '/user', '/management', '/private', '/secure', '/auth'
    ];
    
    return protectedPatterns.some(pattern =>
      url.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  requiresAuthentication(url) {
    // Most API endpoints require authentication by default
    if (url.startsWith('/api')) {
      const publicApiPatterns = ['/api/health', '/api/status', '/api/public'];
      return !publicApiPatterns.some(pattern => url.includes(pattern));
    }
    
    return this.isProtectedRoute(url);
  }

  addDefaultExpressRoutes(routes) {
    // Default public routes
    routes.public.push(
      { url: '/', title: 'Home Page', method: 'GET', expectedStatus: 200 },
      { url: '/about', title: 'About Page', method: 'GET', expectedStatus: 200 },
      { url: '/contact', title: 'Contact Page', method: 'GET', expectedStatus: 200 }
    );
    
    // Default protected routes
    routes.protected.push(
      { url: '/dashboard', title: 'Dashboard', method: 'GET', requiresAuth: true, expectedRedirect: '/login' },
      { url: '/admin', title: 'Admin Panel', method: 'GET', requiresAuth: true, expectedRedirect: '/login' }
    );
    
    // Default API routes
    routes.api.push(
      { url: '/api/users', title: 'Users API', method: 'GET', requiresAuth: true, expectedStatus: 401 },
      { url: '/api/posts', title: 'Posts API', method: 'GET', requiresAuth: true, expectedStatus: 401 },
      { url: '/api/auth/login', title: 'Login API', method: 'POST', requiresAuth: false, expectedStatus: 200 }
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
      .join(' ');
  }

  getTotalRoutes(routes) {
    return routes.public.length + routes.protected.length + routes.api.length;
  }

  async findEntryPoint() {
    const commonEntryPoints = ['app.js', 'index.js', 'server.js', 'main.js'];
    
    for (const entry of commonEntryPoints) {
      const entryPath = path.join(this.projectPath, entry);
      if (await fs.pathExists(entryPath)) {
        return entry;
      }
    }
    
    return 'index.js'; // Default fallback
  }

  generateJenkinsConfig() {
    return {
      buildCommand: 'npm install',
      testCommand: 'npm run test:routes',
      devCommand: 'npm start',
      port: 3000,
      environment: {
        NODE_ENV: 'test'
      }
    };
  }
}

export default ExpressFramework;
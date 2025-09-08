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
    
    console.log(`🔍 Express - Extracting routes from: ${filename}`);
    
    // Enhanced Express route patterns with better matching
    const routePatterns = [
      // app.method('/path', ...) - handles app, server, router variables
      /(?:app|server|router|express)\s*\.\s*(get|post|put|patch|delete|use|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      // router.method('/path', ...)
      /(\w+)\s*\.\s*(get|post|put|patch|delete|use|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      // .route('/path').method(...)
      /\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.\s*(get|post|put|patch|delete|all)/gi,
      // Express router with chaining: router.route('/path').get().post()
      /route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
      // app.use('/path', router) - mount points
      /(?:app|server)\s*\.\s*use\s*\(\s*['"`]([^'"`]+)['"`]\s*,/gi
    ];
    
    const foundRoutes = new Set();
    
    for (const pattern of routePatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      while ((match = pattern.exec(content)) !== null) {
        let method, routePath;
        
        // Handle different capture group patterns
        if (match.length === 4) {
          // Pattern: variable.method('/path')
          method = match[2];
          routePath = match[3];
        } else if (match.length === 3) {
          // Pattern: app.method('/path') or route('/path').method
          if (match[2]) {
            method = match[2];
            routePath = match[1];
          } else {
            method = match[1];
            routePath = match[2];
          }
        }
        
        if (!routePath || !method) continue;
        
        method = method.toUpperCase();
        const normalizedPath = this.normalizeExpressRoutePath(routePath);
        
        // Skip invalid paths and middleware that doesn't define routes
        if (!normalizedPath || 
            (method === 'USE' && !routePath.startsWith('/api') && !routePath.includes('/'))) {
          continue;
        }
        
        const routeKey = `${method}:${normalizedPath}`;
        if (!foundRoutes.has(routeKey)) {
          foundRoutes.add(routeKey);
          console.log(`  ✅ Found route: ${method} ${normalizedPath}`);
          
          routes.push({
            url: normalizedPath,
            method: method === 'USE' ? 'GET' : method,
            title: this.generateRouteTitle(normalizedPath),
            file: filename,
            framework: 'express'
          });
        }
      }
    }
    
    console.log(`  → Total routes found: ${routes.length}`);
    return routes;
  }

  normalizeExpressRoutePath(routePath) {
    console.log(`  🔧 Normalizing Express route: "${routePath}"`);
    
    // Handle empty or invalid paths
    if (!routePath || typeof routePath !== 'string') {
      return null;
    }
    
    // Start with the original path
    let url = routePath;
    
    // Convert Express route parameters to standard format
    url = url.replace(/:\w+/g, (match) => `:${match.substring(1)}`); // Ensure colon prefix
    
    // Handle Express wildcards and regex patterns
    url = url.replace(/\*/, '*'); // Keep wildcards
    url = url.replace(/\$.*$/, ''); // Remove regex end anchors
    url = url.replace(/\^/, ''); // Remove regex start anchors
    
    // Clean up multiple slashes
    url = url.replace(/\/+/g, '/');
    
    // Add leading slash if missing
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    
    // Remove trailing slash except for root
    if (url !== '/' && url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    
    // Handle empty or root case
    if (!url || url === '//') {
      url = '/';
    }
    
    console.log(`    → Normalized to: "${url}"`);
    return url;
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
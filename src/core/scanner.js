import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class ProjectScanner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.packageJson = null;
    this.framework = null;
    this.routes = {
      public: [],
      protected: [],
      api: []
    };
  }

  async scan() {
    console.log('🔍 Scanning project for routes and configuration...');
    
    await this.loadPackageJson();
    await this.detectFramework();
    await this.scanRoutes();
    await this.detectAuthPatterns();
    
    return {
      framework: this.framework,
      routes: this.routes,
      config: await this.generateConfig()
    };
  }

  async loadPackageJson() {
    const packagePath = path.join(this.projectPath, 'package.json');
    if (await fs.pathExists(packagePath)) {
      this.packageJson = await fs.readJson(packagePath);
    }
  }

  async detectFramework() {
    if (!this.packageJson) {
      this.framework = { name: 'unknown', version: null };
      return;
    }

    const deps = { ...this.packageJson.dependencies, ...this.packageJson.devDependencies };
    
    // Next.js detection
    if (deps.next) {
      this.framework = { 
        name: 'nextjs', 
        version: deps.next,
        hasAppRouter: await this.hasNextAppRouter(),
        hasPagesRouter: await this.hasNextPagesRouter()
      };
      return;
    }
    
    // React Router detection
    if (deps['react-router-dom'] || deps['@reach/router']) {
      this.framework = { 
        name: 'react-router', 
        version: deps['react-router-dom'] || deps['@reach/router']
      };
      return;
    }
    
    // Vue Router detection
    if (deps['vue-router']) {
      this.framework = { name: 'vue-router', version: deps['vue-router'] };
      return;
    }
    
    // Express detection
    if (deps.express) {
      this.framework = { name: 'express', version: deps.express };
      return;
    }
    
    // Nuxt detection
    if (deps.nuxt || deps['@nuxt/core']) {
      this.framework = { name: 'nuxt', version: deps.nuxt || deps['@nuxt/core'] };
      return;
    }
    
    // Generic React/Vue detection
    if (deps.react) {
      this.framework = { name: 'react', version: deps.react };
    } else if (deps.vue) {
      this.framework = { name: 'vue', version: deps.vue };
    } else {
      this.framework = { name: 'unknown', version: null };
    }
  }

  async hasNextAppRouter() {
    return await fs.pathExists(path.join(this.projectPath, 'app'));
  }

  async hasNextPagesRouter() {
    return await fs.pathExists(path.join(this.projectPath, 'pages'));
  }

  async scanRoutes() {
    switch (this.framework.name) {
      case 'nextjs':
        await this.scanNextjsRoutes();
        break;
      case 'react-router':
        await this.scanReactRouterRoutes();
        break;
      case 'vue-router':
        await this.scanVueRouterRoutes();
        break;
      case 'express':
        await this.scanExpressRoutes();
        break;
      case 'nuxt':
        await this.scanNuxtRoutes();
        break;
      default:
        await this.scanGenericRoutes();
        break;
    }
  }

  async scanNextjsRoutes() {
    const routes = [];
    
    // App Router (Next.js 13+)
    if (this.framework.hasAppRouter) {
      const appDir = path.join(this.projectPath, 'app');
      const pageFiles = await glob('**/page.{js,jsx,ts,tsx}', { cwd: appDir });
      
      for (const file of pageFiles) {
        const routePath = this.convertAppRouterPathToUrl(file);
        const isApiRoute = file.includes('/api/');
        
        if (isApiRoute) {
          this.routes.api.push({
            url: routePath,
            title: this.generateRouteTitle(routePath),
            method: 'GET',
            file: path.join(appDir, file)
          });
        } else {
          routes.push({
            url: routePath,
            title: this.generateRouteTitle(routePath),
            file: path.join(appDir, file)
          });
        }
      }
    }
    
    // Pages Router (Classic Next.js)
    if (this.framework.hasPagesRouter) {
      const pagesDir = path.join(this.projectPath, 'pages');
      if (await fs.pathExists(pagesDir)) {
        const pageFiles = await glob('**/*.{js,jsx,ts,tsx}', { 
          cwd: pagesDir,
          ignore: ['_app.*', '_document.*', '_error.*', '404.*', '500.*']
        });
        
        for (const file of pageFiles) {
          const routePath = this.convertPagesRouterPathToUrl(file);
          const isApiRoute = file.startsWith('api/');
          
          if (isApiRoute) {
            this.routes.api.push({
              url: routePath,
              title: this.generateRouteTitle(routePath),
              method: 'GET',
              file: path.join(pagesDir, file)
            });
          } else {
            routes.push({
              url: routePath,
              title: this.generateRouteTitle(routePath),
              file: path.join(pagesDir, file)
            });
          }
        }
      }
    }
    
    // Categorize routes as public or protected
    await this.categorizeRoutes(routes);
  }

  async scanReactRouterRoutes() {
    // Scan for React Router routes in common patterns
    const routeFiles = await glob('**/*.{js,jsx,ts,tsx}', {
      cwd: path.join(this.projectPath, 'src'),
      ignore: ['**/*.test.*', '**/*.spec.*']
    });
    
    const routes = [];
    
    for (const file of routeFiles) {
      const content = await fs.readFile(path.join(this.projectPath, 'src', file), 'utf8');
      const routePaths = this.extractReactRouterPaths(content);
      
      for (const routePath of routePaths) {
        routes.push({
          url: routePath,
          title: this.generateRouteTitle(routePath),
          file: path.join('src', file)
        });
      }
    }
    
    await this.categorizeRoutes(routes);
  }

  async scanExpressRoutes() {
    const routeFiles = await glob('**/*.{js,ts}', {
      cwd: this.projectPath,
      ignore: ['node_modules/**', 'dist/**', '**/*.test.*', '**/*.spec.*']
    });
    
    const routes = [];
    
    for (const file of routeFiles) {
      const content = await fs.readFile(path.join(this.projectPath, file), 'utf8');
      const routePaths = this.extractExpressRoutes(content);
      
      for (const route of routePaths) {
        if (route.url.startsWith('/api')) {
          this.routes.api.push(route);
        } else {
          routes.push(route);
        }
      }
    }
    
    await this.categorizeRoutes(routes);
  }

  async scanGenericRoutes() {
    // Fallback: provide common default routes
    const commonRoutes = [
      { url: '/', title: 'Home Page' },
      { url: '/about', title: 'About Page' },
      { url: '/contact', title: 'Contact Page' },
    ];
    
    const commonProtectedRoutes = [
      { url: '/dashboard', title: 'Dashboard' },
      { url: '/profile', title: 'User Profile' },
      { url: '/settings', title: 'Settings' }
    ];
    
    const commonApiRoutes = [
      { url: '/api/users', title: 'Users API', method: 'GET' },
      { url: '/api/products', title: 'Products API', method: 'GET' }
    ];
    
    this.routes.public = commonRoutes;
    this.routes.protected = commonProtectedRoutes;
    this.routes.api = commonApiRoutes;
  }

  async categorizeRoutes(routes) {
    for (const route of routes) {
      const isProtected = await this.isProtectedRoute(route);
      
      if (isProtected) {
        this.routes.protected.push({
          ...route,
          requiresAuth: true,
          expectedRedirect: await this.detectLoginUrl()
        });
      } else {
        this.routes.public.push({
          ...route,
          expectedStatus: 200
        });
      }
    }
  }

  async isProtectedRoute(route) {
    // Common protected route patterns
    const protectedPatterns = [
      '/dashboard', '/admin', '/profile', '/settings', '/account',
      '/user', '/management', '/private', '/secure'
    ];
    
    return protectedPatterns.some(pattern => 
      route.url.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async detectLoginUrl() {
    // Common login URL patterns
    const commonLoginUrls = ['/login', '/signin', '/auth', '/authenticate'];
    
    // Try to detect from routes
    for (const routes of [this.routes.public, this.routes.protected]) {
      for (const route of routes) {
        if (commonLoginUrls.some(login => route.url.includes(login))) {
          return route.url;
        }
      }
    }
    
    return '/login'; // Default fallback
  }

  async detectAuthPatterns() {
    // Scan for authentication middleware or components
    const authFiles = await glob('**/*.{js,jsx,ts,tsx}', {
      cwd: path.join(this.projectPath, 'src'),
      ignore: ['**/*.test.*', '**/*.spec.*', 'node_modules/**']
    }).catch(() => []);
    
    for (const file of authFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectPath, 'src', file), 'utf8');
        
        // Look for auth-related patterns
        if (this.hasAuthPatterns(content)) {
          // Update protected routes based on found patterns
          break;
        }
      } catch (error) {
        // Continue if file can't be read
      }
    }
  }

  hasAuthPatterns(content) {
    const authPatterns = [
      'useAuth', 'AuthProvider', 'withAuth', 'requireAuth',
      'isAuthenticated', 'checkAuth', 'login', 'logout',
      'jwt', 'token', 'session'
    ];
    
    return authPatterns.some(pattern => 
      content.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  convertAppRouterPathToUrl(filePath) {
    return '/' + filePath
      .replace(/\/page\.(js|jsx|ts|tsx)$/, '')
      .replace(/\(.*?\)/g, '') // Remove route groups
      .replace(/\[\.\.\.(\w+)\]/g, '*') // Convert catch-all routes
      .replace(/\[(\w+)\]/g, ':$1'); // Convert dynamic routes
  }

  convertPagesRouterPathToUrl(filePath) {
    return '/' + filePath
      .replace(/\.(js|jsx|ts|tsx)$/, '')
      .replace(/\/index$/, '')
      .replace(/\[\.\.\.(\w+)\]/g, '*')
      .replace(/\[(\w+)\]/g, ':$1');
  }

  extractReactRouterPaths(content) {
    const routes = [];
    const routeRegex = /<Route[^>]*path=["']([^"']+)["']/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      routes.push(match[1]);
    }
    
    return routes;
  }

  extractExpressRoutes(content) {
    const routes = [];
    const routeRegex = /\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      routes.push({
        url: match[2],
        method: match[1].toUpperCase(),
        title: this.generateRouteTitle(match[2])
      });
    }
    
    return routes;
  }

  generateRouteTitle(url) {
    return url
      .split('/')
      .filter(Boolean)
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ') || 'Home Page';
  }

  async generateConfig() {
    const baseUrl = await this.detectBaseUrl();
    const loginUrl = await this.detectLoginUrl();
    
    return {
      baseURL: baseUrl,
      loginURL: loginUrl,
      framework: this.framework,
      timeout: 30000,
      projectPath: this.projectPath
    };
  }

  async detectBaseUrl() {
    // Check for common dev server configurations
    if (this.packageJson && this.packageJson.scripts) {
      const devScript = this.packageJson.scripts.dev || this.packageJson.scripts.start;
      
      if (devScript && devScript.includes('3000')) {
        return 'http://localhost:3000';
      }
      if (devScript && devScript.includes('8080')) {
        return 'http://localhost:8080';
      }
      if (devScript && devScript.includes('5173')) {
        return 'http://localhost:5173'; // Vite default
      }
    }
    
    return 'http://localhost:3000'; // Default fallback
  }
}

export default ProjectScanner;
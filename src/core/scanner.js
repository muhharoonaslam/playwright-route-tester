import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import NextjsFramework from './frameworks/nextjs.js';
import ReactFramework from './frameworks/react.js';
import ExpressFramework from './frameworks/express.js';

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
    console.log('🔍 Detecting project framework...');
    
    if (!this.packageJson) {
      console.log('📄 No package.json found - checking for static files...');
      this.framework = await this.detectStaticFramework();
      return;
    }

    const deps = { ...this.packageJson.dependencies, ...this.packageJson.devDependencies };
    console.log(`📦 Found dependencies:`, Object.keys(deps).slice(0, 10).join(', '));
    
    // Next.js detection (priority framework)
    if (deps.next) {
      this.framework = { 
        name: 'nextjs', 
        version: deps.next,
        hasAppRouter: await this.hasNextAppRouter(),
        hasPagesRouter: await this.hasNextPagesRouter()
      };
      console.log(`✅ Detected Next.js ${deps.next} (App Router: ${this.framework.hasAppRouter}, Pages: ${this.framework.hasPagesRouter})`);
      return;
    }
    
    // React Router detection
    if (deps['react-router-dom'] || deps['@reach/router']) {
      this.framework = { 
        name: 'react-router', 
        version: deps['react-router-dom'] || deps['@reach/router'],
        hasReactRouter: !!deps['react-router-dom'],
        hasReachRouter: !!deps['@reach/router']
      };
      console.log(`✅ Detected React Router ${this.framework.version}`);
      return;
    }
    
    // Vue Router detection
    if (deps['vue-router']) {
      this.framework = { name: 'vue-router', version: deps['vue-router'] };
      console.log(`✅ Detected Vue Router ${deps['vue-router']}`);
      return;
    }
    
    // Express detection
    if (deps.express) {
      this.framework = { name: 'express', version: deps.express };
      console.log(`✅ Detected Express ${deps.express}`);
      return;
    }
    
    // Nuxt detection
    if (deps.nuxt || deps['@nuxt/core'] || deps['@nuxt/kit']) {
      this.framework = { name: 'nuxt', version: deps.nuxt || deps['@nuxt/core'] || deps['@nuxt/kit'] };
      console.log(`✅ Detected Nuxt ${this.framework.version}`);
      return;
    }
    
    // Vite + React detection
    if (deps.vite && deps.react) {
      this.framework = { name: 'vite-react', version: deps.vite, reactVersion: deps.react };
      console.log(`✅ Detected Vite + React project`);
      return;
    }
    
    // Create React App detection
    if (deps['react-scripts'] || this.packageJson.scripts?.start?.includes('react-scripts')) {
      this.framework = { name: 'create-react-app', version: deps['react-scripts'] || deps.react };
      console.log(`✅ Detected Create React App`);
      return;
    }
    
    // Generic React/Vue detection
    if (deps.react) {
      this.framework = { name: 'react', version: deps.react };
      console.log(`✅ Detected React ${deps.react} (generic)`);
    } else if (deps.vue) {
      this.framework = { name: 'vue', version: deps.vue };
      console.log(`✅ Detected Vue ${deps.vue} (generic)`);
    } else {
      console.log('⚠️ Framework detection failed - using generic detection');
      this.framework = await this.detectStaticFramework();
    }
  }
  
  async detectStaticFramework() {
    // Try to detect from file structure when no package.json
    const hasIndex = await fs.pathExists(path.join(this.projectPath, 'index.html'));
    const hasPublic = await fs.pathExists(path.join(this.projectPath, 'public'));
    const hasSrc = await fs.pathExists(path.join(this.projectPath, 'src'));
    
    if (hasIndex || hasPublic || hasSrc) {
      return { name: 'static-site', version: null, hasStaticFiles: true };
    }
    
    return { name: 'unknown', version: null };
  }

  async hasNextAppRouter() {
    return await fs.pathExists(path.join(this.projectPath, 'app'));
  }

  async hasNextPagesRouter() {
    return await fs.pathExists(path.join(this.projectPath, 'pages'));
  }

  async scanRoutes() {
    console.log(`📁 Scanning routes for framework: ${this.framework.name}`);
    
    let frameworkInstance = null;
    
    switch (this.framework.name) {
      case 'nextjs':
        frameworkInstance = new NextjsFramework(this.projectPath);
        await frameworkInstance.detect();
        this.routes = await frameworkInstance.scanRoutes();
        break;
        
      case 'react':
      case 'react-router':
        frameworkInstance = new ReactFramework(this.projectPath);
        frameworkInstance.routerType = this.framework.name === 'react-router' ? 'react-router-dom' : null;
        await frameworkInstance.detect();
        this.routes = await frameworkInstance.scanRoutes();
        break;
        
      case 'express':
        frameworkInstance = new ExpressFramework(this.projectPath);
        await frameworkInstance.detect();
        this.routes = await frameworkInstance.scanRoutes();
        break;
        
      case 'vue-router':
      case 'nuxt':
        // For now, use generic scanning until Vue framework is implemented
        await this.scanGenericRoutes();
        break;
        
      default:
        await this.scanGenericRoutes();
        break;
    }
    
    console.log(`✅ Found ${this.routes.public.length} public, ${this.routes.protected.length} protected, ${this.routes.api.length} API routes`);
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
    console.log('⚠️ Framework not detected - performing generic file-based route scanning...');
    
    // Try to find routes by scanning common file patterns
    const routes = [];
    
    try {
      // Scan for HTML files
      const htmlFiles = await glob('**/*.html', { 
        cwd: this.projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**']
      });
      
      for (const file of htmlFiles) {
        const routePath = '/' + file.replace(/\.html$/, '').replace(/\/index$/, '');
        routes.push({
          url: routePath === '' ? '/' : routePath,
          title: this.generateRouteTitle(routePath || '/'),
          file: file,
          type: 'static'
        });
      }
      
      // Scan for common page component patterns
      const componentFiles = await glob('**/pages/**/*.{js,jsx,ts,tsx}', {
        cwd: this.projectPath,
        ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*']
      });
      
      for (const file of componentFiles) {
        const routePath = '/' + file
          .replace(/^.*\/pages\//, '')
          .replace(/\.(js|jsx|ts|tsx)$/, '')
          .replace(/\/index$/, '');
        
        routes.push({
          url: routePath === '' ? '/' : routePath,
          title: this.generateRouteTitle(routePath || '/'),
          file: file,
          type: 'component'
        });
      }
      
      // If no routes found, provide minimal sensible defaults
      if (routes.length === 0) {
        console.log('📝 No routes detected - adding basic home page route');
        routes.push({ 
          url: '/', 
          title: 'Home Page', 
          type: 'default',
          note: 'Add more routes manually in the route files' 
        });
      }
      
    } catch (error) {
      console.warn('Warning: Error during generic route scanning:', error.message);
      // Minimal fallback
      routes.push({ 
        url: '/', 
        title: 'Home Page', 
        type: 'fallback',
        note: 'Configure routes manually in the generated route files'
      });
    }
    
    // Categorize the found routes
    await this.categorizeRoutes(routes);
    
    // Only add API routes if we found evidence of API endpoints
    const hasApiIndicators = await this.hasApiDirectory();
    if (hasApiIndicators) {
      this.routes.api.push({
        url: '/api/health',
        title: 'Health Check',
        method: 'GET',
        type: 'detected',
        note: 'Update with your actual API endpoints'
      });
    }
  }
  
  async hasApiDirectory() {
    const apiPaths = ['api/', 'pages/api/', 'app/api/', 'src/api/', 'routes/api/'];
    for (const apiPath of apiPaths) {
      if (await fs.pathExists(path.join(this.projectPath, apiPath))) {
        return true;
      }
    }
    return false;
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
    // Normalize Windows path separators to forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    let url = '/' + normalizedPath
      .replace(/\/page\.(js|jsx|ts|tsx)$/, '') // Remove page.tsx/jsx/js
      .replace(/\(.*?\)/g, '') // Remove route groups like (dashboard)
      .replace(/\[\.\.\.(\w+)\]/g, '*') // Convert [...slug] to *
      .replace(/\[(\w+)\]/g, ':$1'); // Convert [id] to :id
    
    // Clean up double slashes and trailing slashes
    url = url.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    
    return url;
  }

  convertPagesRouterPathToUrl(filePath) {
    // Normalize Windows path separators to forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    let url = '/' + normalizedPath
      .replace(/\.(js|jsx|ts|tsx)$/, '') // Remove file extensions
      .replace(/\/index$/, '') // Remove index from path
      .replace(/\[\.\.\.(\w+)\]/g, '*') // Convert [...slug] to *
      .replace(/\[(\w+)\]/g, ':$1'); // Convert [id] to :id
    
    // Clean up double slashes and trailing slashes
    url = url.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    
    return url;
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
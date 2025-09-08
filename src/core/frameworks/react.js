import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class ReactFramework {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.routerType = null; // 'react-router', 'reach-router', or null
  }

  async detect() {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return false;
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (!deps.react) {
      return false;
    }
    
    // Determine router type
    if (deps['react-router-dom']) {
      this.routerType = 'react-router-dom';
    } else if (deps['@reach/router']) {
      this.routerType = 'reach-router';
    }
    
    return {
      name: 'react',
      version: deps.react,
      routerType: this.routerType,
      routerVersion: deps['react-router-dom'] || deps['@reach/router'] || null
    };
  }

  async scanRoutes() {
    const routes = { public: [], protected: [], api: [] };
    
    if (this.routerType) {
      await this.scanRouterRoutes(routes);
    } else {
      // Fallback to common React patterns
      await this.scanGenericReactRoutes(routes);
    }
    
    return routes;
  }

  async scanRouterRoutes(routes) {
    const srcDir = path.join(this.projectPath, 'src');
    
    if (!await fs.pathExists(srcDir)) {
      return;
    }
    
    // Find all potential route files
    const routeFiles = await glob('**/*.{js,jsx,ts,tsx}', {
      cwd: srcDir,
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
    });
    
    const foundRoutes = new Set();
    
    for (const file of routeFiles) {
      try {
        const filePath = path.join(srcDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Extract routes from file content
        const extractedRoutes = this.extractRoutesFromFile(content, file);
        
        extractedRoutes.forEach(route => {
          if (!foundRoutes.has(route.url)) {
            foundRoutes.add(route.url);
            this.categorizeRoute(route, routes);
          }
        });
        
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
    
    // If no routes found, add common defaults
    if (foundRoutes.size === 0) {
      this.addDefaultRoutes(routes);
    }
  }

  async scanGenericReactRoutes(routes) {
    // For React projects without router, provide sensible defaults
    this.addDefaultRoutes(routes);
  }

  extractRoutesFromFile(content, filename) {
    const routes = [];
    
    // React Router patterns
    const routePatterns = [
      // <Route path="/path" ... />
      /<Route[^>]*path=["']([^"']+)["'][^>]*>/g,
      // <Route path="/path">
      /<Route[^>]*path=["']([^"']+)["'][^>]*>/g,
      // Route object: { path: "/path" }
      /{\s*path:\s*["']([^"']+)["']/g,
      // createBrowserRouter paths
      /path:\s*["']([^"']+)["']/g
    ];
    
    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const routePath = match[1];
        
        routes.push({
          url: routePath,
          title: this.generateRouteTitle(routePath),
          file: filename,
          component: this.extractComponentName(content, routePath)
        });
      }
    }
    
    return routes;
  }

  extractComponentName(content, routePath) {
    // Try to find the component associated with this route
    const componentPatterns = [
      new RegExp(`path=["']${routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*component={([^}]+)}`, 'i'),
      new RegExp(`path=["']${routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*element={<([^\\s>]+)`, 'i')
    ];
    
    for (const pattern of componentPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  categorizeRoute(route, routes) {
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

  isProtectedRoute(url) {
    const protectedPatterns = [
      '/dashboard', '/admin', '/profile', '/settings', '/account',
      '/user', '/management', '/private', '/secure', '/protected'
    ];
    
    return protectedPatterns.some(pattern =>
      url.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  addDefaultRoutes(routes) {
    // Default public routes
    routes.public.push(
      { url: '/', title: 'Home Page', expectedStatus: 200 },
      { url: '/about', title: 'About Page', expectedStatus: 200 },
      { url: '/contact', title: 'Contact Page', expectedStatus: 200 }
    );
    
    // Default protected routes
    routes.protected.push(
      { url: '/dashboard', title: 'Dashboard', requiresAuth: true, expectedRedirect: '/login' },
      { url: '/profile', title: 'Profile Page', requiresAuth: true, expectedRedirect: '/login' },
      { url: '/settings', title: 'Settings Page', requiresAuth: true, expectedRedirect: '/login' }
    );
    
    // Default API routes (common in React apps with backends)
    routes.api.push(
      { url: '/api/users', title: 'Users API', method: 'GET', requiresAuth: true, expectedStatus: 401 },
      { url: '/api/products', title: 'Products API', method: 'GET', requiresAuth: true, expectedStatus: 401 }
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

  async detectBuildTool() {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    if (packageJson.dependencies?.['react-scripts']) {
      return 'create-react-app';
    }
    
    if (packageJson.devDependencies?.vite) {
      return 'vite';
    }
    
    if (packageJson.devDependencies?.webpack) {
      return 'webpack';
    }
    
    return 'unknown';
  }

  generateJenkinsConfig() {
    return {
      buildCommand: 'npm run build',
      testCommand: 'npm run test:routes',
      devCommand: 'npm start',
      port: 3000,
      environment: {
        NODE_ENV: 'test',
        CI: 'true'
      }
    };
  }
}

export default ReactFramework;
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class ShopifyFramework {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.routes = {
      public: [],
      protected: [],
      api: []
    };
  }

  async detect() {
    console.log('🛍️ Detecting Shopify app structure...');
    
    // Check if it's a Remix-based Shopify app
    const hasRemixConfig = await fs.pathExists(path.join(this.projectPath, 'remix.config.js'));
    const hasAppDir = await fs.pathExists(path.join(this.projectPath, 'app'));
    
    this.isRemixBased = hasRemixConfig && hasAppDir;
    console.log(`📦 Shopify app type: ${this.isRemixBased ? 'Remix-based' : 'Traditional'}`);
    
    return true;
  }

  async scanRoutes() {
    console.log('🔍 Scanning Shopify app routes...');

    if (this.isRemixBased) {
      await this.scanRemixShopifyRoutes();
    } else {
      await this.scanTraditionalShopifyRoutes();
    }

    // Add common Shopify webhooks as API routes
    await this.addShopifyWebhooks();
    
    // Categorize routes
    await this.categorizeShopifyRoutes();

    console.log(`📊 Found ${this.routes.public.length} public, ${this.routes.protected.length} protected, ${this.routes.api.length} API routes`);
    
    return this.routes;
  }

  async scanRemixShopifyRoutes() {
    console.log('📁 Scanning Remix-based Shopify app routes...');
    
    const appDir = path.join(this.projectPath, 'app');
    const routesDir = path.join(appDir, 'routes');
    
    if (await fs.pathExists(routesDir)) {
      // Scan for Remix route files
      const routeFiles = await glob('**/*.{js,jsx,ts,tsx}', { 
        cwd: routesDir,
        ignore: ['**/*.test.*', '**/*.spec.*']
      });

      for (const file of routeFiles) {
        const routePath = this.convertRemixRouteToUrl(file);
        const isAppRoute = file.startsWith('app.');
        const isWebhook = file.includes('webhooks');
        const isApi = file.includes('api') || isWebhook;
        
        const route = {
          url: routePath,
          title: this.generateShopifyRouteTitle(routePath),
          file: path.join(routesDir, file),
          type: isAppRoute ? 'shopify-app' : (isApi ? 'api' : 'page'),
          framework: 'shopify-remix'
        };

        if (isApi || isWebhook) {
          this.routes.api.push({
            ...route,
            method: isWebhook ? 'POST' : 'GET',
            requiresAuth: true,
            expectedStatus: isWebhook ? 200 : 401
          });
        } else if (isAppRoute) {
          this.routes.protected.push({
            ...route,
            requiresAuth: true,
            expectedRedirect: '/auth'
          });
        } else {
          this.routes.public.push(route);
        }
      }
    }
  }

  async scanTraditionalShopifyRoutes() {
    console.log('📁 Scanning traditional Shopify app routes...');
    
    // Check for frontend routes
    const frontendDir = path.join(this.projectPath, 'web', 'frontend');
    if (await fs.pathExists(frontendDir)) {
      await this.scanFrontendRoutes(frontendDir);
    }

    // Check for backend routes  
    const backendDir = path.join(this.projectPath, 'web', 'backend');
    if (await fs.pathExists(backendDir)) {
      await this.scanBackendRoutes(backendDir);
    }
  }

  async scanFrontendRoutes(frontendDir) {
    // Look for React Router routes in frontend
    const routeFiles = await glob('**/App.{js,jsx,ts,tsx}', { cwd: frontendDir });
    
    for (const file of routeFiles) {
      const filePath = path.join(frontendDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const routes = this.extractReactRouterRoutes(content);
        
        for (const route of routes) {
          this.routes.public.push({
            url: route,
            title: this.generateShopifyRouteTitle(route),
            file: filePath,
            type: 'frontend',
            framework: 'shopify-react'
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${file}:`, error.message);
      }
    }
  }

  async scanBackendRoutes(backendDir) {
    // Look for Express routes in backend
    const routeFiles = await glob('**/routes/**/*.{js,ts}', { cwd: backendDir });
    
    for (const file of routeFiles) {
      const filePath = path.join(backendDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const routes = this.extractExpressRoutes(content);
        
        for (const route of routes) {
          this.routes.api.push({
            ...route,
            file: filePath,
            framework: 'shopify-express',
            requiresAuth: true,
            expectedStatus: 401
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${file}:`, error.message);
      }
    }
  }

  async addShopifyWebhooks() {
    console.log('🔗 Adding common Shopify webhooks...');
    
    const commonWebhooks = [
      { url: '/webhooks/orders/create', title: 'Order Created Webhook', method: 'POST' },
      { url: '/webhooks/orders/paid', title: 'Order Paid Webhook', method: 'POST' },
      { url: '/webhooks/orders/cancelled', title: 'Order Cancelled Webhook', method: 'POST' },
      { url: '/webhooks/orders/fulfilled', title: 'Order Fulfilled Webhook', method: 'POST' },
      { url: '/webhooks/app/uninstalled', title: 'App Uninstalled Webhook', method: 'POST' },
      { url: '/webhooks/customers/create', title: 'Customer Created Webhook', method: 'POST' },
      { url: '/webhooks/products/create', title: 'Product Created Webhook', method: 'POST' },
      { url: '/webhooks/products/update', title: 'Product Updated Webhook', method: 'POST' }
    ];

    for (const webhook of commonWebhooks) {
      // Only add if not already detected
      const exists = this.routes.api.some(route => route.url === webhook.url);
      if (!exists) {
        this.routes.api.push({
          ...webhook,
          type: 'webhook',
          framework: 'shopify-webhook',
          requiresAuth: true,
          expectedStatus: 200,
          note: 'Common Shopify webhook - update if not used'
        });
      }
    }
  }

  async categorizeShopifyRoutes() {
    // Additional categorization for Shopify-specific patterns
    const protectedPatterns = [
      '/app', '/admin', '/dashboard', '/settings', 
      '/billing', '/subscription', '/install'
    ];

    // Re-categorize any routes that might have been missed
    const allRoutes = [...this.routes.public];
    this.routes.public = [];

    for (const route of allRoutes) {
      const isProtected = protectedPatterns.some(pattern => 
        route.url.startsWith(pattern)
      );

      if (isProtected) {
        this.routes.protected.push({
          ...route,
          requiresAuth: true,
          expectedRedirect: '/auth'
        });
      } else {
        this.routes.public.push(route);
      }
    }
  }

  convertRemixRouteToUrl(filePath) {
    // Convert Remix file-based routing to URLs
    let url = filePath
      .replace(/\.(js|jsx|ts|tsx)$/, '') // Remove extensions
      .replace(/\._index$/, '') // Handle _index files
      .replace(/\./g, '/') // Convert dots to slashes
      .replace(/\$([^/]+)/g, ':$1') // Convert $param to :param
      .replace(/_/g, '') // Remove underscores from route segments
      .replace(/\/+/g, '/'); // Clean up multiple slashes

    // Handle special Shopify app routes
    if (url.startsWith('app/')) {
      url = '/' + url;
    } else if (!url.startsWith('/')) {
      url = '/' + url;
    }

    // Clean up and ensure proper format
    url = url.replace(/\/$/, '') || '/';
    
    return url;
  }

  extractReactRouterRoutes(content) {
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
    const routeRegex = /(app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      routes.push({
        url: match[3],
        method: match[2].toUpperCase(),
        title: this.generateShopifyRouteTitle(match[3])
      });
    }

    return routes;
  }

  generateShopifyRouteTitle(url) {
    if (url === '/') return 'Home Page';
    
    // Handle Shopify-specific routes
    if (url.startsWith('/app/')) {
      const appRoute = url.replace('/app/', '').replace(/[/:]/g, ' ');
      return appRoute.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' App Page';
    }
    
    if (url.startsWith('/webhooks/')) {
      const webhook = url.replace('/webhooks/', '').replace(/[/:]/g, ' ');
      return webhook.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' Webhook';
    }
    
    // Standard title generation
    return url.split('/')
      .filter(Boolean)
      .map(segment => {
        if (segment.startsWith(':')) {
          return segment.substring(1).charAt(0).toUpperCase() + segment.substring(2);
        }
        return segment.charAt(0).toUpperCase() + segment.slice(1);
      })
      .join(' ') + ' Page';
  }
}

export default ShopifyFramework;
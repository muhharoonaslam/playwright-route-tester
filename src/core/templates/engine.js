import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TemplateEngine {
  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
    this.templatesCache = new Map();
  }

  registerHelpers() {
    // Helper for conditional rendering based on framework
    this.handlebars.registerHelper('ifFramework', function(framework, options) {
      if (this.framework?.name === framework) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Helper for checking if feature is enabled
    this.handlebars.registerHelper('ifFeature', function(feature, options) {
      if (this.features && this.features[feature]) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Helper for rendering routes
    this.handlebars.registerHelper('eachRoute', function(routes, options) {
      if (!routes || routes.length === 0) return '';
      return routes.map(route => options.fn(route)).join('\n');
    });

    // Helper for JSON stringification with proper formatting
    this.handlebars.registerHelper('json', function(obj, indent = 2) {
      return JSON.stringify(obj, null, indent);
    });

    // Helper for route method handling
    this.handlebars.registerHelper('httpMethod', function(method) {
      return method ? method.toUpperCase() : 'GET';
    });

    // Helper for generating test descriptions
    this.handlebars.registerHelper('testDescription', function(route, type) {
      const baseDesc = route.title || route.url;
      switch(type) {
        case 'public':
          return `${baseDesc} should be accessible without authentication`;
        case 'protected':
          return `${baseDesc} should redirect to login when not authenticated`;
        case 'api':
          return `${baseDesc} should return 401 when not authenticated`;
        default:
          return baseDesc;
      }
    });

    // Helper for conditional script inclusion
    this.handlebars.registerHelper('includeScript', function(scriptName, options) {
      const scripts = this.packageJsonScripts || {};
      if (scripts[scriptName]) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }

  async loadTemplate(templateName) {
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName);
    }

    const templatePath = path.join(__dirname, '../../../templates/unified', `${templateName}.hbs`);
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found: ${templateName} at ${templatePath}`);
    }

    const templateSource = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = this.handlebars.compile(templateSource);
    
    this.templatesCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  async renderTemplate(templateName, context) {
    try {
      const template = await this.loadTemplate(templateName);
      return template(context);
    } catch (error) {
      throw new Error(`Failed to render template '${templateName}': ${error.message}`);
    }
  }

  async generateProject(config, targetDir) {
    const {
      framework,
      routes,
      features = {},
      baseURL,
      loginURL,
      bare = false
    } = config;

    // Create directory structure
    await fs.ensureDir(targetDir);
    await fs.ensureDir(path.join(targetDir, 'config'));
    await fs.ensureDir(path.join(targetDir, 'helpers'));
    await fs.ensureDir(path.join(targetDir, 'routes'));
    await fs.ensureDir(path.join(targetDir, 'tests'));

    // Template context
    const context = {
      framework,
      routes,
      features,
      baseURL,
      loginURL,
      bare,
      packageJsonScripts: await this.getPackageJsonScripts(config.projectPath),
      generatedAt: new Date().toISOString(),
      version: await this.getPackageVersion()
    };

    // Generate all files
    const filesToGenerate = [
      { template: 'playwright.config', output: 'playwright.config.js' },
      { template: 'test-config', output: 'config/test-config.js' },
      { template: 'redirect-helper', output: 'helpers/redirect-helper.js' },
      { template: 'package', output: 'package.json' },
    ];

    // Add route files
    if (routes.public?.length > 0) {
      filesToGenerate.push({ template: 'routes.public', output: 'routes/public-routes.js' });
    }
    if (routes.protected?.length > 0) {
      filesToGenerate.push({ template: 'routes.protected', output: 'routes/protected-routes.js' });
    }
    if (routes.api?.length > 0) {
      filesToGenerate.push({ template: 'routes.api', output: 'routes/api-routes.js' });
    }

    // Add test files
    if (routes.public?.length > 0) {
      filesToGenerate.push({ template: 'tests.public', output: 'tests/public-routes.spec.js' });
    }
    if (routes.protected?.length > 0) {
      filesToGenerate.push({ template: 'tests.protected', output: 'tests/auth-redirect.spec.js' });
    }
    if (routes.api?.length > 0) {
      filesToGenerate.push({ template: 'tests.api', output: 'tests/api-routes.spec.js' });
    }

    // Generate all files
    for (const file of filesToGenerate) {
      try {
        const content = await this.renderTemplate(file.template, context);
        const outputPath = path.join(targetDir, file.output);
        await fs.writeFile(outputPath, content);
      } catch (error) {
        console.warn(`Warning: Could not generate ${file.output}: ${error.message}`);
      }
    }

    return {
      success: true,
      generatedFiles: filesToGenerate.map(f => f.output),
      context
    };
  }

  async generateJenkinsConfig(config) {
    const context = {
      ...config,
      generatedAt: new Date().toISOString(),
      version: await this.getPackageVersion()
    };

    try {
      return await this.renderTemplate('jenkins.pipeline', context);
    } catch (error) {
      throw new Error(`Failed to generate Jenkins config: ${error.message}`);
    }
  }

  async getPackageJsonScripts(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath || process.cwd(), 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      return packageJson.scripts || {};
    } catch (error) {
      return {};
    }
  }

  async getPackageVersion() {
    try {
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      return packageJson.version;
    } catch (error) {
      return '1.0.0';
    }
  }

  // Clear template cache (useful for development)
  clearCache() {
    this.templatesCache.clear();
  }

  // Precompile all templates (useful for production builds)
  async precompileTemplates() {
    const templatesDir = path.join(__dirname, '../../../templates/unified');
    
    if (!await fs.pathExists(templatesDir)) {
      return;
    }

    const templateFiles = await fs.readdir(templatesDir);
    const hbsFiles = templateFiles.filter(file => file.endsWith('.hbs'));

    for (const file of hbsFiles) {
      const templateName = file.replace('.hbs', '');
      await this.loadTemplate(templateName);
    }
  }
}

export default TemplateEngine;
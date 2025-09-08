# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run build` - Build the project (copies src to dist, makes CLI executable, verifies templates)
- `npm run dev` - Run CLI in development mode using source files directly
- `npm run dev:scan` - Test project scanning functionality
- `npm run dev:setup` - Test smart setup functionality
- `npm test` - Run tests using Node.js built-in test runner
- `npm run prepublishOnly` - Automatically runs build before publishing

## Architecture Overview

This is an intelligent CLI tool that automatically generates Playwright test suites for route testing with authentication validation. The tool uses advanced project scanning, framework detection, and unified templating to provide zero-configuration setup.

### Core Architecture (v2.0)

**Smart CLI Interface (`src/cli.js`)**
- Enhanced CLI with multiple commands: `setup`, `scan`, `init`, `add-route`, `jenkins`, `info`
- Zero-configuration smart setup with auto-detection
- Framework-aware testing and configuration
- Jenkins pipeline generation
- Backward compatibility with legacy commands

**Project Scanner (`src/core/scanner.js`)**
- Automatically detects project framework (Next.js, React, Express, Vue, etc.)
- Scans codebase for existing routes (file-based and code-based routing)
- Intelligently categorizes routes as public, protected, or API
- Detects authentication patterns and login URLs
- Provides smart defaults and configuration suggestions

**Framework Detection System (`src/core/frameworks/`)**
- **Next.js Support (`nextjs.js`)**: Detects App Router, Pages Router, API routes
- **React Support (`react.js`)**: React Router, Reach Router, client-side routing
- **Express Support (`express.js`)**: REST APIs, middleware, route definitions
- Extensible architecture for adding new frameworks

**Unified Template Engine (`src/core/templates/engine.js`)**
- Handlebars-based templating with framework-specific conditionals
- Single template files replace 14+ duplicate templates (90% reduction)
- Dynamic feature enablement based on project configuration
- Smart test generation with framework optimizations

**Programmatic API (`src/index.js`)**
- Maintained for backward compatibility
- Enhanced with new smart features

### New Unified Template System

Located in `templates/unified/` directory with Handlebars templating:

**Core Templates:**
- `playwright.config.hbs` - Framework-aware Playwright configuration
- `test-config.hbs` - Smart test configuration with framework detection
- `tests.public.hbs` - Public route testing with framework optimizations
- `tests.protected.hbs` - Authentication redirect testing
- `tests.api.hbs` - API endpoint security testing
- `routes.*.hbs` - Route definition files
- `package.hbs` - Generated project package.json
- `redirect-helper.hbs` - Authentication helper utilities
- `jenkins.pipeline.hbs` - Self-configuring Jenkins pipeline

**Template Features:**
- Handlebars conditionals: `{{#ifFramework "nextjs"}}...{{/ifFramework}}`
- Feature flags: `{{#ifFeature "jenkins"}}...{{/ifFeature}}`
- Smart route iteration: `{{#eachRoute routes.public}}...{{/eachRoute}}`
- JSON helpers: `{{{json routes.api 2}}}` for proper formatting

### New Smart Generation Flow

1. **Project Scanning**: Automatically detect framework and routes
2. **Smart Configuration**: Generate config based on detected patterns
3. **Framework Optimization**: Apply framework-specific enhancements
4. **Unified Template Processing**: Single templates with conditional logic
5. **Intelligent Test Generation**: Context-aware test creation
6. **Jenkins Integration**: Optional self-configuring pipeline

### CLI Commands

**New Smart Commands:**
- `playwright-route-tester setup` - Zero-configuration smart setup
- `playwright-route-tester scan [--json]` - Analyze project for routes
- `playwright-route-tester jenkins` - Generate Jenkins pipeline
- `playwright-route-tester info` - Show project analysis

**Enhanced Legacy Commands:**
- `playwright-route-tester init [--scan]` - Interactive setup with auto-detection
- `playwright-route-tester add-route` - Enhanced route addition with validation

### Smart Generated Project Structure

```
playwright-tests/
├── config/test-config.js          # Framework-aware test configuration
├── helpers/redirect-helper.js     # Smart auth helpers with framework detection
├── routes/                         # Auto-detected route definitions
│   ├── public-routes.js           # Scanned public routes
│   ├── protected-routes.js        # Detected protected routes  
│   └── api-routes.js              # Found API endpoints
├── tests/                          # Framework-optimized tests
│   ├── public-routes.spec.js      # Smart public route validation
│   ├── auth-redirect.spec.js      # Intelligent auth redirect testing
│   └── api-routes.spec.js         # API security validation
├── playwright.config.js           # Framework-specific configuration
└── package.json                   # Optimized dependencies & scripts
```

### Framework-Specific Features

**Next.js Detection:**
- App Router vs Pages Router detection
- Dynamic route handling (`[id]`, `[...slug]`)
- API route auto-discovery
- Build integration and SSR considerations

**React Detection:**
- React Router vs Reach Router detection
- Client-side routing patterns
- SPA navigation testing
- Component-based route discovery

**Express Detection:**
- Route definition parsing (`app.get`, `router.post`)
- Middleware authentication detection
- REST API endpoint discovery
- Server-side route validation

### Smart Setup Modes

**Smart Setup (Recommended):**
- Zero-configuration with auto-detection
- Framework-specific optimizations
- Intelligent route discovery
- Self-configuring Jenkins pipeline

**Interactive Setup:**
- Manual route specification with smart suggestions
- Framework detection with user confirmation  
- Customizable configuration options

**Enhanced Route Configuration:**
```javascript
// Auto-detected routes with rich metadata
{ 
  url: '/', 
  title: 'Home Page', 
  expectedStatus: 200,
  framework: 'nextjs',
  type: 'page',
  file: '/app/page.tsx' 
}

// Smart protected route detection
{ 
  url: '/dashboard', 
  title: 'Dashboard', 
  requiresAuth: true, 
  expectedRedirect: '/login',
  authPattern: 'middleware'
}

// Framework-aware API routes
{ 
  url: '/api/users', 
  method: 'GET', 
  requiresAuth: true, 
  expectedStatus: 401,
  framework: 'nextjs',
  type: 'api',
  file: '/app/api/users/route.ts'
}
```

## Advanced Jenkins Integration

The new self-configuring Jenkins pipeline provides:

**Zero-Configuration Setup:**
- Automatic project detection and test generation
- Framework-specific build and test commands
- Smart health checks and server management
- No manual parameter configuration required

**Intelligent Pipeline Features:**
- Auto-detects framework and generates appropriate pipeline stages
- Dynamic test execution based on discovered routes
- Framework-specific optimizations (Next.js build, Express server start)
- Comprehensive HTML reporting with route details
- Automatic cleanup and artifact management

**Generated Pipeline Includes:**
- Environment setup with Node.js installation
- Smart dependency installation
- Auto-generated test suite creation
- Application health monitoring
- Parallel test execution (public, protected, API)
- Beautiful HTML reports with framework details
- Automatic server lifecycle management

## Dependencies

**Enhanced Runtime:**
- `commander` - CLI framework
- `inquirer` - Interactive prompts  
- `chalk` - Terminal colors
- `fs-extra` - Enhanced file system operations
- `handlebars` - Advanced templating engine
- `glob` - File pattern matching for route discovery

**Generated Test Projects:**
- `@playwright/test` - Testing framework (peer dependency)
- Framework-specific optimizations and dependencies

## Package Configuration

- ES modules (`"type": "module"`)
- Bin entry: `playwright-route-tester` → `dist/cli.js`
- Main entry: `dist/index.js`  
- Files included: `dist`, `templates`, `README.md`, `LICENSE`, `CLAUDE.md`
- Enhanced scripts: `dev:scan`, `dev:setup` for development
- Node.js test runner integration

## Usage Examples

**Zero-Configuration Setup:**
```bash
# Smart setup - detects everything automatically
npx playwright-route-tester setup

# With Jenkins pipeline
npx playwright-route-tester setup --jenkins
```

**Project Analysis:**
```bash
# Scan and display detected routes
npx playwright-route-tester scan

# JSON output for programmatic use
npx playwright-route-tester scan --json
```

**Jenkins Pipeline:**
```bash
# Generate smart Jenkins pipeline
npx playwright-route-tester jenkins
```

## No NPM Deployment of node_modules

The package correctly excludes `node_modules` from deployment:
- Uses `files` array in package.json to explicitly include only necessary files
- Dependencies are installed by end users (`npm install`)
- Keeps package size minimal and secure
- Templates and source code only in published package
# 🎭 Playwright Route Tester

An intelligent CLI tool that **automatically generates** comprehensive Playwright tests for web application route testing with authentication validation. Features smart project scanning, framework detection, and zero-configuration setup.

## ⚡ **NEW**: Zero-Configuration Smart Setup

```bash
# ONE COMMAND - Detects everything automatically! 🚀
npx playwright-route-tester setup

# That's it! Routes detected, tests generated, ready to run ✨
```

## 🚀 Smart Features

- **🧠 Auto-Detection**: Automatically scans your project for routes and framework
- **🎯 Framework-Aware**: Supports Next.js, React, Express with optimized testing
- **🔐 Security Testing**: Validates authentication redirects and API protection
- **🌐 Route Discovery**: Finds routes in App Router, Pages Router, React Router, Express
- **🔧 Jenkins Integration**: Self-configuring CI/CD pipelines
- **📊 Smart Reports**: Framework-specific insights and comprehensive analysis
- **⚡ Zero Config**: Works out of the box with intelligent defaults
- **🎨 Beautiful CLI**: Intuitive interface with helpful guidance

## 📦 Installation & Quick Start

### ⚡ Instant Setup (Recommended)

```bash
# Zero-configuration setup - detects everything automatically
npx playwright-route-tester setup

# With Jenkins pipeline generation
npx playwright-route-tester setup --jenkins

# Then run your tests
cd playwright-tests && npm install && npm test
```

### 🔍 Analyze Your Project First

```bash
# See what routes and framework are detected
npx playwright-route-tester scan

# JSON output for programmatic use
npx playwright-route-tester scan --json
```

### 📦 Installation Options

```bash
# Global installation
npm install -g playwright-route-tester

# NPX (no installation required)
npx playwright-route-tester setup

# Local project installation
npm install playwright-route-tester --save-dev
```

## 🎬 Smart Setup Options

### 🧠 Option 1: Smart Setup (Recommended)

**Zero configuration required** - automatically detects your project:

```bash
# Detects framework, finds routes, generates optimized tests
npx playwright-route-tester setup
```

**What Smart Setup detects automatically:**
- 🎯 **Framework**: Next.js (App/Pages Router), React Router, Express, etc.
- 🔍 **Routes**: File-based routing, code-based routing, API endpoints
- 🔐 **Authentication**: Login patterns, protected route detection
- ⚙️ **Configuration**: Base URLs, build commands, optimal settings

**Supports these frameworks out of the box:**
- **Next.js**: App Router (`app/`), Pages Router (`pages/`), API routes
- **React**: React Router, client-side routing patterns  
- **Express**: Route definitions, middleware, REST APIs
- **Generic**: Intelligent defaults for any web application

### 🔍 Option 2: Scan First, Then Setup

**Analyze your project** before generating tests:

```bash
# See what will be detected
npx playwright-route-tester scan

# Then setup with detected routes
npx playwright-route-tester init --scan
```

### 🎛️ Option 3: Interactive Setup

**Full customization** with smart suggestions:

```bash
# Interactive mode with auto-detection assistance
playwright-route-tester init

# Custom directory
playwright-route-tester init --directory ./my-tests
```

**Smart prompts will show:**
- Detected framework and suggest optimizations
- Found routes with confirmation options
- Intelligent defaults based on your project structure

## 🔍 Smart Detection Examples

### Next.js Project Detection
```bash
🎭 Smart Playwright Route Tester Setup

🔍 Scanning project for routes and configuration...
✅ Auto-detected nextjs project
📊 Found 8 public, 5 protected, 12 API routes
   Public routes: /, /about, /contact, /pricing
   Protected routes: /dashboard, /profile, /settings, /admin
   API routes: /api/users, /api/auth/login, /api/products...

📁 Creating framework-optimized tests...
✅ Next.js App Router features enabled
✅ Dynamic route testing configured
✅ API route authentication testing ready
```

### React Router Project Detection
```bash
🔍 Scanning project for routes and configuration...
✅ Auto-detected react project with react-router-dom
📊 Found 6 public, 4 protected, 0 API routes
   Router type: react-router-dom v6
   Routes found in: src/App.jsx, src/routes/index.js

🎯 React-specific features enabled:
✅ Client-side navigation testing
✅ SPA route validation
✅ History API testing
```

## 📁 Smart Generated Project Structure

```
playwright-tests/
├── config/
│   └── test-config.js          # 🧠 Framework-aware configuration
├── helpers/
│   └── redirect-helper.js      # 🔧 Smart auth helpers with framework detection
├── routes/
│   ├── public-routes.js        # 📍 Auto-discovered public routes
│   ├── protected-routes.js     # 🔐 Detected protected routes
│   └── api-routes.js           # 🔌 Found API endpoints
├── tests/
│   ├── public-routes.spec.js   # 🌐 Framework-optimized public route tests
│   ├── auth-redirect.spec.js   # 🔐 Intelligent authentication testing
│   └── api-routes.spec.js      # 🔌 API security validation
├── playwright.config.js        # ⚙️ Framework-specific Playwright config
└── package.json               # 📦 Optimized dependencies & scripts
```

### Framework-Specific Optimizations

**Next.js Projects:**
- App Router vs Pages Router detection
- Dynamic route testing (`[id]`, `[...slug]`)
- API route security validation
- Build integration and SSR considerations

**React Projects:**
- React Router integration
- Client-side navigation testing
- SPA-specific authentication patterns

**Express Projects:**
- Route parsing and middleware detection
- REST API security testing
- Server-side authentication validation

## 🔧 Enhanced CLI Commands

### 🧠 `setup` - Smart Zero-Config Setup

**Automatically detects everything:**

```bash
playwright-route-tester setup [options]

Options:
  -d, --directory <path>  Target directory (default: ./playwright-tests)
  --jenkins              Include Jenkins pipeline generation
  --force                Overwrite existing files

# Examples
playwright-route-tester setup                    # Smart detection
playwright-route-tester setup --jenkins          # With CI/CD pipeline
playwright-route-tester setup -d ./e2e-tests     # Custom directory
```

### 🔍 `scan` - Project Analysis

**Analyze your project without generating tests:**

```bash
playwright-route-tester scan [options]

Options:
  --json                 Output results as JSON

# Examples
playwright-route-tester scan                     # Human-readable analysis
playwright-route-tester scan --json             # JSON output
```

### 🔧 `jenkins` - CI/CD Pipeline Generation

**Generate self-configuring Jenkins pipeline:**

```bash
playwright-route-tester jenkins [options]

Options:
  --framework <name>     Specify framework (nextjs, react, express)

# Examples
playwright-route-tester jenkins                  # Auto-detect framework
playwright-route-tester jenkins --framework nextjs
```

### ℹ️ `info` - Project Information

**Show detected project details:**

```bash
playwright-route-tester info                     # Show project analysis
```

### 🎛️ `init` - Enhanced Interactive Setup

**Interactive mode with smart suggestions:**

```bash
playwright-route-tester init [options]

Options:
  -d, --directory <path>  Target directory (default: ./playwright-tests)
  -b, --bare             Create minimal setup without prompts
  --scan                 Auto-scan project first, then confirm

# Examples
playwright-route-tester init --scan             # Scan + interactive
playwright-route-tester init --bare             # Quick defaults
```

### ➕ `add-route` - Enhanced Route Management

**Add routes with smart validation:**

```bash
playwright-route-tester add-route [options]

Options:
  -t, --type <type>    Route type: public, protected, api
  -u, --url <url>      Route URL
  -n, --name <name>    Route name/title

# Interactive mode with smart prompts
playwright-route-tester add-route
```

## 🧪 Smart Test Types

### 🌐 Framework-Aware Public Routes Testing

- ✅ **Smart Status Validation**: Expected codes based on framework patterns
- ✅ **Framework-Specific Checks**: Next.js error pages, React SPA validation
- ✅ **Dynamic Route Testing**: Handles `[id]`, `[...slug]` patterns automatically  
- ✅ **Performance Insights**: Load times, bundle analysis for detected frameworks
- ✅ **Accessibility Validation**: Framework-specific a11y patterns

### 🔐 Intelligent Authentication Testing

- 🧠 **Smart Login Detection**: Automatically finds login forms and patterns
- 🔐 **Framework Auth Patterns**: Next.js middleware, React Router guards, Express sessions
- 🔐 **Multi-Strategy Testing**: Handles different auth implementations
- 🔐 **Security Vulnerability Scanning**: Detects unprotected routes that should be secured
- 🔐 **Advanced Redirect Validation**: Complex redirect chains and edge cases

### 🔌 Advanced API Security Testing

- 🎯 **Endpoint Discovery**: Automatically finds API routes in code and file structure
- 🔌 **Method-Aware Testing**: GET, POST, PUT, DELETE with appropriate expectations
- 🔌 **Framework Integration**: Next.js API routes, Express middleware, REST patterns
- 🔌 **Error Response Validation**: Proper error codes, messages, and formats
- 🔌 **CORS and Headers**: Security header validation

### 📊 Smart Reporting

- 📈 **Framework-Specific Insights**: Tailored reports for your stack
- 🎯 **Security Score**: Overall application security assessment
- 📋 **Detailed Findings**: Route-by-route analysis with recommendations
- 🔍 **Vulnerability Detection**: Potential security issues with fix suggestions

## 🛠️ Programmatic API

You can also use the tool programmatically:

```javascript
import { PlaywrightRouteTester } from 'playwright-route-tester';

const tester = new PlaywrightRouteTester({
  baseURL: 'http://localhost:3000',
  loginURL: '/login',
  timeout: 10000
});

const routes = {
  public: [
    { url: '/', title: 'Home Page', expectedStatus: 200 },
    { url: '/about', title: 'About Page', expectedStatus: 200 }
  ],
  protected: [
    { url: '/dashboard', title: 'Dashboard', requiresAuth: true }
  ],
  api: [
    { url: '/api/user', title: 'User API', method: 'GET', expectedStatus: 401 }
  ]
};

await tester.generateTests('./my-tests', routes);
```

## 📊 Test Reports

After running tests, you'll get:

### Security Summary
```
🔐 Testing authentication requirement for all 4 protected routes
✅ /dashboard: Properly protected
✅ /profile: Properly protected  
✅ /settings: Properly protected
✅ /admin: Properly protected
📊 Security Summary: 4/4 routes properly protected
```

### API Security Report
```
🔌 Testing authentication requirement for all 3 API routes
✅ /api/user: Properly protected (401)
✅ /api/orders: Properly protected (401)
✅ /api/products: Properly protected (401)
📊 API Security Summary: 3/3 APIs properly protected
```

## ⚙️ Configuration

### Route Configuration

Each route type supports different options:

#### Public Routes
```javascript
{
  url: '/about',
  title: 'About Page',
  expectedStatus: 200,
  timeout: 10000,
  keyElement: '.about-content'  // Optional: element to verify
}
```

#### Protected Routes
```javascript
{
  url: '/dashboard',
  title: 'Dashboard',
  requiresAuth: true,
  expectedRedirect: '/login'
}
```

#### API Routes
```javascript
{
  url: '/api/user',
  title: 'User API',
  method: 'GET',
  requiresAuth: true,
  expectedStatus: 401,           // When not authenticated
  authenticatedStatus: 200       // When authenticated
}
```

### Test Configuration

Customize test behavior in `config/test-config.js`:

```javascript
export const testConfig = {
  baseURL: 'http://localhost:3000',
  loginURL: '/login',
  timeout: 10000,
  
  // Login form selectors (automatically detected)
  loginSelectors: [
    'input[name="username"]',
    'input[name="email"]', 
    '#login-form',
    '.login-container'
  ],
  
  // API testing headers
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
```

## 🚀 Running Your Smart Tests

### 📋 Generated Test Scripts

Smart setup creates optimized test scripts:

```bash
# Generated in playwright-tests/package.json
npm test                    # Run all tests
npm run test:headed         # Run with browser UI  
npm run test:debug          # Debug mode
npm run test:ui             # Interactive UI mode
npm run test:public         # Only public route tests
npm run test:protected      # Only authentication tests  
npm run test:api            # Only API security tests
npm run report              # Show HTML report
```

### 🔧 Jenkins Integration (Zero Configuration!)

**Generate a complete Jenkins pipeline:**

```bash
# Creates a self-configuring Jenkinsfile
playwright-route-tester jenkins
```

**The generated pipeline automatically:**
- 🔍 Detects your framework and generates tests during build
- 🏥 Starts your application and performs health checks
- 🧪 Runs tests in parallel (public, protected, API)
- 📊 Generates beautiful HTML reports with framework insights
- 🧹 Handles cleanup and artifact management
- ⚙️ Works with Next.js, React, Express automatically

### 🤖 CI/CD Integration

#### GitHub Actions (Smart Setup)
```yaml
name: Smart Route Testing

on: [push, pull_request]

jobs:
  test-routes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      # Zero-configuration setup!
      - name: Generate and run route tests
        run: |
          npx playwright-route-tester setup
          cd playwright-tests
          npm ci
          npx playwright install
          npm test
```

#### GitLab CI (Framework Detection)
```yaml
stages:
  - test

route-testing:
  stage: test
  script:
    - npx playwright-route-tester setup --jenkins
    - cd playwright-tests && npm ci && npx playwright install
    - npm test
  artifacts:
    reports:
      junit: playwright-tests/test-results/results.xml
    paths:
      - playwright-tests/playwright-report/
```

## 🆚 Setup Mode Comparison

| Feature | Smart Setup (`setup`) | Interactive Mode (`init`) | Legacy Bare Mode |
|---------|----------------------|-------------------------|------------------|
| **Setup Time** | ⚡ Instant (auto-detection) | 🎛️ Guided with suggestions | ⚡ Instant defaults |
| **Route Detection** | 🧠 Automatically scans code | 🔍 Suggests + manual confirm | 🎯 Generic defaults |
| **Framework Support** | 🎯 Full framework optimization | 🎛️ Framework-aware prompts | ❌ Generic only |
| **Configuration** | 🤖 Intelligent auto-config | 🛠️ Fully customizable | 📝 Basic defaults |
| **Best For** | 🚀 **Most users** - works everywhere | 🔧 Custom requirements | 🏃 Legacy compatibility |

### 🎯 **Recommended: Smart Setup**

**Use Smart Setup (`setup`) when:**
- ✅ You want the easiest, most accurate setup
- ✅ Your project uses Next.js, React, or Express
- ✅ You want framework-specific optimizations
- ✅ You're setting up CI/CD pipelines
- ✅ You want the best testing experience

**Use Interactive Mode (`init`) when:**
- 🛠️ You need to customize specific route configurations
- 🔧 Your routes don't follow standard patterns
- 🎛️ You want to review and modify detected routes
- 📝 You have complex authentication requirements

**Use Legacy Bare Mode when:**
- 🔄 Migrating from older versions
- 🏃 You need basic tests with minimal setup
- 📦 Framework detection isn't needed

## 🛡️ Advanced Security Features

### 🧠 Smart Vulnerability Detection
- **Route Pattern Analysis**: Identifies routes that look like they should be protected
- **Framework-Specific Security**: Next.js middleware, React Router guards, Express sessions
- **Authentication Flow Testing**: Complex redirect chains and edge cases
- **API Security Scanning**: Comprehensive endpoint protection validation

### 📊 Security Reporting
- **Security Score Dashboard**: Overall application security assessment
- **Risk Classification**: High/Medium/Low risk findings with explanations
- **Fix Recommendations**: Specific guidance for securing vulnerable routes
- **Compliance Checks**: Common security standard validations

### 🎯 Framework-Aware Security Testing
- **Next.js**: Middleware validation, API route protection, SSR security
- **React**: Client-side auth guards, protected component testing
- **Express**: Middleware chains, session validation, CORS configuration
- **Generic**: Universal security patterns and best practices

## 🌟 Why Choose Playwright Route Tester?

### 🧠 **Intelligent & Automatic**
- Zero configuration required - works out of the box
- Smart framework detection and optimization  
- Automatic route discovery and categorization
- Self-configuring CI/CD pipelines

### 🎯 **Framework-First Approach**
- **Next.js**: App Router, Pages Router, API routes, dynamic routing
- **React**: React Router, client-side navigation, SPA patterns
- **Express**: REST APIs, middleware, authentication patterns
- **Extensible**: Easy to add support for new frameworks

### 🔐 **Security-Focused**
- Comprehensive authentication testing
- API security validation  
- Vulnerability detection and reporting
- Security best practices enforcement

### 🚀 **Developer Experience**
- Beautiful CLI with helpful guidance
- Rich HTML reports with actionable insights
- Jenkins integration with zero configuration
- Backward compatibility with existing setups

## 🤝 Contributing

We welcome contributions! The new smart architecture makes it easy to:
- Add support for new frameworks in `src/core/frameworks/`
- Enhance route detection patterns
- Improve template generation
- Add new CLI commands

Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © Muhammad Haroon Aslam

## 🐛 Issues & Support

- 🐛 [Report Issues](https://github.com/muhharoonaslam/playwright-route-tester/issues)
- 💬 [Discussions](https://github.com/muhharoonaslam/playwright-route-tester/discussions)
- 📚 [Documentation](https://github.com/muhharoonaslam/playwright-route-tester/wiki)
- 📧 Email: muhharoonaslam@gmail.com

## 🎉 Recent Updates (v2.0)

- 🧠 **Smart Auto-Detection**: Zero-configuration setup with intelligent project scanning
- 🎯 **Framework Support**: Full Next.js, React, and Express optimization
- 🔧 **Jenkins Integration**: Self-configuring CI/CD pipelines
- 📊 **Enhanced Reporting**: Framework-specific insights and security scoring  
- 🎨 **Better CLI**: Beautiful interface with helpful guidance
- 📦 **90% Smaller**: Unified templates reduce complexity and maintenance

---

<div align="center">

**⭐ Star this repo if it helps secure your application! ⭐**

**Made with ❤️ for the testing community**

*Now with smart detection and zero-configuration setup!*

</div>
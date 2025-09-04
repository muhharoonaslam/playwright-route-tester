# 🎭 Playwright Route Tester

A powerful CLI tool that generates comprehensive Playwright tests for web application route testing with authentication redirect validation. Perfect for ensuring your app's security and functionality across all routes.

## 🚀 Features

- **🔐 Authentication Testing**: Automatically test that protected routes redirect to login
- **🌐 Public Route Validation**: Ensure public pages load correctly
- **🔌 API Security Testing**: Verify API endpoints return proper authentication errors
- **⚡ Easy Setup**: Interactive CLI guides you through configuration
- **🚀 Bare Mode**: Quick setup with minimal configuration for instant testing
- **📊 Comprehensive Reports**: Detailed test results with security insights
- **🎯 Customizable**: Flexible configuration for different application structures

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g playwright-route-tester
```

### NPX (No Installation Required)

```bash
npx playwright-route-tester init
```

### Local Project Installation

```bash
npm install playwright-route-tester --save-dev
```

## 🎬 Quick Start

### Option 1: Bare Mode (Recommended for Quick Testing)

Perfect for getting started quickly with minimal configuration:

```bash
# Create bare setup with default routes
playwright-route-tester init --bare

# Setup dependencies
cd playwright-tests && npm install && npx playwright install

# Add to your main package.json scripts:
# "test:routes": "npx playwright test --config=playwright-tests/playwright.config.js"

# Run from your project root
npm run test:routes
```

**What you get with `--bare`:**
- ✅ Public routes: `/`, `/about`, `/contact`  
- ✅ Protected routes: `/dashboard`, `/profile`, `/settings`
- ✅ API routes: `/api/users`, `/api/products`
- ✅ Tests runnable from project root
- ✅ No interactive prompts needed

### Option 2: Interactive Setup (Full Customization)

For detailed configuration of your specific routes:

```bash
# Interactive setup
playwright-route-tester init

# Or specify target directory
playwright-route-tester init --directory ./my-tests
```

The CLI will prompt you for:

- **Base URL**: Your application's base URL (e.g., `http://localhost:3000`)
- **Login URL**: Path to your login page (e.g., `/login`)
- **Public Routes**: Routes accessible without authentication
- **Protected Routes**: Routes that should redirect to login
- **API Routes**: API endpoints to test for authentication

Then run your tests:

```bash
cd ./playwright-tests  # or your chosen directory
npm install
npx playwright install
npm test
```

## 📋 Example Configuration

When you run `playwright-route-tester init`, you'll be guided through configuration like this:

```bash
🎭 Playwright Route Tester Setup

? What is your application base URL? http://localhost:3000
? What is your login page URL (relative to base URL)? /login
? Do you want to include API route testing? Yes
? Enter public routes (comma-separated): /, /about, /contact, /pricing
? Enter protected routes (comma-separated): /dashboard, /profile, /settings
? Enter API routes to test (comma-separated): /api/user, /api/orders
```

## 📁 Generated Project Structure

```
playwright-tests/
├── config/
│   └── test-config.js          # Test configuration
├── helpers/
│   └── redirect-helper.js      # Authentication helpers
├── routes/
│   ├── public-routes.js        # Public route definitions
│   ├── protected-routes.js     # Protected route definitions
│   └── api-routes.js           # API route definitions
├── tests/
│   ├── public-routes.spec.js   # Public route tests
│   ├── auth-redirect.spec.js   # Authentication redirect tests
│   └── api-routes.spec.js      # API authentication tests
├── playwright.config.js        # Playwright configuration
└── package.json               # Test project dependencies
```

## 🔧 CLI Commands

### `init`

Initialize a new test suite:

```bash
playwright-route-tester init [options]

Options:
  -d, --directory <path>  Target directory (default: ./playwright-tests)
  -b, --bare             Create minimal setup without prompts - generates barebone 
                         public, protected and API tests with default routes
```

#### Bare Mode Examples

```bash
# Quick setup with defaults
playwright-route-tester init --bare

# Bare setup in custom directory  
playwright-route-tester init --bare --directory ./e2e-tests

# Then add to your package.json:
{
  "scripts": {
    "test:routes": "npx playwright test --config=./e2e-tests/playwright.config.js",
    "test:routes:headed": "npx playwright test --config=./e2e-tests/playwright.config.js --headed"
  }
}
```

### `add-route`

Add a new route to existing configuration:

```bash
playwright-route-tester add-route [options]

Options:
  -t, --type <type>    Route type: public, protected, api (default: public)
  -u, --url <url>      Route URL
  -n, --name <name>    Route name/title
```

## 🔍 Test Types

### Public Routes Testing

- ✅ Verifies routes load with expected status codes
- ✅ Checks for key page elements
- ✅ Validates page accessibility
- ✅ Takes screenshots on failures

### Authentication Redirect Testing

- 🔐 Ensures protected routes redirect to login when not authenticated
- 🔐 Detects potential security vulnerabilities
- 🔐 Validates login page accessibility
- 🔐 Generates security reports

### API Authentication Testing

- 🔌 Tests API endpoints return 401 when not authenticated
- 🔌 Validates error response formats
- 🔌 Checks authentication error messages
- 🔌 Ensures proper API security

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

## 🚀 Publishing Your Tests

### Run Tests
```bash
npm test                    # Run all tests
npm run test:headed         # Run with browser UI
npm run test:debug          # Debug mode
npm run report              # Show HTML report
```

### CI/CD Integration

The generated tests work great in CI/CD pipelines:

#### For Bare Mode Setup:
```yaml
# GitHub Actions example
- name: Install test dependencies
  run: |
    cd playwright-tests
    npm ci
    npx playwright install

- name: Run route tests from project root
  run: npm run test:routes
```

#### For Interactive Mode Setup:
```yaml
# GitHub Actions example
- name: Install dependencies
  run: |
    cd playwright-tests
    npm ci
    npx playwright install

- name: Run Playwright tests
  run: |
    cd playwright-tests
    npm test
```

## 🆚 Bare Mode vs Interactive Mode

| Feature | Bare Mode (`--bare`) | Interactive Mode |
|---------|---------------------|------------------|
| **Setup Time** | ⚡ Instant (no prompts) | 🐌 Interactive prompts |
| **Configuration** | 🎯 Default routes only | 🎛️ Fully customizable |
| **Test Execution** | 🏠 From project root | 📁 From test directory |
| **Routes Included** | ✅ Common defaults | ✅ Your specific routes |
| **Best For** | 🚀 Quick testing, CI/CD | 🔧 Production apps |

**Use Bare Mode When:**
- You want to quickly test standard routes (`/`, `/dashboard`, `/api/*`)
- You're setting up CI/CD pipelines  
- You want tests runnable from your main project
- You prefer minimal configuration

**Use Interactive Mode When:**
- You have specific custom routes to test
- You need detailed configuration options
- You want a standalone test project
- Your routes don't match the defaults

## 🛡️ Security Features

- **Vulnerability Detection**: Identifies routes that should be protected but aren't
- **Security Reports**: Detailed reports of potential security issues
- **Authentication Validation**: Ensures proper redirect behavior
- **API Security**: Validates API authentication requirements

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [Your Name]

## 🐛 Issues & Support

- 🐛 [Report Issues](https://github.com/yourusername/playwright-route-tester/issues)
- 💬 [Discussions](https://github.com/yourusername/playwright-route-tester/discussions)
- 📚 [Documentation](https://github.com/yourusername/playwright-route-tester/wiki)

---

<div align="center">

**⭐ Star this repo if it helps secure your application! ⭐**

Made with ❤️ for the testing community

</div>
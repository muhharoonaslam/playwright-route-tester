### Playwright Route Tester — API and CLI Reference

This document covers the public surface of Playwright Route Tester: the CLI and the programmatic API. It also outlines the route data model, generated files, and Jenkins integration. Copy-paste sections into your wiki as needed.

- Package: `playwright-route-tester`
- Node.js: >= 16
- Module type: ESM

## Installation

- Global: `npm i -g playwright-route-tester`
- Ad-hoc: `npx playwright-route-tester@latest <command>`

## CLI

Usage: `playwright-route-tester [command] [options]`

Commands:

- **info**: Show project information and detected settings
  - Example:
    ```bash
    npx playwright-route-tester info
    ```

- **setup**: Smart zero-configuration setup — detects your framework and routes, then generates a ready-to-run test project
  - Options:
    - `-d, --directory <path>`: target directory, default `./playwright-tests`
    - `--jenkins`: also generate a Jenkins pipeline
    - `--force`: overwrite an existing setup
    - `--no-version-check`: skip update check
  - Example:
    ```bash
    npx playwright-route-tester setup -d ./playwright-tests --jenkins
    ```

- **scan**: Scan the current project and detect framework, base/login URLs, and routes
  - Options:
    - `--json`: emit JSON to stdout
  - Examples:
    ```bash
    # human-readable
    npx playwright-route-tester scan

    # JSON (pipe to jq)
    npx playwright-route-tester scan --json | jq
    ```

- **init** (legacy): Interactive setup retained for backwards compatibility
  - Options:
    - `-d, --directory <path>`: target directory
    - `-b, --bare`: minimal setup without prompts
    - `--scan`: auto-scan before prompting
  - Example:
    ```bash
    npx playwright-route-tester init --scan -d ./playwright-tests
    ```

- **add-route**: Add a new route to an existing generated test project
  - Options:
    - `-t, --type <type>`: `public` | `protected` | `api` (default: `public`)
    - `-u, --url <url>`: route URL (required)
    - `-n, --name <name>`: descriptive title (required)
  - Example:
    ```bash
    npx playwright-route-tester add-route -t protected -u /dashboard -n "Dashboard"
    ```

- **jenkins**: Generate a `Jenkinsfile` at repo root based on detected or specified framework
  - Options:
    - `--framework <name>`: `nextjs`, `react`, or `express` (optional; auto-detected if omitted)
  - Example:
    ```bash
    npx playwright-route-tester jenkins --framework nextjs
    ```

### What setup generates

After `setup`, your target directory (default `./playwright-tests`) typically includes:

- `playwright.config.js`
- `playwright.global-setup.js`
- `config/test-config.js`
- `helpers/redirect-helper.js` (+ `helpers/shopify-auth-helper.js` for Shopify apps)
- `routes/public-routes.js` (if public routes)
- `routes/protected-routes.js` (if protected routes)
- `routes/api-routes.js` (if API routes)
- `tests/public-routes.spec.js` (if public routes)
- `tests/auth-redirect.spec.js` (if protected routes)
- `tests/api-routes.spec.js` (if API routes)
- `package.json` (for the generated test project)

If `--jenkins` is provided, a `Jenkinsfile` is generated at the repository root.

## Programmatic API

The package exposes a programmatic API for generating route test projects.

```js
import PlaywrightRouteTester, { PlaywrightRouteTester as PRT } from 'playwright-route-tester';

// Default or named import both work
const tester = new PlaywrightRouteTester({
	baseURL: 'http://localhost:3000',
	loginURL: '/login',
	timeout: 30000
});

const routes = {
	public: [
		{ url: '/', title: 'Home Page' },
		{ url: '/about', title: 'About Page' }
	],
	protected: [
		{ url: '/dashboard', title: 'Dashboard', requiresAuth: true, expectedRedirect: '/login' }
	],
	api: [
		{ url: '/api/users', title: 'Users API', method: 'GET', requiresAuth: true, expectedStatus: 401 }
	]
};

const result = await tester.generateTests('./playwright-tests', routes);
console.log(result.files);
```

### Class: `PlaywrightRouteTester`

- **constructor(config?)**
  - `config.baseURL` string, default `http://localhost:3000`
  - `config.loginURL` string, default `/login`
  - `config.timeout` number (ms), default `10000`

- **generateTests(targetDir, routes)** → `Promise<{ success, message, files }>`
  - Creates target structure, writes config, routes, and test files (see below). Returns relative file paths generated.

- **generateConfig(targetDir)** → `Promise<void>`
  - Writes `config/test-config.js` exporting `testConfig`:
    ```js
    export const testConfig = { baseURL, loginURL, timeout };
    ```

- **generateRouteFiles(targetDir, routes)** → `Promise<void>`
  - Writes route files based on provided `routes` object:
    - `routes/public-routes.js` → `export const publicRoutes = [...]`
    - `routes/protected-routes.js` → `export const protectedRoutes = [...]`
    - `routes/api-routes.js` → `export const apiRoutes = [...]`

- **generateTestFiles(targetDir, routes)** → `Promise<void>`
  - Current version contains a minimal placeholder. Full test generation is handled by the CLI `setup` which uses the template engine.

- **getGeneratedFiles(targetDir)** → `Promise<string[]>`
  - Recursively lists all files generated under `targetDir`.

### Routes data model

Provide any subset of the following arrays. Each entry is a plain object; only `url` is strictly required by the generator, but adding metadata improves test output:

- **public[]**
  - `{ url: string, title?: string, expectedStatus?: number }`

- **protected[]**
  - `{ url: string, title?: string, requiresAuth: true, expectedRedirect?: string }`
  - Typical `expectedRedirect`: `/login`

- **api[]**
  - `{ url: string, title?: string, method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE', requiresAuth?: boolean, expectedStatus?: number }`
  - Defaults when generated from scanners: `method: 'GET'`, `requiresAuth: true`, `expectedStatus: 401`

## Detectors and Templates (advanced)

These are used by the CLI to auto-detect routes and generate files. They are not part of the stable public API, but are listed here for architectural understanding.

- **ProjectScanner** (`src/core/scanner.js`)
  - Detects framework (Next.js, React, Express, Shopify app, etc.)
  - Discovers routes from the file system and code patterns
  - Produces `{ framework, routes, config }` used by `setup`

- **Framework detectors**
  - `NextjsFramework`, `ReactFramework`, `ExpressFramework`, `ShopifyFramework`
  - Parse framework-specific file conventions to extract public/protected/API routes

- **TemplateEngine** (`src/core/templates/engine.js`)
  - Handlebars-based generator used by the CLI to produce `playwright.config.js`, helpers, routes, tests, and `package.json` inside the test project. Also renders the Jenkins pipeline when requested.

- **VersionChecker** (`src/core/version-checker.js`)
  - Checks for new versions and guides upgrades for generated projects

Note: These modules may not be exported in the published package’s top-level API and are subject to change.

## Jenkins integration

- Via setup: `npx playwright-route-tester setup --jenkins`
- On-demand: `npx playwright-route-tester jenkins`
- Output: A `Jenkinsfile` at repo root with sensible defaults for the detected framework

## Typical workflow

1) Generate a project with detected routes:
```bash
npx playwright-route-tester setup -d ./playwright-tests
```
2) Add new routes later:
```bash
npx playwright-route-tester add-route -t api -u /api/health -n "Health Check"
```
3) Run tests (from inside `./playwright-tests`):
```bash
npm install
npx playwright install
npm test
```

## Troubleshooting

- No routes detected: run `scan` to confirm detection; you can still use `init` or provide routes programmatically.
- Overwriting existing setup: pass `--force` to `setup`.
- Authentication assumptions: protected and API routes default to unauthenticated expectations unless configured otherwise.

## License

MIT — see `LICENSE` in the repository.


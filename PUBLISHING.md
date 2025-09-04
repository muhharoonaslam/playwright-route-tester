# 📦 Publishing Your NPX Package - Complete Guide

## 🚀 Publishing Steps

### 1. Pre-publishing Checklist

✅ **Code is ready**
- [ ] All features implemented
- [ ] Build script works (`npm run build`)
- [ ] Tests pass (if any)
- [ ] Documentation complete

✅ **Package configuration**
- [ ] `package.json` has correct name, version, description
- [ ] `bin` field points to correct CLI file
- [ ] `files` array includes all necessary files
- [ ] `keywords` are relevant for discoverability

✅ **NPM account setup**
- [ ] NPM account created
- [ ] Email verified
- [ ] Logged in via CLI

### 2. Prepare for Publishing

```bash
# 1. Check if package name is available
npm view playwright-route-tester

# If available, you'll see: npm ERR! code E404
# If taken, choose a different name

# 2. Login to npm (if not already)
npm login

# 3. Verify you're logged in
npm whoami

# 4. Update version if needed
npm version patch  # or minor, major
```

### 3. Test Your Package Locally

```bash
# Build the package
npm run build

# Test CLI locally
node dist/cli.js --help

# Pack to see what will be published
npm pack

# This creates a .tgz file - check its contents
tar -tzf playwright-route-tester-1.0.0.tgz
```

### 4. Publish to NPM

```bash
# Dry run first (see what would be published)
npm publish --dry-run

# If everything looks good, publish!
npm publish

# For scoped packages (if using @your-name/package-name)
npm publish --access public
```

### 5. Verify Publication

```bash
# Check your package on NPM
npm view playwright-route-tester

# Test installation globally
npm install -g playwright-route-tester

# Test the CLI
playwright-route-tester --help

# Test via NPX (without installation)
npx playwright-route-tester --help
```

## 🔄 Updating Your Package

### Version Updates

```bash
# For bug fixes
npm version patch    # 1.0.0 → 1.0.1

# For new features
npm version minor    # 1.0.0 → 1.1.0

# For breaking changes
npm version major    # 1.0.0 → 2.0.0

# Then publish the update
npm publish
```

### Update Process

1. Make your changes
2. Test locally
3. Update version: `npm version patch/minor/major`
4. Publish: `npm publish`
5. Verify: `npm view playwright-route-tester`

## 📊 Package Statistics

After publishing, you can track:

- **Downloads**: Check on [npmjs.com](https://www.npmjs.com/package/playwright-route-tester)
- **Usage**: `npm view playwright-route-tester`
- **Issues**: GitHub Issues (if repository linked)

## 🛠️ Troubleshooting

### Common Publishing Issues

**Error: Package name too similar**
```bash
# Solution: Choose a more unique name
# Update package.json name field
```

**Error: Version already exists**
```bash
# Solution: Bump version
npm version patch
npm publish
```

**Error: Authentication failed**
```bash
# Solution: Login again
npm logout
npm login
```

**Error: 403 Forbidden**
```bash
# Solution: Check if name is already taken by someone else
npm view <your-package-name>
```

### Build Issues

**Templates not copied**
- Check `package.json` `files` array includes `"templates"`
- Verify build script copies templates correctly

**CLI not executable**
- Ensure `dist/cli.js` has shebang: `#!/usr/bin/env node`
- Check file permissions: `chmod +x dist/cli.js`

## 🔒 Security Best Practices

### Before Publishing
- [ ] No sensitive data in code
- [ ] No API keys or tokens
- [ ] Dependencies are secure
- [ ] Run `npm audit` to check vulnerabilities

### Package Security
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Check outdated dependencies
npm outdated
```

## 📈 Package Promotion

### After Publishing

1. **Add to README badges**:
   ```markdown
   ![npm version](https://badge.fury.io/js/playwright-route-tester.svg)
   ![npm downloads](https://img.shields.io/npm/dt/playwright-route-tester.svg)
   ```

2. **Share on platforms**:
   - Twitter/X
   - LinkedIn
   - Reddit (r/javascript, r/node)
   - Dev.to article
   - Hacker News

3. **Documentation**:
   - Create GitHub wiki
   - Add examples
   - Create video tutorials

## 🎯 Success Metrics

Track your package success:
- **Downloads per week/month**
- **GitHub stars** (if applicable)
- **Issues and contributions**
- **Community feedback**

## 📝 Package.json Template

```json
{
  "name": "your-unique-package-name",
  "version": "1.0.0",
  "description": "Clear, concise description",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "your-cli-name": "dist/cli.js"
  },
  "scripts": {
    "build": "node scripts/build.js",
    "prepublishOnly": "npm run build",
    "test": "your-test-command"
  },
  "keywords": [
    "relevant",
    "keywords",
    "for",
    "discovery"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  },
  "bugs": {
    "url": "https://github.com/username/repo/issues"
  },
  "homepage": "https://github.com/username/repo#readme",
  "engines": {
    "node": ">=16.0.0"
  },
  "files": [
    "dist",
    "templates",
    "README.md",
    "LICENSE"
  ]
}
```

## 🎉 Congratulations!

Once published successfully, your package will be:
- ✅ Available via `npm install`
- ✅ Usable with `npx your-package-name`
- ✅ Discoverable on npmjs.com
- ✅ Part of the npm ecosystem

---

**Happy Publishing! 🚀**
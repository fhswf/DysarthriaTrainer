# Environment Configuration Guide

This guide explains how to configure environment variables for different deployment environments.

## 📁 Environment Files Overview

| File                 | Purpose                    | When Used                      | Committed to Git   |
| -------------------- | -------------------------- | ------------------------------ | ------------------ |
| `.env.example`       | Template and documentation | Reference for all environments | ✅ Yes             |
| `.env.development`   | Development settings       | `NODE_ENV=development`         | ✅ Yes             |
| `.env.staging`       | Staging/testing settings   | `NODE_ENV=staging`             | ✅ Yes             |
| `.env.production`    | Production settings        | `NODE_ENV=production`          | ✅ Yes             |
| `.env.local.example` | Local override template    | Copy to `.env.local`           | ✅ Yes             |
| `.env.local`         | Personal local overrides   | Always (highest priority)      | ❌ No (gitignored) |

## 🚀 Quick Setup

### For New Developers

1. **Copy the local environment template:**

   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` with your personal settings:**

   ```bash
   # Uncomment and modify variables you need
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_LOG_LEVEL=debug
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

### For Production Deployment

1. **Update production URLs in `.env.production`:**

   ```bash
   # Replace with your actual production API
   VITE_API_BASE_URL=https://api.yourapp.com
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

## 🔧 Configuration Priority

Vite loads environment files in this order (later files override earlier ones):

1. `.env` (if exists)
2. `.env.local` (always ignored by git)
3. `.env.[NODE_ENV]` (`.env.development`, `.env.staging`, `.env.production`)
4. `.env.[NODE_ENV].local` (always ignored by git)

## 🌍 Environment-Specific Features

### Development Environment

- **Mock Mode**: Enabled by default for frontend-only development
- **Debug Tools**: Full debugging capabilities enabled
- **Logging**: Verbose logging for troubleshooting
- **API Timeouts**: Longer timeouts for debugging
- **Hot Reload**: Configuration changes apply immediately

### Staging Environment

- **Real API**: Tests against staging backend
- **Limited Debug**: Some debugging tools for testing
- **Performance Testing**: Metrics collection enabled
- **Error Reporting**: Full error tracking for QA

### Production Environment

- **Optimized**: All debug features disabled
- **Security**: Minimal logging, secure defaults
- **Performance**: Optimized timeouts and caching
- **Monitoring**: Essential metrics only

## 🔑 Key Environment Variables

### Required Variables

| Variable            | Description          | Example                   |
| ------------------- | -------------------- | ------------------------- |
| `VITE_API_BASE_URL` | Backend API endpoint | `https://api.yourapp.com` |

### Feature Flags

| Variable                | Description            | Development | Staging | Production |
| ----------------------- | ---------------------- | ----------- | ------- | ---------- |
| `VITE_ENABLE_DEV_TOOLS` | Show debug panels      | `true`      | `true`  | `false`    |
| `VITE_ENABLE_MOCK_MODE` | Allow mock mode        | `true`      | `false` | `false`    |
| `VITE_ENABLE_LOGGING`   | Enable console logging | `true`      | `true`  | `false`    |

### Performance Settings

| Variable                  | Description           | Development | Staging | Production |
| ------------------------- | --------------------- | ----------- | ------- | ---------- |
| `VITE_API_TIMEOUT`        | Request timeout (ms)  | `30000`     | `20000` | `15000`    |
| `VITE_API_RETRY_ATTEMPTS` | Retry failed requests | `3`         | `3`     | `2`        |
| `VITE_LOG_LEVEL`          | Logging verbosity     | `debug`     | `info`  | `warn`     |

## 🛠️ Common Development Scenarios

### Scenario 1: Frontend Developer (No Backend Access)

```bash
# .env.local
VITE_ENABLE_MOCK_MODE=true
VITE_MOCK_DELAY=300
VITE_LOG_LEVEL=debug
```

### Scenario 2: Full-Stack Developer (Local Backend)

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_MOCK_MODE=false
VITE_LOG_LEVEL=debug
```

### Scenario 3: QA Testing (Error Scenarios)

```bash
# .env.local
VITE_MOCK_FAILURE_RATE=0.2
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEV_TOOLS=true
```

### Scenario 4: Performance Testing

```bash
# .env.local
VITE_ENABLE_METRICS=true
VITE_ENABLE_PERFORMANCE_PROFILING=true
VITE_API_TIMEOUT=5000
```

## 🔍 Debugging Environment Issues

### Check Current Configuration

```javascript
// In browser console or component
console.log("Environment:", import.meta.env.MODE);
console.log("API URL:", import.meta.env.VITE_API_BASE_URL);
console.log("Dev Tools:", import.meta.env.VITE_ENABLE_DEV_TOOLS);
```

### Verify Environment Loading

```bash
# Check which environment file is being used
npm run dev --debug

# Build and check production configuration
npm run build && npm run preview
```

### Common Issues

**Issue**: Changes to `.env` files not taking effect
**Solution**: Restart the development server (`Ctrl+C` then `npm run dev`)

**Issue**: Wrong API URL in production
**Solution**: Check `.env.production` and ensure correct `VITE_API_BASE_URL`

**Issue**: Mock mode not working
**Solution**: Verify `VITE_ENABLE_MOCK_MODE=true` and restart server

## 🔒 Security Best Practices

### ✅ Do's

- ✅ Use `VITE_` prefix for client-side variables
- ✅ Keep sensitive data on the server side
- ✅ Use different API URLs for each environment
- ✅ Disable debug features in production
- ✅ Use `.env.local` for personal overrides

### ❌ Don'ts

- ❌ Put secrets in environment files (they're built into the client)
- ❌ Commit `.env.local` files
- ❌ Use production credentials in development
- ❌ Enable debug tools in production
- ❌ Hardcode URLs in the source code

## 📋 Deployment Checklist

### Before Deploying to Production

- [ ] Update `VITE_API_BASE_URL` in `.env.production`
- [ ] Verify `VITE_ENABLE_DEV_TOOLS=false`
- [ ] Confirm `VITE_ENABLE_MOCK_MODE=false`
- [ ] Set appropriate `VITE_LOG_LEVEL=warn`
- [ ] Enable error reporting: `VITE_ERROR_REPORTING_ENABLED=true`
- [ ] Test build: `npm run build && npm run preview`
- [ ] Verify no console errors in built version

### Environment-Specific Deployment

```bash
# Development build
NODE_ENV=development npm run build

# Staging build
NODE_ENV=staging npm run build

# Production build
NODE_ENV=production npm run build
```

## 🎯 Integration with API Services

The environment variables work seamlessly with the [API Services system](./src/services/api-guide/README.md):

```typescript
// Automatic environment detection
import { apiClient } from "@/services/apiClient";

// API client automatically uses VITE_API_BASE_URL
const response = await apiClient.get("/users");

// Mock mode controlled by environment
import { mockService } from "@/services/mockService";

if (import.meta.env.VITE_ENABLE_MOCK_MODE === "true") {
  await mockService.enableMockMode();
}
```

For more details on API configuration, see the [Configuration Guide](./src/services/api-guide/configuration.md).

---

**Need help?** Check the [API Troubleshooting Guide](./src/services/api-guide/troubleshooting.md) for common environment-related issues.

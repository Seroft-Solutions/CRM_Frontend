# Docker Build Optimization Guide

This document outlines the optimizations implemented to improve Docker build performance and prevent timeout issues in CI/CD environments.

## Recent Optimizations

### 1. Dockerfile Improvements

- **Better Layer Caching**: Package files are copied before source code to improve layer caching
- **NPM Configuration**: Added timeout and retry configurations for better reliability in CI environments
- **Memory Optimization**: Increased Node.js memory limit for large builds
- **Build Flags**: Added CI-specific environment variables and build optimizations

### 2. GitHub Actions Cache Integration

- **GitHub Actions Cache**: Enabled `cache-from` and `cache-to` for BuildKit cache
- **Inline Cache**: Added `BUILDKIT_INLINE_CACHE=1` for better cross-build caching
- **Max Cache Mode**: Using `mode=max` to cache all layers

### 3. NPM Installation Optimizations

```dockerfile
# Install dependencies with optimizations for CI/CD environments
RUN npm --version && \
    node --version && \
    npm config set strict-ssl false && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm cache clean --force && \
    npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund
```

### 4. Build Environment Configuration

```dockerfile
# Build the application with TailwindCSS v4 support
ENV PATH=/app/node_modules/.bin:$PATH
ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Create cache directory and build with optimizations
RUN mkdir -p /tmp/lightningcss-cache && \
    echo "Starting TailwindCSS v4 build..." && \
    NODE_OPTIONS="--max-old-space-size=8192 --no-warnings" \
    TAILWIND_DISABLE_TOUCH=true \
    NEXT_PRIVATE_ALLOW_STANDALONE=1 \
    npm run build:docker || \
    (echo "Build failed, trying with fallback options..." && \
     NODE_OPTIONS="--max-old-space-size=4096" \
     NEXT_PRIVATE_ALLOW_STANDALONE=1 \
     npm run build)
```

#### Required package.json script:

```json
{
  "scripts": {
    "build:docker": "NODE_OPTIONS='--max-old-space-size=8192' NEXT_TELEMETRY_DISABLED=1 next build"
  }
}
```

## Key Benefits

1. **Faster Builds**: Layer caching reduces rebuild times
2. **Better Reliability**: Retry mechanisms handle network issues
3. **Memory Efficiency**: Optimized memory usage for large builds
4. **CI/CD Optimized**: Specific configurations for CI environments

## Troubleshooting

### Build Timeouts

If builds are still timing out:

1. Check network connectivity to npm registry
2. Verify GitHub Actions cache permissions
3. Consider using npm mirror or private registry

### Memory Issues

If you encounter out-of-memory errors:

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=8192"
```

### TailwindCSS v4 Build Failures

If you encounter CSS compilation errors or webpack failures with TailwindCSS v4:

1. **Ensure build:docker script exists** in package.json:
   ```json
   "build:docker": "NODE_OPTIONS='--max-old-space-size=8192' NEXT_TELEMETRY_DISABLED=1 next build"
   ```

2. **Use proper PostCSS configuration** in `postcss.config.mjs`:
   ```javascript
   const config = {
     plugins: {
       '@tailwindcss/postcss': {},
     },
   };
   export default config;
   ```

3. **Add cache directory** for Lightning CSS:
   ```dockerfile
   RUN mkdir -p /tmp/lightningcss-cache
   ```

4. **Environment variables for stable builds**:
   ```dockerfile
   ENV TAILWIND_DISABLE_TOUCH=true
   ENV NEXT_TELEMETRY_DISABLED=1
   ENV NODE_ENV=production
   ```

### CSS Import Errors

For webpack CSS loader errors with `globals.css`:

- Ensure PostCSS plugins are configured as objects, not arrays
- Verify TailwindCSS v4 syntax: `@import 'tailwindcss';`
- Check that all CSS custom properties are properly defined

### Native Dependencies

For packages requiring compilation:

```dockerfile
# Add before npm install if needed
RUN apk add --no-cache python3 make gcc g++ libc-dev
```

## Monitoring Build Performance

Track build times in GitHub Actions to identify performance regressions:

- Monitor "Install dependencies" step duration
- Watch for cache hit/miss ratios
- Check multi-platform build times

## Future Optimizations

1. **Multi-stage optimization**: Consider separating dependency installation and build stages
2. **BuildKit features**: Explore additional BuildKit optimizations
3. **Registry caching**: Implement Docker registry caching for base images
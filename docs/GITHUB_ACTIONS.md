# GitHub Actions Workflows

This repository uses simplified GitHub Actions workflows for Docker builds and release management.

## Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
- **Triggers**: Push to main/develop branches, pull requests
- **Features**:
  - Code quality checks (linting, formatting, import validation)
  - Security scanning with CodeQL
  - Multi-environment builds (development/production)
  - Docker build testing

### 2. Docker Build & Publish (`.github/workflows/docker-build-publish.yml`)
- **Triggers**: Push to main/master/develop, tags, manual dispatch
- **Features**:
  - Automatic environment detection (development for `develop` branch, production for `main`)
  - Manual environment selection via workflow dispatch
  - Docker image building with proper tags
  - Environment-specific configuration

### 3. Release Management (`.github/workflows/release.yml`)
- **Triggers**: Manual dispatch only
- **Features**:
  - Semantic versioning (major/minor/patch/prerelease)
  - Automated changelog generation
  - GitHub release creation
  - Multi-platform Docker image builds
  - Release notifications

## Environment Configuration

### Development (.env)
Used for local development and development builds:
```bash
AUTH_URL=http://localhost:3000
AUTH_KEYCLOAK_ISSUER=http://localhost:9080/realms/crm
NEXT_PUBLIC_SPRING_API_URL=http://localhost:8080
```

### Production (.env.production)
Used for production builds and releases:
```bash
AUTH_URL=https://your-production-domain.com
AUTH_KEYCLOAK_ISSUER=https://your-keycloak-production-domain.com/realms/crm
NEXT_PUBLIC_SPRING_API_URL=https://your-production-api-domain.com
```

**Note**: Update the production URLs in `.env.production` to match your actual production environment.

## Docker Images

Images are published to Docker Hub as `syedus06/crm-frontend` with tags:
- `latest` - Latest production build from main branch
- `develop-dev` - Latest development build from develop branch
- `v1.0.0` - Specific version tags from releases

## Usage

### Creating a Release
1. Go to Actions → Release Management
2. Click "Run workflow"
3. Select release type (major/minor/patch/prerelease)
4. Optionally specify a custom version
5. The workflow will:
   - Create a new version tag
   - Generate changelog
   - Build and publish Docker images
   - Create GitHub release

### Manual Docker Build
1. Go to Actions → Build and Publish to Docker Hub
2. Click "Run workflow"
3. Select environment (development/production)
4. The workflow will build and publish the appropriate Docker image

## Required Secrets

Configure these secrets in your GitHub repository settings:
- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub password or access token

## Quick Start

1. Update production URLs in `.env.production`
2. Configure Docker Hub secrets
3. Push to `develop` branch for development builds
4. Push to `main` branch for production builds
5. Use Release Management workflow for versioned releases
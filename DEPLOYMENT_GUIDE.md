# Release Management & Deployment Guide

This guide explains how to create releases and deploy the CRM Frontend
application using tagged Docker images.

## Release Process

### Creating a New Release

1. **Navigate to GitHub Actions**
   - Go to your repository on GitHub
   - Click on the "Actions" tab
   - Select "Release Management" workflow

2. **Trigger a Release**
   - Click "Run workflow" button
   - Choose your release type:
     - `major` - For breaking changes (1.0.0 → 2.0.0)
     - `minor` - For new features (1.0.0 → 1.1.0)
     - `patch` - For bug fixes (1.0.0 → 1.0.1)
     - `prerelease` - For beta versions (1.0.0 → 1.0.1-beta.20241201123456)
   - Or specify a custom version in the "Custom version" field

3. **What Happens Automatically**
   - Version is calculated and validated
   - Code quality checks are performed
   - GitHub release is created with changelog
   - Multi-platform Docker image is built and tagged
   - Release artifacts are generated

### Docker Image Tags

For each release, the following Docker images are created:

- `syedus06/crm-frontend:v2.0.0` - Specific version tag
- `syedus06/crm-frontend:2.0.0` - Version without 'v' prefix
- `syedus06/crm-frontend:latest` - Latest production release (not for
  pre-releases)

## Deployment

### Using Docker Compose (Recommended)

#### Development Deployment

```bash
# Use the default docker-compose.yml
docker-compose up -d
```

#### Production Deployment

```bash
# Specify the version you want to deploy
export CRM_VERSION=2.0.0
docker-compose -f docker-compose.prod.yml up -d
```

#### Deploy Specific Version

```bash
# Deploy a specific tagged version
export CRM_VERSION=1.5.2
docker-compose -f docker-compose.prod.yml up -d
```

### Using Docker Run

#### Latest Version

```bash
docker run -d \
  --name crm-frontend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  syedus06/crm-frontend:latest
```

#### Specific Version

```bash
docker run -d \
  --name crm-frontend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  syedus06/crm-frontend:2.0.0
```

### Environment Configuration

The application uses different environment files:

- **Development**: `.env` (localhost URLs)
- **Production**: `.env.production` (production URLs)

Make sure to update `.env.production` with your actual production URLs before
building production images.

## Version Management

### Current Version

Check the current version in `package.json`:

```bash
node -p "require('./package.json').version"
```

### Version History

View all releases:

```bash
git tag -l
```

### Rollback to Previous Version

```bash
# Deploy previous version
export CRM_VERSION=1.9.0
docker-compose -f docker-compose.prod.yml up -d
```

## Health Checks

The application includes health check endpoints:

- **Health Check**: `http://localhost:3000/api/health`
- **Ready Check**: `http://localhost:3000/api/ready`

## Troubleshooting

### Check Application Logs

```bash
# Docker Compose
docker-compose logs crm-frontend

# Docker Run
docker logs crm-frontend
```

### Check Container Status

```bash
docker ps
docker inspect crm-frontend
```

### Update to Latest Version

```bash
# Pull latest image
docker pull syedus06/crm-frontend:latest

# Restart with new image
docker-compose -f docker-compose.prod.yml up -d
```

## CI/CD Integration

### Automatic Builds

- **Development**: Push to `develop` branch triggers development build
- **Production**: Push to `main` branch triggers production build
- **Release**: Manual release workflow creates tagged versions

### Manual Builds

Use the "Build and Publish to Docker Hub" workflow to manually build images for
specific environments.

## Security Notes

1. **Environment Variables**: Never commit production secrets to version control
2. **SSL/TLS**: Use nginx or similar reverse proxy for SSL termination in
   production
3. **Network Security**: Use Docker networks to isolate services
4. **Updates**: Regularly update to latest versions for security patches

## Examples

### Creating Version 2.0.0

1. Go to Actions → Release Management
2. Click "Run workflow"
3. Select "major" release type
4. The system creates v2.0.0 and builds `syedus06/crm-frontend:2.0.0`

### Deploying Version 2.0.0

```bash
export CRM_VERSION=2.0.0
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

This ensures you're always deploying the exact version you released, providing
consistency and traceability in your deployment process.

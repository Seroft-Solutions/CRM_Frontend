# CRM Frontend Release Management

This repository contains a comprehensive GitHub Actions workflow system for managing releases, deployments, and quality assurance for the CRM Frontend application.

## 🚀 Workflow Overview

Our release management system consists of multiple specialized workflows designed to handle different aspects of the software delivery lifecycle:

### Core Workflows

1. **[CI/CD Pipeline](.github/workflows/ci-cd.yml)** - Main continuous integration and deployment pipeline
2. **[Development Deployment](.github/workflows/deploy-dev.yml)** - Automated deployment to development environment
3. **[Production Deployment](.github/workflows/deploy-prod.yml)** - Controlled deployment to production environment
4. **[Release Management](.github/workflows/release.yml)** - Automated release creation with versioning
5. **[Quality & Security Checks](.github/workflows/quality-check.yml)** - Comprehensive security and code quality scanning
6. **[Hotfix Deployment](.github/workflows/hotfix.yml)** - Emergency hotfix deployment procedures
7. **[Environment Configuration](.github/workflows/environment-config.yml)** - Environment-specific configuration management

## 📋 Workflow Details

### CI/CD Pipeline
**File**: `.github/workflows/ci-cd.yml`
**Triggers**: Push to main/develop, Pull requests
**Purpose**: Main build, test, and quality assurance pipeline

**Features**:
- Multi-environment builds (development/production)
- Code quality checks (linting, formatting)
- Security scanning with CodeQL
- Docker image building
- Automatic deployment triggering

### Development Deployment
**File**: `.github/workflows/deploy-dev.yml`
**Triggers**: Push to develop branch, Manual dispatch
**Purpose**: Automatic deployment to development environment

**Features**:
- Pre-deployment validation
- Docker image building and pushing
- Development environment deployment
- Health checks and monitoring
- Team notifications

### Production Deployment
**File**: `.github/workflows/deploy-prod.yml`
**Triggers**: Manual dispatch, Release published
**Purpose**: Controlled production deployment with safeguards

**Features**:
- Version validation
- Comprehensive pre-deployment testing
- Staging deployment option
- Production deployment with approvals
- Rollback preparation
- Post-deployment monitoring

### Release Management
**File**: `.github/workflows/release.yml`
**Triggers**: Manual dispatch
**Purpose**: Automated release creation with proper versioning

**Features**:
- Semantic versioning (major.minor.patch)
- Pre-release support
- Automated changelog generation
- GitHub release creation
- Docker image tagging
- Production deployment triggering

### Quality & Security Checks
**File**: `.github/workflows/quality-check.yml`
**Triggers**: Schedule (daily), Manual dispatch, Push to main/develop
**Purpose**: Comprehensive security and quality monitoring

**Features**:
- Security vulnerability scanning
- Dependency analysis and updates
- Code quality metrics
- Performance analysis
- License compliance checking
- Automated issue creation for problems

### Hotfix Deployment
**File**: `.github/workflows/hotfix.yml`
**Triggers**: Manual dispatch
**Purpose**: Emergency hotfix deployment procedures

**Features**:
- Urgency-based workflows
- Skip testing for critical issues
- Staging verification
- Production approval process
- Rollback procedures
- Stakeholder notifications

### Environment Configuration
**File**: `.github/workflows/environment-config.yml`
**Triggers**: Manual dispatch
**Purpose**: Environment-specific configuration management

**Features**:
- Configuration synchronization
- Secret management
- Configuration validation
- Backup and restore capabilities
- Dry-run preview mode

## 🔧 Setup Instructions

### 1. Required Secrets

Configure the following secrets in your GitHub repository:

```
DOCKER_USERNAME          # Docker Hub username
DOCKER_PASSWORD          # Docker Hub password or access token
NEXTAUTH_SECRET          # NextAuth.js secret for authentication
KEYCLOAK_CLIENT_SECRET   # Keycloak client secret
DATABASE_URL             # Database connection string
REDIS_URL                # Redis connection string
SENTRY_DSN               # Sentry DSN for error monitoring
```

### 2. Environment Protection Rules

Set up environment protection rules in GitHub:

- **development**: No restrictions
- **staging**: Require pull request reviews
- **production**: Require manual approval from administrators
- **production-approval**: Require manual approval for hotfixes

### 3. Branch Protection

Configure branch protection rules:

- **main**: Require pull request reviews, require status checks
- **develop**: Require status checks

## 🎯 Usage Guide

### Creating a Release

1. Navigate to **Actions** → **Release Management**
2. Click **Run workflow**
3. Select release type:
   - `major`: Breaking changes (1.0.0 → 2.0.0)
   - `minor`: New features (1.0.0 → 1.1.0)
   - `patch`: Bug fixes (1.0.0 → 1.0.1)
   - `prerelease`: Beta versions (1.0.0 → 1.0.1-beta.timestamp)
4. Optionally specify a custom version
5. Choose whether to create a pre-release

### Deploying to Production

1. **Automatic**: Production deployment is triggered when a release is published
2. **Manual**: Navigate to **Actions** → **Deploy to Production**
   - Enter the version/tag to deploy
   - Select target environment (production/staging)
   - Choose whether to skip tests (emergency only)

### Development Deployment

Development deployment happens automatically when code is pushed to the `develop` branch. You can also trigger it manually:

1. Navigate to **Actions** → **Deploy to Development**
2. Click **Run workflow**
3. Optionally force deployment even if no changes detected

### Emergency Hotfix

For critical production issues:

1. Create a hotfix branch from main
2. Navigate to **Actions** → **Hotfix Deployment**
3. Fill in the required information:
   - Hotfix branch name
   - Production urgency level
   - Description of the issue
   - Rollback plan
4. For critical issues, you can skip comprehensive tests

### Quality Checks

Quality checks run automatically daily and on certain pushes. To run manually:

1. Navigate to **Actions** → **Quality & Security Checks**
2. Select check type:
   - `all`: Run all checks
   - `security`: Security vulnerabilities only
   - `dependencies`: Dependency analysis only
   - `code-quality`: Code quality metrics only
   - `performance`: Performance analysis only

### Environment Configuration

To manage environment configurations:

1. Navigate to **Actions** → **Environment Configuration**
2. Select target environment and action:
   - `sync-config`: Synchronize configuration files
   - `update-secrets`: Update environment secrets
   - `validate-config`: Validate existing configuration
   - `backup-config`: Create configuration backup
   - `restore-config`: Restore from backup
3. Enable dry-run to preview changes before applying

## 📊 Monitoring and Notifications

### Build Status

Monitor build status through:
- GitHub Actions dashboard
- Repository README badges
- Branch protection status checks

### Notifications

The workflows include notification systems for:
- Successful deployments
- Failed deployments
- Security vulnerabilities
- Quality issues

Configure notification channels by updating the workflow files with your:
- Slack webhook URLs
- Email addresses
- Microsoft Teams webhooks
- Discord webhooks

### Monitoring Integration

The workflows support integration with:
- **Sentry**: Error tracking and performance monitoring
- **DataDog**: Application and infrastructure monitoring
- **New Relic**: Application performance monitoring
- **PagerDuty**: Incident management

## 🔒 Security Considerations

### Secret Management

- All sensitive data is stored in GitHub Secrets
- Secrets are environment-scoped where applicable
- Production secrets require elevated permissions

### Access Control

- Production deployments require manual approval
- Hotfix deployments have urgency-based controls
- Environment configuration changes are logged

### Security Scanning

- Daily security vulnerability scans
- Dependency vulnerability monitoring
- CodeQL static analysis
- License compliance checking

## 🛠️ Customization

### Modifying Workflows

Each workflow is designed to be modular and customizable:

1. **Environment Variables**: Update the `env` section in each workflow
2. **Build Steps**: Modify the build and test steps as needed
3. **Deployment Targets**: Update deployment commands for your infrastructure
4. **Notification Channels**: Configure notification integrations

### Adding New Environments

To add a new environment (e.g., `staging`):

1. Create environment protection rules in GitHub
2. Update workflow files to include the new environment
3. Create environment-specific configuration
4. Update Docker image tags and deployment scripts

### Infrastructure Integration

The workflows include placeholder commands for common infrastructure:

- **Docker Compose**: Local and development deployments
- **Kubernetes**: Production deployments with manifests
- **AWS/Azure/GCP**: Cloud provider integrations
- **Terraform**: Infrastructure as code

## 📈 Best Practices

### Release Strategy

1. **Feature Development**: Use feature branches merged to `develop`
2. **Release Preparation**: Create releases from `main` branch
3. **Hotfixes**: Create hotfix branches from `main` for critical issues
4. **Versioning**: Follow semantic versioning principles

### Deployment Strategy

1. **Development**: Automatic deployment on push to `develop`
2. **Staging**: Manual deployment for testing
3. **Production**: Release-based deployment with approvals
4. **Rollback**: Always have a rollback plan for production changes

### Quality Assurance

1. **Continuous Integration**: All code changes go through CI/CD
2. **Security First**: Regular security scans and updates
3. **Performance Monitoring**: Track bundle size and performance metrics
4. **Code Quality**: Maintain consistent linting and formatting

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**: Check Node.js version compatibility and dependencies
2. **Docker Issues**: Verify Docker Hub credentials and image names
3. **Deployment Failures**: Check environment configurations and permissions
4. **Security Scan Failures**: Review and update vulnerable dependencies

### Getting Help

1. Check workflow logs in the GitHub Actions tab
2. Review the workflow files for configuration issues
3. Consult the GitHub Actions documentation
4. Contact the development team for environment-specific issues

## 📝 Changelog

### v1.0.0 - Initial Release
- Complete CI/CD pipeline implementation
- Multi-environment deployment workflows
- Automated release management
- Comprehensive quality and security checks
- Emergency hotfix procedures
- Environment configuration management

---

**Maintained by**: Development Team  
**Last Updated**: 2024-08-09  
**License**: MIT
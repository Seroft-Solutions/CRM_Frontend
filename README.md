# CRM Frontend

A modern, responsive CRM frontend application built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check formatting without fixing
- `npm run code-quality` - Run lint and format checks
- `npm run code-quality:fix` - Fix both lint and format issues

### API & Code Generation
- `npm run sync` - Full sync: fetch OpenAPI, generate types, sync JHipster, generate Next.js entities
- `npm run openapi:fetch` - Fetch OpenAPI spec from backend (localhost:8080)
- `npm run openapi:generate` - Generate TypeScript API clients from OpenAPI
- `npm run generate-nextjs` - Generate Next.js entities and components
- `npm run sync:jhipster` - Sync JHipster entity definitions from backend

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: NextAuth.js v5 with Keycloak integration
- **Forms**: React Hook Form with Zod validation
- **API Generation**: Orval for TypeScript client generation from OpenAPI

### Key Features
- **Multi-tenant**: Organization-based data isolation
- **Meeting Scheduler**: Integrated availability and booking system
- **Call Management**: Call tracking with remarks and meetings
- **Geographic Hierarchy**: Cascading state/district/city filters
- **Draft System**: Form data persistence across sessions

## 🔧 Development Workflow

### Code Generation System
The project uses a custom code generator that creates:
- CRUD pages with consistent routing
- Form components with validation
- Table components with filtering/sorting
- Server actions for API integration
- Toast notifications

### Authentication & Authorization
- **Keycloak**: Primary identity provider
- **NextAuth.js**: Session management and middleware
- **Organization Context**: Tenant isolation
- **RBAC System**: Permission-based access control

## 🚀 Release Management

This project includes a comprehensive GitHub Actions workflow system for automated releases, deployments, and quality assurance.

### Available Workflows

1. **CI/CD Pipeline** - Main build, test, and quality pipeline
2. **Development Deployment** - Auto-deploy to dev environment
3. **Production Deployment** - Controlled production deployment
4. **Release Management** - Automated release creation with versioning
5. **Quality & Security Checks** - Comprehensive scanning and monitoring
6. **Hotfix Deployment** - Emergency deployment procedures
7. **Environment Configuration** - Configuration management

### Quick Release Guide

**Creating a Release:**
1. Go to Actions → Release Management
2. Select release type (major/minor/patch/prerelease)
3. Workflow handles versioning, changelog, and deployment

**Emergency Hotfix:**
1. Create hotfix branch from main
2. Go to Actions → Hotfix Deployment
3. Specify urgency level and rollback plan

📖 **[Complete Release Management Documentation](docs/RELEASE_MANAGEMENT.md)**

## 🔒 Security

- **Environment-based secrets management**
- **Daily security vulnerability scanning**
- **Dependency monitoring and updates**
- **CodeQL static analysis**
- **License compliance checking**

## 📁 Project Structure

```
├── .github/workflows/     # GitHub Actions workflows
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── core/             # Core functionality
│   │   ├── api/          # Auto-generated API clients
│   │   └── auth/         # Authentication system
│   └── components/       # Reusable UI components
├── codgen/               # Code generation tools
├── docs/                 # Documentation
├── openapi/              # OpenAPI specifications
└── public/               # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Run `npm run code-quality` before committing
- Ensure all tests pass
- Update documentation as needed

## 📚 Documentation

- [Release Management](docs/RELEASE_MANAGEMENT.md) - Complete guide to our CI/CD workflows
- [IntelliJ Setup](INTELLIJ_SETUP.md) - IDE configuration
- [Meeting Integration](MEETING_INTEGRATION_IMPLEMENTATION.md) - Meeting system implementation
- [Claude AI Guidelines](CLAUDE.md) - AI assistant development guidelines

## 🌐 Environment Variables

Required environment variables:

```env
# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-here

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ISSUER=https://auth.example.com/realms/crm
```

## 🐳 Docker Support

```bash
# Build Docker image
docker build -t crm-frontend .

# Run container
docker run -p 3000:3000 crm-frontend
```

The project includes production-ready Docker configurations with multi-stage builds and health checks.

## 📊 Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Bundle Analysis**: Automated bundle size monitoring
- **Security Scanning**: Daily vulnerability assessments
- **Code Quality**: Continuous quality metrics tracking

## 🆘 Support

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Documentation**: Check the docs/ directory for detailed guides
- **Workflows**: Monitor GitHub Actions for deployment status

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the Development Team**
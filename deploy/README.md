# Frontend Deployment System

This directory contains the deployment configuration and scripts for the CRM frontend application.

## Directory Structure

- `docker/` - Docker Compose files for each environment
- `env/` - Environment configuration files
- `scripts/` - Deployment and utility scripts

## Deployment Process

The deployment system is designed to handle multiple environments:

1. **Development** - Automatically deployed from the `dev` branch
2. **QA** - Automatically deployed from the `qa` branch
3. **Production** - Automatically deployed from the `main` branch

## Docker Compose Files

Each environment has its own Docker Compose configuration:

- `docker/docker-compose.dev.yml` - Development environment
- `docker/docker-compose.qa.yml` - QA environment
- `docker/docker-compose.prod.yml` - Production environment
- `docker/docker-compose.local.yml` - Local development (for reference)

## Environment Files

Environment-specific variables are stored in:

- `env/.env.dev` - Development settings
- `env/.env.qa` - QA settings
- `env/.env.prod` - Production settings
- `env/.env.local` - Local development (for reference)

## Deployment Scripts

- `scripts/deploy.sh` - Main deployment script for all environments
- `scripts/setup-directories.sh` - Script to set up required directory structure

## Port Allocation

To avoid conflicts, each environment uses different port mappings:

| Environment | Port |
|-------------|------|
| Local       | 3000 |
| Development | 3000 |
| QA          | 3010 |
| Production  | 3020 |

## VPS Directory Structure

The deployment creates a standardized directory structure on the VPS:

```
/home/ubuntu/CRM/
├── dev/
│   ├── frontend/
│   │   ├── docker-compose.yml
│   │   ├── .env
│   │   ├── deploy.sh
│   │   └── logs/
│   └── data/
│       └── frontend/
├── qa/
│   ├── ...same structure as above
└── prod/
    ├── ...same structure as above
```

## Manual Deployment

To manually deploy to a specific environment:

```bash
# SSH to the VPS
ssh ubuntu@175.111.97.58 -p 50489

# Navigate to the environment directory
cd /home/ubuntu/CRM/dev/frontend

# Run the deployment script
./deploy.sh dev
```

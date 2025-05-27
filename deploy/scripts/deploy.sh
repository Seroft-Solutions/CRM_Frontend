#!/bin/bash
# Frontend deployment script - Enhanced with improved container management
# Handles the complete deployment process for the frontend application

# Check if environment parameter is provided
if [ -z "$1" ]; then
  echo "Error: Environment not specified"
  echo "Usage: ./deploy.sh <environment>"
  echo "Example: ./deploy.sh dev"
  exit 1
fi

# Set environment variables
ENV="$1"
CRM_BASE="/home/ubuntu/CRM"
ENV_DIR="$CRM_BASE/$ENV"
FE_DIR="$ENV_DIR/frontend"
ENV_FILE="$FE_DIR/.env"
DOCKER_COMPOSE_FILE="$FE_DIR/docker-compose.yml"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Validate environment
if [ "$ENV" != "dev" ] && [ "$ENV" != "qa" ] && [ "$ENV" != "prod" ]; then
  echo "Error: Invalid environment. Must be one of: dev, qa, prod"
  exit 1
fi

echo "Starting frontend deployment for $ENV environment..."

# Set up directory structure
echo "Setting up directory structure..."
mkdir -p "$FE_DIR"
mkdir -p "$FE_DIR/logs"
mkdir -p "$ENV_DIR/data/frontend"

# Ensure proper permissions
chown -R ubuntu:ubuntu "$FE_DIR" 2>/dev/null || true
chown -R ubuntu:ubuntu "$FE_DIR/logs" 2>/dev/null || true
chown -R ubuntu:ubuntu "$ENV_DIR/data/frontend" 2>/dev/null || true

# Verify env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: Environment file not found: $ENV_FILE"
  echo "Checking if env file was provided in deployment..."
  ls -la "$FE_DIR" | grep ".env"
  if [ $? -ne 0 ]; then
    echo "Error: No environment file found. Deployment cannot proceed."
    exit 1
  fi
fi

# Verify Docker Compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
  echo "Error: Docker Compose file not found: $DOCKER_COMPOSE_FILE"
  exit 1
fi

# Docker login if credentials are provided
if [ ! -z "$DOCKER_USERNAME" ] && [ ! -z "$DOCKER_PASSWORD" ]; then
  echo "Logging in to Docker registry..."
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
fi

# Backup any log files before deployment
echo "Backing up any existing log files..."
if [ -d "$FE_DIR/logs" ] && [ "$(ls -A $FE_DIR/logs)" ]; then
  LOG_BACKUP_DIR="$FE_DIR/logs/backup_${TIMESTAMP}"
  mkdir -p "$LOG_BACKUP_DIR"
  cp -r "$FE_DIR/logs"/*.log "$LOG_BACKUP_DIR"/ 2>/dev/null || echo "No log files found to back up"
fi

# Set port based on environment
if [ "$ENV" == "dev" ]; then
  export FRONTEND_PORT=3000
elif [ "$ENV" == "qa" ]; then
  export FRONTEND_PORT=3010
elif [ "$ENV" == "prod" ]; then
  export FRONTEND_PORT=3020
fi

# Deploy
echo "Deploying frontend for $ENV environment..."
cd "$FE_DIR"

# Check if containers are already running
CONTAINERS_RUNNING=$(docker compose -f docker-compose.yml ps -q 2>/dev/null | wc -l)

if [ "$CONTAINERS_RUNNING" -gt 0 ]; then
  echo "Detected running containers. Stopping them gracefully first..."
  # Stop containers gracefully with a timeout
  echo "Gracefully stopping containers (30 second timeout)..."
  docker compose -f docker-compose.yml stop -t 30 || true
  
  # Take down containers
  echo "Taking down containers..."
  docker compose -f docker-compose.yml down --remove-orphans || true
  
  echo "Existing containers gracefully stopped."
else
  echo "No existing containers detected."
fi

# Pull latest images
echo "Pulling latest images..."
docker compose -f docker-compose.yml pull

# Start services with the correct environment variables
echo "Starting frontend service..."
FRONTEND_PORT=$FRONTEND_PORT docker compose -f docker-compose.yml up -d

# Verify deployment if not in CI mode
if [ "$CI" != "true" ]; then
  echo "Verifying deployment..."
  max_attempts=10
  counter=0
  
  while [ $counter -lt $max_attempts ]; do
    if docker ps | grep -q "crm-frontend-$ENV"; then
      echo "Frontend container is running!"
      break
    fi
    counter=$((counter + 1))
    if [ $counter -eq $max_attempts ]; then
      echo "Frontend failed to start after $max_attempts attempts"
      docker compose -f docker-compose.yml logs
      exit 1
    fi
    echo "Attempt $counter/$max_attempts: Frontend not ready yet..."
    sleep 3
  done
  
  echo "Frontend deployment for $ENV environment completed successfully!"
else
  echo "CI mode: Skipping thorough deployment verification."
  # Basic check even in CI mode
  if docker ps | grep -q "crm-frontend-$ENV"; then
    echo "Frontend container is running!"
  else
    echo "Warning: Frontend container doesn't appear to be running."
    docker compose -f docker-compose.yml logs
  fi
fi

# Display access URL
if [ "$ENV" == "dev" ]; then
  echo "Frontend is now accessible at https://dev.crmcup.com"
elif [ "$ENV" == "qa" ]; then
  echo "Frontend is now accessible at https://qa.crmcup.com"
elif [ "$ENV" == "prod" ]; then
  echo "Frontend is now accessible at https://www.crmcup.com"
fi

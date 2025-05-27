#!/bin/bash
# Frontend directory setup script
# Creates the necessary directory structure on the VPS for frontend deployment

# Check if environment parameter is provided
if [ -z "$1" ]; then
  echo "Error: Environment not specified"
  echo "Usage: ./setup-directories.sh <environment>"
  echo "Example: ./setup-directories.sh dev"
  exit 1
fi

# Set environment variables
ENV="$1"
CRM_BASE="/home/ubuntu/CRM"
ENV_DIR="$CRM_BASE/$ENV"
FE_DIR="$ENV_DIR/frontend"
FE_LOGS_DIR="$FE_DIR/logs"
FE_DATA_DIR="$ENV_DIR/data/frontend"

echo "Setting up directory structure for frontend in $ENV environment..."

# Create main frontend directories
mkdir -p $FE_DIR
mkdir -p $FE_LOGS_DIR
mkdir -p $FE_DATA_DIR

# Set proper permissions
chown -R ubuntu:ubuntu $FE_DIR
chown -R ubuntu:ubuntu $FE_LOGS_DIR
chown -R ubuntu:ubuntu $FE_DATA_DIR

echo "Frontend directory structure setup complete for $ENV environment."
echo "Created:"
echo "  - $FE_DIR"
echo "  - $FE_LOGS_DIR"
echo "  - $FE_DATA_DIR"

#!/bin/bash

# Validate Terraform configurations
# Runs multiple checks to ensure quality and security

set -e

TERRAFORM_DIR="terraform"

echo "[INFO] Running Terraform validation checks..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "[ERROR] Terraform is not installed"
    exit 1
fi

# Format check
echo "[INFO] Checking Terraform formatting..."
terraform fmt -check -recursive "$TERRAFORM_DIR" || {
    echo "[WARNING] Terraform files need formatting. Run: terraform fmt -recursive $TERRAFORM_DIR"
}

# Validate all environments
for ENV in dev prod; do
    echo "[INFO] Validating $ENV environment..."
    cd "$TERRAFORM_DIR/environments/$ENV"
    terraform init -backend=false > /dev/null
    terraform validate
    cd - > /dev/null
done

echo "[SUCCESS] All validation checks passed!"

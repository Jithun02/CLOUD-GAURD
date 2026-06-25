# AWS DevOps Project Makefile
# Convenient commands for managing the infrastructure

.PHONY: help init validate plan apply destroy fmt clean test security-check cost-estimate doc

# Default target
help:
	@echo "AWS DevOps Infrastructure Management"
	@echo "===================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  make validate           - Validate Terraform configuration"
	@echo "  make fmt                - Format Terraform files"
	@echo "  make plan-dev           - Plan changes for dev environment"
	@echo "  make apply-dev          - Apply changes to dev environment"
	@echo "  make destroy-dev        - Destroy dev environment"
	@echo ""
	@echo "Production Commands:"
	@echo "  make plan-prod          - Plan changes for prod environment"
	@echo "  make apply-prod         - Apply changes to prod environment (requires confirmation)"
	@echo "  make destroy-prod       - Destroy prod environment (requires confirmation)"
	@echo ""
	@echo "Infrastructure Commands:"
	@echo "  make setup              - Setup Terraform backend infrastructure"
	@echo "  make init-dev           - Initialize dev environment"
	@echo "  make init-prod          - Initialize prod environment"
	@echo ""
	@echo "Quality & Security:"
	@echo "  make security-check     - Run security checks"
	@echo "  make cost-estimate      - Estimate infrastructure costs"
	@echo "  make clean              - Clean temporary files"
	@echo ""
	@echo "Documentation:"
	@echo "  make doc                - Generate documentation"

# Setup backend infrastructure
setup:
	@echo "Setting up Terraform backend infrastructure..."
	./scripts/setup-infrastructure.sh
	@echo "✓ Backend setup completed"

# Initialize environments
init-dev:
	@echo "Initializing development environment..."
	cd terraform/environments/dev && terraform init

init-prod:
	@echo "Initializing production environment..."
	cd terraform/environments/prod && terraform init

# Format Terraform files
fmt:
	@echo "Formatting Terraform files..."
	terraform fmt -recursive terraform/
	@echo "✓ Formatting completed"

# Validate configuration
validate:
	@echo "Validating Terraform configuration..."
	./scripts/validate.sh
	@echo "✓ Validation completed"

# Development environment
plan-dev: init-dev
	@echo "Planning changes for development environment..."
	cd terraform/environments/dev && terraform plan -out=tfplan

apply-dev: init-dev
	@echo "Applying changes to development environment..."
	cd terraform/environments/dev && terraform apply

destroy-dev: init-dev
	@echo "WARNING: This will destroy the development environment!"
	@read -p "Type 'dev' to confirm: " confirm; \
	if [ "$$confirm" = "dev" ]; then \
		cd terraform/environments/dev && terraform destroy; \
	else \
		echo "Destroy cancelled"; \
	fi

# Production environment
plan-prod: init-prod
	@echo "Planning changes for production environment..."
	cd terraform/environments/prod && terraform plan -out=tfplan

apply-prod: init-prod
	@echo "WARNING: This will modify the production environment!"
	@read -p "Type 'prod' to confirm: " confirm; \
	if [ "$$confirm" = "prod" ]; then \
		cd terraform/environments/prod && terraform apply; \
	else \
		echo "Apply cancelled"; \
	fi

destroy-prod: init-prod
	@echo "WARNING: This will DESTROY the production environment!"
	@read -p "Type 'prod' to confirm: " confirm; \
	if [ "$$confirm" = "prod" ]; then \
		cd terraform/environments/prod && terraform destroy; \
	else \
		echo "Destroy cancelled"; \
	fi

# Security checks
security-check:
	@echo "Running security checks..."
	@which tflint > /dev/null || (echo "Installing TFLint..." && brew install tflint)
	cd terraform && tflint --recursive
	@echo "✓ Security checks completed"

# Cost estimation
cost-estimate:
	@echo "Estimating infrastructure costs..."
	@which infracost > /dev/null || (echo "Installing Infracost..." && brew install infracost)
	infracost breakdown --path terraform/environments/dev --format table
	@echo ""
	infracost breakdown --path terraform/environments/prod --format table

# Show outputs
outputs-dev:
	@echo "Development environment outputs:"
	cd terraform/environments/dev && terraform output -json | jq .

outputs-prod:
	@echo "Production environment outputs:"
	cd terraform/environments/prod && terraform output -json | jq .

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	find terraform -name "tfplan" -delete
	find terraform -name ".terraform.lock.hcl" -delete
	find terraform -type d -name ".terraform" -exec rm -rf {} + 2>/dev/null || true
	@echo "✓ Cleanup completed"

# Generate documentation
doc:
	@echo "Generating documentation..."
	@echo "Documentation already available in docs/ directory"
	@echo "  - README.md"
	@echo "  - ARCHITECTURE.md"
	@echo "  - GETTING_STARTED.md"

# Show environment info
info:
	@echo "AWS Account Information:"
	@aws sts get-caller-identity
	@echo ""
	@echo "Terraform Version:"
	@terraform --version

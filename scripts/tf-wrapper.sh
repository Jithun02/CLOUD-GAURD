#!/bin/bash

# Terraform wrapper script for enhanced functionality
# Usage: ./tf-wrapper.sh [init|plan|apply|destroy|validate|fmt] [env]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../terraform"
ENVIRONMENTS_DIR="${TERRAFORM_DIR}/environments"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage
usage() {
    cat << EOF
Usage: $0 [command] [environment]

Commands:
    init        Initialize Terraform
    plan        Generate execution plan
    apply       Apply Terraform changes
    destroy     Destroy resources
    validate    Validate Terraform files
    fmt         Format Terraform files
    output      Show Terraform outputs

Environments:
    dev         Development environment
    prod        Production environment

Examples:
    $0 plan dev
    $0 apply prod
    $0 validate
EOF
    exit 1
}

# Validate environment
validate_env() {
    local env=$1
    if [ ! -d "${ENVIRONMENTS_DIR}/$env" ]; then
        log_error "Environment '$env' not found"
        exit 1
    fi
}

# Initialize Terraform
tf_init() {
    local env=$1
    log_info "Initializing Terraform for $env environment..."
    
    cd "${ENVIRONMENTS_DIR}/$env"
    terraform init
    log_success "Terraform initialized for $env"
}

# Validate Terraform
tf_validate() {
    local env=$1
    log_info "Validating Terraform for $env environment..."
    
    cd "${ENVIRONMENTS_DIR}/$env"
    terraform validate
    log_success "Terraform validation passed"
}

# Format Terraform files
tf_fmt() {
    local env=$1
    log_info "Formatting Terraform files for $env environment..."
    
    cd "${ENVIRONMENTS_DIR}/$env"
    terraform fmt -recursive
    log_success "Terraform files formatted"
}

# Plan Terraform changes
tf_plan() {
    local env=$1
    log_info "Planning Terraform changes for $env environment..."
    
    cd "${ENVIRONMENTS_DIR}/$env"
    terraform plan -out=tfplan
    log_success "Terraform plan generated"
}

# Apply Terraform changes
tf_apply() {
    local env=$1
    log_warning "Applying Terraform changes to $env environment..."
    echo "This will make changes to your AWS infrastructure."
    read -p "Are you sure? (yes/no) " -n 3 -r
    echo
    
    if [[ $REPLY =~ ^yes$ ]]; then
        cd "${ENVIRONMENTS_DIR}/$env"
        terraform apply -auto-approve
        log_success "Terraform apply completed"
    else
        log_warning "Apply cancelled"
        exit 1
    fi
}

# Destroy Terraform resources
tf_destroy() {
    local env=$1
    log_error "Destroying Terraform resources in $env environment..."
    echo "This will DELETE your AWS infrastructure."
    read -p "Type the environment name to confirm: " confirm_env
    
    if [ "$confirm_env" = "$env" ]; then
        cd "${ENVIRONMENTS_DIR}/$env"
        terraform destroy
        log_success "Terraform destroy completed"
    else
        log_warning "Destroy cancelled"
        exit 1
    fi
}

# Show outputs
tf_output() {
    local env=$1
    log_info "Terraform outputs for $env environment:"
    
    cd "${ENVIRONMENTS_DIR}/$env"
    terraform output -json | jq .
}

# Main script logic
if [ $# -eq 0 ]; then
    usage
fi

COMMAND=$1
ENV=${2:-dev}

validate_env "$ENV"

case $COMMAND in
    init)
        tf_init "$ENV"
        ;;
    plan)
        tf_plan "$ENV"
        ;;
    apply)
        tf_apply "$ENV"
        ;;
    destroy)
        tf_destroy "$ENV"
        ;;
    validate)
        tf_validate "$ENV"
        ;;
    fmt)
        tf_fmt "$ENV"
        ;;
    output)
        tf_output "$ENV"
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        usage
        ;;
esac

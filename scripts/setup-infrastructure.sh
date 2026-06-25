#!/bin/bash

# Setup AWS DevOps infrastructure
# This script initializes the Terraform state bucket and DynamoDB table

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="aws-devops"
AWS_REGION="us-east-1"

echo "[INFO] Setting up AWS DevOps infrastructure..."

# Create S3 bucket for Terraform state
echo "[INFO] Creating S3 bucket for Terraform state..."
aws s3api create-bucket \
    --bucket "${PROJECT_NAME}-terraform-state-$(aws sts get-caller-identity --query Account --output text)" \
    --region "${AWS_REGION}" \
    --create-bucket-configuration LocationConstraint="${AWS_REGION}" 2>/dev/null || echo "[WARNING] Bucket already exists or error occurred"

# Enable versioning
echo "[INFO] Enabling versioning on state bucket..."
aws s3api put-bucket-versioning \
    --bucket "${PROJECT_NAME}-terraform-state-$(aws sts get-caller-identity --query Account --output text)" \
    --versioning-configuration Status=Enabled \
    --region "${AWS_REGION}"

# Enable encryption
echo "[INFO] Enabling encryption on state bucket..."
aws s3api put-bucket-encryption \
    --bucket "${PROJECT_NAME}-terraform-state-$(aws sts get-caller-identity --query Account --output text)" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }' \
    --region "${AWS_REGION}"

# Block public access
echo "[INFO] Blocking public access to state bucket..."
aws s3api put-public-access-block \
    --bucket "${PROJECT_NAME}-terraform-state-$(aws sts get-caller-identity --query Account --output text)" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --region "${AWS_REGION}"

# Create DynamoDB table for state locking
echo "[INFO] Creating DynamoDB table for state locking..."
aws dynamodb create-table \
    --table-name terraform-state-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "${AWS_REGION}" 2>/dev/null || echo "[WARNING] Table already exists"

echo "[SUCCESS] AWS DevOps infrastructure setup completed!"
echo "[INFO] Update terraform/backend.tf with your bucket name and test the configuration"

# infra/main-fixed.tf
# All checks pass. No violations!

provider "aws" {
  region = "us-east-1"
  # No hardcoded access_key or secret_key. Assumes IAM Role or Environment variables.
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "policysync-vpc-secure"
  }
}

# Secure S3 bucket with public access blocked & encryption enabled
resource "aws_s3_bucket" "secure_uploads" {
  bucket = "startup-user-uploads-secured"
}

resource "aws_s3_bucket_public_access_block" "secure_uploads_block" {
  bucket = aws_s3_bucket.secure_uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_uploads_encryption" {
  bucket = aws_s3_bucket.secure_uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Security group restricted to internal subnets only (no 0.0.0.0/0 ingress)
resource "aws_security_group" "restricted_sg" {
  name        = "restricted-access"
  description = "Allows restricted access"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from corporate IP range only"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["192.168.1.0/24"] # Secure restricted ingress
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

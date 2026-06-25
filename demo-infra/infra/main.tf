# DEMO FILE 3 - Multiple Violations (Best for demo)
# Violations: AWS-001 CRITICAL, AWS-002 CRITICAL, AWS-003 HIGH,
#             AWS-005 HIGH, AWS-006 CRITICAL
#
# This is the "worst case" file - a developer who moved fast
# and broke all the security rules at once. Great for showing
# how PolicySync catches everything in one scan.

provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAIDSFODNN7EXAMPLE"      # <-- Detected hardcoded credential
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"      # <-- Detected hardcoded credential
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "policysync-vpc"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
  tags = {
    Name = "policysync-public-subnet"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "policysync-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

# CRITICAL: Public S3 bucket
resource "aws_s3_bucket" "user_uploads" {
  bucket = "startup-user-uploads"
  acl    = "public-read"
}

# HIGH: Security group open to all ports to internet
resource "aws_security_group" "everything_open" {
  name        = "allow-all"
  description = "Opens all ports to the internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "All traffic"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}

# HIGH: RDS Public Access & Hardcoded Password
resource "aws_db_instance" "default" {
  allocated_storage    = 10
  db_name              = "mydb"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  username             = "admin"
  password             = "MyPassword123!"
  parameter_group_name = "default.mysql8.0"
  publicly_accessible  = true
  skip_final_snapshot  = true
}

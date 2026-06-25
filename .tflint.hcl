config {
  module = true
  force  = false
}

plugin "aws" {
  enabled = true
  version = "0.20.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "aws_instance_default_security_group" {
  enabled = true
}

rule "aws_instance_ebs_encryption" {
  enabled = true
}

rule "aws_s3_bucket_server_side_encryption_enabled" {
  enabled = true
}

rule "aws_s3_bucket_versioning_enabled" {
  enabled = true
}

rule "aws_iam_policy_no_statements_with_admin_access" {
  enabled = true
}

rule "aws_cloudtrail_encryption_enabled" {
  enabled = true
}

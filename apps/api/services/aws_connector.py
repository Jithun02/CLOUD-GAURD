"""AWS cloud connector service for security scanning."""

import boto3
from typing import Dict, List, Any, Optional
from config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class AWSConnector:
    """Connector for AWS cloud security operations."""

    def __init__(
        self,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        region: str = "us-east-1",
    ):
        """Initialize AWS connector with credentials."""
        self.access_key_id = access_key_id or settings.AWS_ACCESS_KEY_ID
        self.secret_access_key = secret_access_key or settings.AWS_SECRET_ACCESS_KEY
        self.region = region

        if self.access_key_id and self.secret_access_key:
            self.session = boto3.Session(
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
                region_name=region,
            )
        else:
            self.session = boto3.Session(region_name=region)

    def scan_s3_buckets(self) -> List[Dict[str, Any]]:
        """Scan S3 buckets for security issues."""
        try:
            s3 = self.session.client("s3")
            findings = []

            response = s3.list_buckets()
            buckets = response.get("Buckets", [])

            for bucket in buckets:
                bucket_name = bucket["Name"]
                findings.extend(self._check_bucket_security(s3, bucket_name))

            return findings
        except Exception as e:
            logger.error(f"Error scanning S3 buckets: {e}")
            return []

    def _check_bucket_security(self, s3_client, bucket_name: str) -> List[Dict[str, Any]]:
        """Check individual bucket security configuration."""
        findings = []

        try:
            # Check public access block
            try:
                acl = s3_client.get_bucket_acl(Bucket=bucket_name)
                for grant in acl.get("Grants", []):
                    grantee = grant.get("Grantee", {})
                    if grantee.get("Type") == "Group" and "AllUsers" in grantee.get("URI", ""):
                        findings.append(
                            {
                                "rule_id": "AWS_S3_001",
                                "rule_name": "S3 Bucket Public Access",
                                "severity": "CRITICAL",
                                "resource_id": bucket_name,
                                "description": f"S3 bucket '{bucket_name}' is publicly accessible",
                                "remediation": "Block public access using S3 Block Public Access settings",
                            }
                        )
            except Exception as e:
                logger.error(f"Error checking bucket ACL for {bucket_name}: {e}")

            # Check encryption
            try:
                encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
                if not encryption.get("ServerSideEncryptionConfiguration"):
                    findings.append(
                        {
                            "rule_id": "AWS_S3_002",
                            "rule_name": "S3 Bucket Encryption Not Enabled",
                            "severity": "HIGH",
                            "resource_id": bucket_name,
                            "description": f"S3 bucket '{bucket_name}' does not have encryption enabled",
                            "remediation": "Enable server-side encryption for the S3 bucket",
                        }
                    )
            except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                findings.append(
                    {
                        "rule_id": "AWS_S3_002",
                        "rule_name": "S3 Bucket Encryption Not Enabled",
                        "severity": "HIGH",
                        "resource_id": bucket_name,
                        "description": f"S3 bucket '{bucket_name}' does not have encryption enabled",
                        "remediation": "Enable server-side encryption for the S3 bucket",
                    }
                )
            except Exception as e:
                logger.error(f"Error checking encryption for {bucket_name}: {e}")

            # Check versioning
            try:
                versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
                if versioning.get("Status") != "Enabled":
                    findings.append(
                        {
                            "rule_id": "AWS_S3_003",
                            "rule_name": "S3 Bucket Versioning Not Enabled",
                            "severity": "MEDIUM",
                            "resource_id": bucket_name,
                            "description": f"S3 bucket '{bucket_name}' does not have versioning enabled",
                            "remediation": "Enable versioning on the S3 bucket for data protection",
                        }
                    )
            except Exception as e:
                logger.error(f"Error checking versioning for {bucket_name}: {e}")

        except Exception as e:
            logger.error(f"Unexpected error scanning bucket {bucket_name}: {e}")

        return findings

    def scan_iam_policies(self) -> List[Dict[str, Any]]:
        """Scan IAM policies for security issues."""
        try:
            iam = self.session.client("iam")
            findings = []

            # List all users
            users_response = iam.list_users()
            for user in users_response.get("Users", []):
                user_name = user["UserName"]
                findings.extend(self._check_user_policies(iam, user_name))

            return findings
        except Exception as e:
            logger.error(f"Error scanning IAM policies: {e}")
            return []

    def _check_user_policies(self, iam_client, user_name: str) -> List[Dict[str, Any]]:
        """Check individual user IAM policies."""
        findings = []

        try:
            # Get attached policies
            attached_policies = iam_client.list_attached_user_policies(UserName=user_name)

            for policy in attached_policies.get("AttachedPolicies", []):
                if "Admin" in policy["PolicyName"]:
                    findings.append(
                        {
                            "rule_id": "AWS_IAM_001",
                            "rule_name": "IAM User Has Admin Access",
                            "severity": "CRITICAL",
                            "resource_id": user_name,
                            "description": f"IAM user '{user_name}' has administrative privileges",
                            "remediation": "Apply principle of least privilege by assigning specific permissions",
                        }
                    )

            # Check for access keys
            access_keys = iam_client.list_access_keys(UserName=user_name)
            if len(access_keys.get("AccessKeyMetadata", [])) > 1:
                findings.append(
                    {
                        "rule_id": "AWS_IAM_002",
                        "rule_name": "Multiple IAM Access Keys",
                        "severity": "MEDIUM",
                        "resource_id": user_name,
                        "description": f"IAM user '{user_name}' has multiple access keys",
                        "remediation": "Deactivate unused access keys",
                    }
                )

        except Exception as e:
            logger.error(f"Error checking policies for user {user_name}: {e}")

        return findings

    def scan_rds_instances(self) -> List[Dict[str, Any]]:
        """Scan RDS instances for security issues."""
        try:
            rds = self.session.client("rds")
            findings = []

            response = rds.describe_db_instances()

            for instance in response.get("DBInstances", []):
                instance_id = instance["DBInstanceIdentifier"]

                # Check encryption
                if not instance.get("StorageEncrypted", False):
                    findings.append(
                        {
                            "rule_id": "AWS_RDS_001",
                            "rule_name": "RDS Instance Encryption Not Enabled",
                            "severity": "HIGH",
                            "resource_id": instance_id,
                            "description": f"RDS instance '{instance_id}' does not have encryption at rest",
                            "remediation": "Enable encryption for the RDS instance",
                        }
                    )

                # Check public accessibility
                if instance.get("PubliclyAccessible", False):
                    findings.append(
                        {
                            "rule_id": "AWS_RDS_002",
                            "rule_name": "RDS Instance Publicly Accessible",
                            "severity": "CRITICAL",
                            "resource_id": instance_id,
                            "description": f"RDS instance '{instance_id}' is publicly accessible",
                            "remediation": "Disable public accessibility for the RDS instance",
                        }
                    )

            return findings
        except Exception as e:
            logger.error(f"Error scanning RDS instances: {e}")
            return []

    def scan_security_groups(self) -> List[Dict[str, Any]]:
        """Scan EC2 security groups for security issues."""
        try:
            ec2 = self.session.client("ec2")
            findings = []

            response = ec2.describe_security_groups()

            for sg in response.get("SecurityGroups", []):
                sg_id = sg["GroupId"]

                # Check for overly permissive rules
                for rule in sg.get("IpPermissions", []):
                    for ip_range in rule.get("IpRanges", []):
                        if ip_range.get("CidrIp") == "0.0.0.0/0":
                            findings.append(
                                {
                                    "rule_id": "AWS_EC2_001",
                                    "rule_name": "Security Group Open to Internet",
                                    "severity": "HIGH",
                                    "resource_id": sg_id,
                                    "description": f"Security group '{sg_id}' allows traffic from 0.0.0.0/0",
                                    "remediation": "Restrict security group rules to specific IP ranges",
                                }
                            )

            return findings
        except Exception as e:
            logger.error(f"Error scanning security groups: {e}")
            return []

    def remediate_s3_bucket(self, bucket_name: str, action: str) -> bool:
        """Remediate S3 bucket security issue."""
        try:
            s3 = self.session.client("s3")

            if action == "enable_encryption":
                s3.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        "Rules": [
                            {
                                "ApplyServerSideEncryptionByDefault": {
                                    "SSEAlgorithm": "AES256",
                                }
                            }
                        ]
                    },
                )
                logger.info(f"Enabled encryption for bucket {bucket_name}")
                return True

            elif action == "enable_versioning":
                s3.put_bucket_versioning(
                    Bucket=bucket_name,
                    VersioningConfiguration={"Status": "Enabled"},
                )
                logger.info(f"Enabled versioning for bucket {bucket_name}")
                return True

            elif action == "block_public_access":
                s3.put_public_access_block(
                    Bucket=bucket_name,
                    PublicAccessBlockConfiguration={
                        "BlockPublicAcls": True,
                        "IgnorePublicAcls": True,
                        "BlockPublicPolicy": True,
                        "RestrictPublicBuckets": True,
                    },
                )
                logger.info(f"Blocked public access for bucket {bucket_name}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error remediating S3 bucket {bucket_name}: {e}")
            return False

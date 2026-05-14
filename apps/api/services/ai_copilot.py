"""AI Copilot service for intelligent security insights and recommendations."""

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import re

logger = logging.getLogger(__name__)


@dataclass
class AIInsight:
    """AI-generated security insight."""
    type: str  # explanation, recommendation, prediction
    title: str
    description: str
    confidence: float
    severity: Optional[str] = None


class AICopilot:
    """AI-powered security copilot for insights and recommendations."""

    def __init__(self):
        """Initialize AI copilot."""
        self.rule_database = self._init_rule_database()

    def _init_rule_database(self) -> Dict[str, Dict[str, str]]:
        """Initialize knowledge base of security rules."""
        return {
            "AWS_S3_001": {
                "title": "S3 Bucket Public Access",
                "explanation": "This S3 bucket is publicly accessible, allowing anyone on the internet to potentially read or modify its contents.",
                "fix": "Block public access using S3 Block Public Access settings. Set all four options to 'Block'.",
                "impact": "Data breach, unauthorized access to sensitive information",
                "priority": "CRITICAL",
            },
            "AWS_S3_002": {
                "title": "S3 Encryption Not Enabled",
                "explanation": "The S3 bucket does not have default encryption enabled. This means data is stored unencrypted.",
                "fix": "Enable server-side encryption using AES-256 or KMS. Go to bucket properties and set default encryption.",
                "impact": "Data at rest not protected, compliance violations",
                "priority": "HIGH",
            },
            "AWS_IAM_001": {
                "title": "IAM User Has Admin Access",
                "explanation": "This IAM user has administrative privileges, violating the principle of least privilege.",
                "fix": "Remove admin policy. Assign only specific permissions required for the user's role.",
                "impact": "Excessive permissions increase blast radius of compromise",
                "priority": "CRITICAL",
            },
            "AWS_RDS_001": {
                "title": "RDS Instance Encryption Not Enabled",
                "explanation": "The RDS database instance stores data unencrypted at rest.",
                "fix": "Enable encryption at rest. For existing instances, create a snapshot, restore to new encrypted instance.",
                "impact": "Data at rest not protected, compliance violations",
                "priority": "HIGH",
            },
            "AWS_RDS_002": {
                "title": "RDS Instance Publicly Accessible",
                "explanation": "The RDS instance is exposed to the internet, allowing potential unauthorized access.",
                "fix": "Disable public accessibility. Place RDS in private subnet with security group restrictions.",
                "impact": "Direct internet exposure increases attack surface",
                "priority": "CRITICAL",
            },
            "SECRET_AWS_ACCESS_KEY": {
                "title": "AWS Access Key Detected",
                "explanation": "An AWS access key has been found in the codebase, posing a critical security risk.",
                "fix": "Immediately revoke the key. Generate a new key pair. Commit does not expose the secret in Git history.",
                "impact": "Complete AWS account compromise possible",
                "priority": "CRITICAL",
            },
        }

    def explain_finding(self, finding: Dict[str, Any]) -> AIInsight:
        """Generate explanation for a security finding."""
        rule_id = finding.get("rule_id", "")
        rule_name = finding.get("rule_name", "")
        description = finding.get("description", "")

        if rule_id in self.rule_database:
            rule_info = self.rule_database[rule_id]
            return AIInsight(
                type="explanation",
                title=rule_info["title"],
                description=rule_info["explanation"],
                confidence=0.95,
                severity=rule_info["priority"],
            )

        # Generate generic explanation
        return AIInsight(
            type="explanation",
            title=rule_name,
            description=description or "Security issue detected that requires attention.",
            confidence=0.70,
            severity=finding.get("severity", "MEDIUM"),
        )

    def suggest_fix(self, finding: Dict[str, Any]) -> AIInsight:
        """Generate fix recommendation for a finding."""
        rule_id = finding.get("rule_id", "")

        if rule_id in self.rule_database:
            rule_info = self.rule_database[rule_id]
            return AIInsight(
                type="recommendation",
                title=f"Fix: {rule_info['title']}",
                description=rule_info["fix"],
                confidence=0.90,
            )

        # Generate generic fix suggestion
        remediation = finding.get("remediation", "Review and remediate this security issue.")
        return AIInsight(
            type="recommendation",
            title=f"Fix: {finding.get('rule_name', 'Security Issue')}",
            description=remediation,
            confidence=0.60,
        )

    def generate_terraform_fix(self, finding: Dict[str, Any]) -> str:
        """Generate Terraform code to fix a security issue."""
        rule_id = finding.get("rule_id", "")
        resource_id = finding.get("resource_id", "")

        fixes = {
            "AWS_S3_001": f"""
# Block public access to {resource_id}
resource "aws_s3_bucket_public_access_block" "{resource_id}" {{
  bucket = aws_s3_bucket.{resource_id}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}}
""",
            "AWS_S3_002": f"""
# Enable encryption for {resource_id}
resource "aws_s3_bucket_server_side_encryption_configuration" "{resource_id}" {{
  bucket = aws_s3_bucket.{resource_id}.id

  rule {{
    apply_server_side_encryption_by_default {{
      sse_algorithm = "AES256"
    }}
  }}
}}
""",
            "AWS_RDS_002": f"""
# Disable public accessibility for {resource_id}
resource "aws_db_instance" "{resource_id}" {{
  # ... existing configuration ...
  publicly_accessible = false
  db_subnet_group_name = aws_db_subnet_group.main.name
}}
""",
        }

        return fixes.get(rule_id, "# Consult documentation for remediation steps")

    def predict_breach_likelihood(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predict likelihood of security breach based on findings."""
        # Score calculation
        critical_findings = len([f for f in findings if f.get("severity") == "CRITICAL"])
        high_findings = len([f for f in findings if f.get("severity") == "HIGH"])
        medium_findings = len([f for f in findings if f.get("severity") == "MEDIUM"])

        # Risk calculation
        risk_score = (critical_findings * 30 + high_findings * 15 + medium_findings * 5) / len(findings) if findings else 0
        risk_score = min(100, risk_score)

        # Determine likelihood
        if risk_score >= 80:
            likelihood = "VERY HIGH"
            prediction = "Immediate action required. Critical vulnerabilities present that could lead to compromise."
        elif risk_score >= 60:
            likelihood = "HIGH"
            prediction = "Significant security risks present. Addressing high-severity issues should be prioritized."
        elif risk_score >= 40:
            likelihood = "MEDIUM"
            prediction = "Moderate security posture. Some improvements needed but not immediately critical."
        else:
            likelihood = "LOW"
            prediction = "Generally good security posture. Continue monitoring and addressing low-priority issues."

        return {
            "likelihood": likelihood,
            "risk_score": risk_score,
            "prediction": prediction,
            "critical_findings": critical_findings,
            "high_findings": high_findings,
            "medium_findings": medium_findings,
            "recommendations": self._generate_recommendations(findings),
        }

    def _generate_recommendations(self, findings: List[Dict[str, Any]]) -> List[str]:
        """Generate prioritized recommendations."""
        recommendations = []

        critical_findings = [f for f in findings if f.get("severity") == "CRITICAL"]
        if critical_findings:
            recommendations.append(
                f"Address {len(critical_findings)} critical security issues immediately. "
                "These could lead to complete system compromise."
            )

        # Check for specific patterns
        has_public_access = any("public" in f.get("rule_name", "").lower() for f in findings)
        if has_public_access:
            recommendations.append(
                "Review and restrict public access to cloud resources. "
                "Use security groups and network ACLs to limit exposure."
            )

        has_encryption_issues = any("encrypt" in f.get("rule_name", "").lower() for f in findings)
        if has_encryption_issues:
            recommendations.append(
                "Enable encryption at rest and in transit for all sensitive data. "
                "Use AWS KMS for key management."
            )

        has_auth_issues = any(
            any(word in f.get("rule_name", "").lower() for word in ["auth", "mfa", "password"])
            for f in findings
        )
        if has_auth_issues:
            recommendations.append(
                "Enforce strong authentication mechanisms. Enable MFA for all users. "
                "Implement least privilege access controls."
            )

        if not recommendations:
            recommendations.append("Continue regular security assessments and monitoring.")

        return recommendations[:5]  # Return top 5 recommendations

    def prioritize_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prioritize findings based on exploitability and impact."""
        scored_findings = []

        for finding in findings:
            score = self._calculate_priority_score(finding)
            scored_findings.append({
                **finding,
                "priority_score": score,
            })

        # Sort by score descending
        scored_findings.sort(key=lambda x: x["priority_score"], reverse=True)
        return scored_findings

    def _calculate_priority_score(self, finding: Dict[str, Any]) -> float:
        """Calculate priority score for a finding."""
        score = 0.0

        # Severity weight
        severity_weights = {
            "CRITICAL": 30.0,
            "HIGH": 20.0,
            "MEDIUM": 10.0,
            "LOW": 5.0,
        }
        score += severity_weights.get(finding.get("severity", "MEDIUM"), 10.0)

        # Exploitability
        rule_name = finding.get("rule_name", "").lower()
        if "public" in rule_name or "internet" in rule_name:
            score += 15.0
        if "access" in rule_name or "password" in rule_name:
            score += 12.0
        if "encrypt" in rule_name or "unencrypted" in rule_name:
            score += 8.0

        # Resource impact
        if "database" in rule_name or "rds" in rule_name:
            score += 10.0
        if "s3" in rule_name or "bucket" in rule_name:
            score += 8.0
        if "iam" in rule_name or "role" in rule_name:
            score += 12.0

        return min(100.0, score)

    def generate_summary(self, findings: List[Dict[str, Any]]) -> str:
        """Generate executive summary of security posture."""
        if not findings:
            return "No security findings detected. Your infrastructure appears secure."

        critical = len([f for f in findings if f.get("severity") == "CRITICAL"])
        high = len([f for f in findings if f.get("severity") == "HIGH"])
        total = len(findings)

        summary = f"Security scan identified {total} findings: "
        if critical > 0:
            summary += f"{critical} CRITICAL, "
        if high > 0:
            summary += f"{high} HIGH, "
        summary += f"and {total - critical - high} other issues. "

        if critical > 0:
            summary += "Immediate action required to address critical vulnerabilities. "

        summary += "Review detailed findings and implement recommended fixes."
        return summary

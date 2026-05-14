"""Compliance reporting engine for multiple frameworks."""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ComplianceControl:
    """Represents a compliance control/requirement."""
    control_id: str
    title: str
    description: str
    framework: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW


class ComplianceEngine:
    """Engine for compliance reporting and tracking."""

    def __init__(self):
        """Initialize compliance engine with frameworks."""
        self.frameworks = self._init_frameworks()

    def _init_frameworks(self) -> Dict[str, List[ComplianceControl]]:
        """Initialize compliance frameworks."""
        return {
            "CIS AWS Foundations": self._get_cis_aws_controls(),
            "SOC2": self._get_soc2_controls(),
            "ISO27001": self._get_iso27001_controls(),
            "PCI-DSS": self._get_pci_dss_controls(),
            "HIPAA": self._get_hipaa_controls(),
            "GDPR": self._get_gdpr_controls(),
        }

    def _get_cis_aws_controls(self) -> List[ComplianceControl]:
        """CIS AWS Foundations controls."""
        return [
            ComplianceControl(
                "1.1", "Avoid the use of root account",
                "Ensure root user account access is disabled",
                "CIS AWS Foundations", "CRITICAL"
            ),
            ComplianceControl(
                "1.2", "Ensure MFA is enabled",
                "Enable MFA for the root account",
                "CIS AWS Foundations", "CRITICAL"
            ),
            ComplianceControl(
                "2.1", "CloudTrail is enabled",
                "Enable CloudTrail to log API calls",
                "CIS AWS Foundations", "HIGH"
            ),
            ComplianceControl(
                "2.3", "S3 bucket MFA delete",
                "Enable MFA delete on S3 buckets",
                "CIS AWS Foundations", "HIGH"
            ),
            ComplianceControl(
                "3.1", "CloudTrail logs to CloudWatch",
                "Configure CloudTrail to send logs to CloudWatch",
                "CIS AWS Foundations", "MEDIUM"
            ),
            ComplianceControl(
                "4.1", "Security Groups",
                "Restrict security group rules appropriately",
                "CIS AWS Foundations", "HIGH"
            ),
            ComplianceControl(
                "4.3", "Default NACLs",
                "Configure default NACLs properly",
                "CIS AWS Foundations", "MEDIUM"
            ),
        ]

    def _get_soc2_controls(self) -> List[ComplianceControl]:
        """SOC2 controls."""
        return [
            ComplianceControl(
                "CC6.1", "Access Control",
                "Logical access controls over system resources",
                "SOC2", "CRITICAL"
            ),
            ComplianceControl(
                "CC6.2", "User Access Provisioning",
                "Appropriate access provisioning procedures",
                "SOC2", "HIGH"
            ),
            ComplianceControl(
                "CC7.2", "System Monitoring",
                "System monitoring and alerting",
                "SOC2", "HIGH"
            ),
            ComplianceControl(
                "CC8.1", "Change Management",
                "Formal change management procedures",
                "SOC2", "HIGH"
            ),
            ComplianceControl(
                "CC9.2", "Encryption",
                "Data encryption during transmission and storage",
                "SOC2", "HIGH"
            ),
        ]

    def _get_iso27001_controls(self) -> List[ComplianceControl]:
        """ISO 27001 controls."""
        return [
            ComplianceControl(
                "A.9.1.1", "Access Control Policy",
                "Formal access control policy",
                "ISO27001", "CRITICAL"
            ),
            ComplianceControl(
                "A.10.1.1", "Encryption Policy",
                "Encryption for confidential information",
                "ISO27001", "HIGH"
            ),
            ComplianceControl(
                "A.12.4.1", "Event Logging",
                "User activities and security events logged",
                "ISO27001", "HIGH"
            ),
            ComplianceControl(
                "A.13.1.1", "Backup Controls",
                "Regular data backups",
                "ISO27001", "HIGH"
            ),
        ]

    def _get_pci_dss_controls(self) -> List[ComplianceControl]:
        """PCI-DSS controls."""
        return [
            ComplianceControl(
                "1.1", "Firewall Configuration",
                "Install and maintain firewall",
                "PCI-DSS", "CRITICAL"
            ),
            ComplianceControl(
                "2.1", "Default Passwords",
                "Change all default passwords",
                "PCI-DSS", "CRITICAL"
            ),
            ComplianceControl(
                "3.2.1", "Do not retain full PAN",
                "Do not retain full primary account numbers",
                "PCI-DSS", "CRITICAL"
            ),
            ComplianceControl(
                "6.2", "Security Patches",
                "Install security patches within 30 days",
                "PCI-DSS", "HIGH"
            ),
            ComplianceControl(
                "8.1", "User Authentication",
                "Unique user identification",
                "PCI-DSS", "HIGH"
            ),
        ]

    def _get_hipaa_controls(self) -> List[ComplianceControl]:
        """HIPAA controls."""
        return [
            ComplianceControl(
                "164.308(a)(1)", "Security Awareness Training",
                "Annual security awareness training required",
                "HIPAA", "HIGH"
            ),
            ComplianceControl(
                "164.308(a)(3)", "Workforce Security",
                "Procedures for workforce security",
                "HIPAA", "HIGH"
            ),
            ComplianceControl(
                "164.312(a)(2)", "Encryption",
                "Encryption for PHI at rest and in transit",
                "HIPAA", "CRITICAL"
            ),
            ComplianceControl(
                "164.312(b)", "Audit Controls",
                "Audit logs and access reports",
                "HIPAA", "HIGH"
            ),
        ]

    def _get_gdpr_controls(self) -> List[ComplianceControl]:
        """GDPR controls."""
        return [
            ComplianceControl(
                "Article 32", "Security of Processing",
                "Implement appropriate security measures",
                "GDPR", "CRITICAL"
            ),
            ComplianceControl(
                "Article 5", "Data Protection Principles",
                "Lawfulness, fairness, transparency",
                "GDPR", "CRITICAL"
            ),
            ComplianceControl(
                "Article 17", "Right to Erasure",
                "Ability to delete personal data",
                "GDPR", "HIGH"
            ),
            ComplianceControl(
                "Article 33", "Breach Notification",
                "Notify authorities within 72 hours",
                "GDPR", "CRITICAL"
            ),
        ]

    def generate_compliance_report(
        self,
        framework: str,
        findings: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Generate compliance report for framework."""
        if framework not in self.frameworks:
            return {
                "framework": framework,
                "error": f"Unknown framework: {framework}",
            }

        controls = self.frameworks[framework]
        report = {
            "framework": framework,
            "total_controls": len(controls),
            "passed_controls": 0,
            "failed_controls": 0,
            "control_details": [],
            "compliance_score": 0.0,
        }

        # Match findings to controls
        for control in controls:
            control_findings = self._match_findings_to_control(
                control, findings
            )

            if not control_findings:
                report["passed_controls"] += 1
                status = "passed"
            else:
                report["failed_controls"] += 1
                status = "failed"

            report["control_details"].append({
                "control_id": control.control_id,
                "title": control.title,
                "status": status,
                "severity": control.severity,
                "findings": control_findings,
            })

        # Calculate compliance score
        report["compliance_score"] = (
            report["passed_controls"] / report["total_controls"] * 100
            if report["total_controls"] > 0
            else 0
        )

        return report

    def _match_findings_to_control(
        self,
        control: ComplianceControl,
        findings: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Match findings to compliance control."""
        matching_findings = []

        # Map rules to controls
        control_mappings = self._get_control_mappings()
        mapped_rules = control_mappings.get(f"{control.framework}_{control.control_id}", [])

        for finding in findings:
            rule_id = finding.get("rule_id", "")
            if any(mapped_rule in rule_id for mapped_rule in mapped_rules):
                matching_findings.append(finding)

        return matching_findings

    def _get_control_mappings(self) -> Dict[str, List[str]]:
        """Map rules to controls."""
        return {
            "CIS AWS Foundations_1.1": ["AWS_IAM_001"],
            "CIS AWS Foundations_1.2": ["AWS_MFA"],
            "CIS AWS Foundations_2.1": ["AWS_CLOUDTRAIL"],
            "CIS AWS Foundations_3.1": ["AWS_CLOUDWATCH"],
            "CIS AWS Foundations_4.1": ["AWS_EC2_001", "AWS_SG"],
            "PCI-DSS_3.2.1": ["AWS_S3_001"],
            "PCI-DSS_6.2": ["PATCH_001"],
            "HIPAA_164.312": ["AWS_S3_002", "AWS_RDS_001"],
            "GDPR_Article 32": ["ENCRYPTION", "ACCESS_CONTROL"],
        }

    def get_all_frameworks_status(
        self,
        findings: List[Dict[str, Any]],
    ) -> Dict[str, Dict[str, Any]]:
        """Get status of all compliance frameworks."""
        results = {}

        for framework in self.frameworks.keys():
            results[framework] = self.generate_compliance_report(
                framework, findings
            )

        return results

    def export_compliance_report(
        self,
        report: Dict[str, Any],
        format: str = "json",
    ) -> str:
        """Export compliance report in specified format."""
        import json

        if format == "json":
            return json.dumps(report, indent=2)
        elif format == "csv":
            return self._to_csv(report)
        elif format == "html":
            return self._to_html(report)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def _to_csv(self, report: Dict[str, Any]) -> str:
        """Convert report to CSV."""
        lines = [
            f"Framework,{report['framework']}",
            f"Compliance Score,{report['compliance_score']:.1f}%",
            f"Passed Controls,{report['passed_controls']}",
            f"Failed Controls,{report['failed_controls']}",
            "",
            "Control ID,Title,Status,Severity,Finding Count",
        ]

        for control in report["control_details"]:
            lines.append(
                f"{control['control_id']},\"{control['title']}\","
                f"{control['status']},{control['severity']},"
                f"{len(control['findings'])}"
            )

        return "\n".join(lines)

    def _to_html(self, report: Dict[str, Any]) -> str:
        """Convert report to HTML."""
        html = f"""
        <html>
        <head><title>{report['framework']} Compliance Report</title></head>
        <body>
            <h1>{report['framework']}</h1>
            <h2>Compliance Score: {report['compliance_score']:.1f}%</h2>
            <p>Passed: {report['passed_controls']} / {report['total_controls']}</p>
            <table border="1">
                <tr><th>Control</th><th>Title</th><th>Status</th><th>Findings</th></tr>
        """

        for control in report["control_details"]:
            status_color = "green" if control["status"] == "passed" else "red"
            html += f"""
                <tr style="background-color: {status_color}20;">
                    <td>{control['control_id']}</td>
                    <td>{control['title']}</td>
                    <td>{control['status']}</td>
                    <td>{len(control['findings'])}</td>
                </tr>
            """

        html += "</table></body></html>"
        return html

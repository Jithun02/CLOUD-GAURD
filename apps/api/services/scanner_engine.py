"""Core security scanning engine integrating multiple tools."""

import subprocess
import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import tempfile

logger = logging.getLogger(__name__)


class ScannerEngine:
    """Main security scanning engine."""

    def __init__(self):
        """Initialize scanner engine."""
        self.temp_dir = tempfile.gettempdir()

    def scan_terraform(self, repo_path: str) -> Dict[str, Any]:
        """Scan Terraform files using Checkov."""
        findings = []
        try:
            # Run checkov on Terraform files
            result = subprocess.run(
                ["checkov", "-d", repo_path, "-f", "json", "--framework", "terraform"],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode in [0, 1]:  # 0 = pass, 1 = failures found
                output = json.loads(result.stdout)
                findings = self._parse_checkov_output(output)

        except FileNotFoundError:
            logger.warning("Checkov not installed, skipping Terraform scan")
        except subprocess.TimeoutExpired:
            logger.error("Terraform scan timed out")
        except Exception as e:
            logger.error(f"Error scanning Terraform: {e}")

        return {
            "scan_type": "terraform",
            "findings": findings,
            "total_count": len(findings),
        }

    def scan_kubernetes(self, manifest_path: str) -> Dict[str, Any]:
        """Scan Kubernetes manifests."""
        findings = []
        try:
            # Run kubesec or Polaris
            result = subprocess.run(
                ["trivy", "config", manifest_path, "-f", "json"],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode in [0, 1]:
                output = json.loads(result.stdout)
                findings = self._parse_trivy_output(output)

        except FileNotFoundError:
            logger.warning("Trivy not installed, skipping Kubernetes scan")
        except Exception as e:
            logger.error(f"Error scanning Kubernetes: {e}")

        return {
            "scan_type": "kubernetes",
            "findings": findings,
            "total_count": len(findings),
        }

    def scan_containers(self, image_name: str) -> Dict[str, Any]:
        """Scan container images for vulnerabilities."""
        findings = []
        try:
            # Run Trivy vulnerability scan
            result = subprocess.run(
                ["trivy", "image", image_name, "-f", "json"],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode in [0, 1]:
                output = json.loads(result.stdout)
                findings = self._parse_trivy_output(output)

        except FileNotFoundError:
            logger.warning("Trivy not installed, skipping container scan")
        except Exception as e:
            logger.error(f"Error scanning container image: {e}")

        return {
            "scan_type": "container",
            "findings": findings,
            "total_count": len(findings),
        }

    def scan_secrets(self, repo_path: str) -> Dict[str, Any]:
        """Scan for secrets in code."""
        findings = []
        try:
            # Run truffleHog or similar
            result = subprocess.run(
                ["git", "clone", "--depth", "1", repo_path, str(Path(self.temp_dir) / "temp_repo")],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode == 0:
                # Scan for common patterns
                patterns = [
                    r"aws_access_key_id\s*=\s*['\"]?[A-Z0-9]{20}",
                    r"aws_secret_access_key\s*=\s*['\"]?[A-Za-z0-9/+=]{40}",
                    r"private[_-]?key\s*[=:]\s*",
                    r"password\s*[=:]\s*['\"]",
                    r"api[_-]?key\s*[=:]\s*['\"]",
                    r"token\s*[=:]\s*['\"]",
                ]

                findings = self._scan_patterns(
                    str(Path(self.temp_dir) / "temp_repo"),
                    patterns,
                    "SECRETS",
                )

        except Exception as e:
            logger.error(f"Error scanning for secrets: {e}")

        return {
            "scan_type": "secrets",
            "findings": findings,
            "total_count": len(findings),
        }

    def scan_sast(self, repo_path: str) -> Dict[str, Any]:
        """Scan code for vulnerabilities using Semgrep."""
        findings = []
        try:
            # Run Semgrep
            result = subprocess.run(
                ["semgrep", "--json", repo_path],
                capture_output=True,
                text=True,
                timeout=600,
            )

            if result.returncode in [0, 1]:
                output = json.loads(result.stdout)
                findings = self._parse_semgrep_output(output)

        except FileNotFoundError:
            logger.warning("Semgrep not installed, skipping SAST scan")
        except Exception as e:
            logger.error(f"Error running SAST scan: {e}")

        return {
            "scan_type": "sast",
            "findings": findings,
            "total_count": len(findings),
        }

    def _parse_checkov_output(self, output: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Checkov JSON output."""
        findings = []

        # Parse failed checks
        for check in output.get("check_type_to_results", {}).get("terraform", {}).get("failed_checks", []):
            findings.append(
                {
                    "rule_id": check.get("check_id", "UNKNOWN"),
                    "rule_name": check.get("check_name", "Unknown Check"),
                    "severity": self._map_checkov_severity(check.get("check_result", {}).get("result", "")),
                    "description": check.get("description", ""),
                    "resource_id": check.get("resource", ""),
                    "file": check.get("file_path", ""),
                    "remediation": self._get_checkov_remediation(check),
                }
            )

        return findings

    def _parse_trivy_output(self, output: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Trivy JSON output."""
        findings = []

        for result in output.get("Results", []):
            for vuln in result.get("Misconfigurations", []):
                findings.append(
                    {
                        "rule_id": vuln.get("ID", "UNKNOWN"),
                        "rule_name": vuln.get("Title", "Unknown"),
                        "severity": vuln.get("Severity", "MEDIUM"),
                        "description": vuln.get("Description", ""),
                        "remediation": vuln.get("Remediation", ""),
                    }
                )

        return findings

    def _parse_semgrep_output(self, output: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Semgrep JSON output."""
        findings = []

        for result in output.get("results", []):
            findings.append(
                {
                    "rule_id": result.get("check_id", "UNKNOWN"),
                    "rule_name": result.get("message", "Unknown"),
                    "severity": result.get("extra", {}).get("severity", "MEDIUM"),
                    "description": result.get("message", ""),
                    "file": result.get("path", ""),
                    "line": result.get("start", {}).get("line", 0),
                }
            )

        return findings

    def _scan_patterns(self, path: str, patterns: List[str], category: str) -> List[Dict[str, Any]]:
        """Scan files for regex patterns."""
        findings = []
        # Implementation would scan files for patterns
        return findings

    def _map_checkov_severity(self, result: str) -> str:
        """Map Checkov result to severity."""
        if result == "failed":
            return "HIGH"
        return "MEDIUM"

    def _get_checkov_remediation(self, check: Dict[str, Any]) -> str:
        """Get remediation advice for Checkov check."""
        return check.get("remediation", {}).get("fix_is_mandatory", False) and "Required fix" or "Recommended"

    def calculate_risk_score(self, findings: List[Dict[str, Any]]) -> float:
        """Calculate overall risk score from findings."""
        if not findings:
            return 0.0

        severity_weights = {
            "CRITICAL": 10.0,
            "HIGH": 7.0,
            "MEDIUM": 4.0,
            "LOW": 2.0,
            "INFO": 0.5,
        }

        total_score = 0.0
        for finding in findings:
            severity = finding.get("severity", "MEDIUM")
            weight = severity_weights.get(severity, 1.0)
            total_score += weight

        # Normalize to 0-100 scale
        max_possible = len(findings) * 10
        risk_score = (total_score / max_possible) * 100 if max_possible > 0 else 0

        return min(100, risk_score)

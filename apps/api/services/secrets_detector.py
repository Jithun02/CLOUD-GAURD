"""Secrets detection engine for credential leaks."""

import re
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SecretPattern:
    """Pattern definition for secret detection."""
    name: str
    pattern: str
    severity: str
    categories: List[str]
    confidence: float


class SecretsDetector:
    """Engine for detecting secrets in code and configurations."""

    def __init__(self):
        """Initialize secrets detector with patterns."""
        self.patterns = self._init_patterns()

    def _init_patterns(self) -> List[SecretPattern]:
        """Initialize detection patterns."""
        return [
            # AWS Credentials
            SecretPattern(
                name="AWS Access Key",
                pattern=r'(?i)(aws|amazon).*?(access[_-]?key|id)["\']?\s*[:=]\s*["\']?([A-Z0-9]{20})["\']?',
                severity="CRITICAL",
                categories=["aws", "credentials"],
                confidence=0.95,
            ),
            SecretPattern(
                name="AWS Secret Key",
                pattern=r'(?i)(aws|amazon).*?(secret[_-]?key)["\']?\s*[:=]\s*["\']?([A-Za-z0-9/+=]{40})["\']?',
                severity="CRITICAL",
                categories=["aws", "credentials"],
                confidence=0.95,
            ),
            # GitHub Tokens
            SecretPattern(
                name="GitHub Personal Token",
                pattern=r'(?i)github.*?(token|pat)["\']?\s*[:=]\s*["\']?(ghp_[A-Za-z0-9_]{36,255})["\']?',
                severity="CRITICAL",
                categories=["github", "credentials", "token"],
                confidence=0.99,
            ),
            SecretPattern(
                name="GitHub OAuth Token",
                pattern=r'(?i)github.*?(token|oauth)["\']?\s*[:=]\s*["\']?([a-f0-9]{40})["\']?',
                severity="HIGH",
                categories=["github", "token"],
                confidence=0.90,
            ),
            # Private Keys
            SecretPattern(
                name="Private SSH Key",
                pattern=r'-----BEGIN (?:RSA|DSA|EC|PGP|OPENSSH) PRIVATE KEY',
                severity="CRITICAL",
                categories=["ssh", "key", "credentials"],
                confidence=0.99,
            ),
            SecretPattern(
                name="Private PEM Key",
                pattern=r'-----BEGIN PRIVATE KEY',
                severity="CRITICAL",
                categories=["pem", "key", "credentials"],
                confidence=0.99,
            ),
            # Database Credentials
            SecretPattern(
                name="Database Connection String",
                pattern=r'(?i)(postgres|mysql|mongodb).*://[a-z0-9_-]+:[^@]+@',
                severity="CRITICAL",
                categories=["database", "credentials"],
                confidence=0.85,
            ),
            SecretPattern(
                name="Database Password",
                pattern=r'(?i)(db|database).*?(password|passwd|pwd)["\']?\s*[:=]\s*["\']([^"\']+)["\']',
                severity="CRITICAL",
                categories=["database", "credentials"],
                confidence=0.80,
            ),
            # API Keys
            SecretPattern(
                name="Stripe API Key",
                pattern=r'(?i)stripe.*?(secret|api)[_-]?key["\']?\s*[:=]\s*["\']?(sk_[a-z0-9]{20,}|rk_[a-z0-9]{20,})["\']?',
                severity="CRITICAL",
                categories=["stripe", "api", "credentials"],
                confidence=0.95,
            ),
            SecretPattern(
                name="Generic API Key",
                pattern=r'(?i)api[_-]?key["\']?\s*[:=]\s*["\']?([a-f0-9]{32,})["\']?',
                severity="HIGH",
                categories=["api", "key"],
                confidence=0.70,
            ),
            # Tokens
            SecretPattern(
                name="Bearer Token",
                pattern=r'(?i)authorization["\']?\s*[:=]\s*["\']?bearer\s+([a-z0-9._-]{20,})["\']?',
                severity="HIGH",
                categories=["token", "auth"],
                confidence=0.75,
            ),
            SecretPattern(
                name="JWT Token",
                pattern=r'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_.-]+',
                severity="HIGH",
                categories=["jwt", "token"],
                confidence=0.85,
            ),
            # Environment Variables
            SecretPattern(
                name="Environment Password",
                pattern=r'(?i)(password|passwd|pwd)["\']?\s*[:=]\s*["\']([^"\']{8,})["\']',
                severity="HIGH",
                categories=["password", "env"],
                confidence=0.75,
            ),
            # Google Cloud
            SecretPattern(
                name="Google Service Account",
                pattern=r'(?i)service[_-]?account.*?type.*?service_account',
                severity="CRITICAL",
                categories=["gcp", "credentials"],
                confidence=0.90,
            ),
            # Slack Tokens
            SecretPattern(
                name="Slack Bot Token",
                pattern=r'xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9_-]{24}',
                severity="HIGH",
                categories=["slack", "token"],
                confidence=0.95,
            ),
            # NPM Tokens
            SecretPattern(
                name="NPM Token",
                pattern=r'npm_[a-zA-Z0-9]{36}',
                severity="HIGH",
                categories=["npm", "token"],
                confidence=0.95,
            ),
        ]

    def scan_text(self, text: str, filename: str = "") -> List[Dict[str, Any]]:
        """Scan text content for secrets."""
        findings = []

        for line_num, line in enumerate(text.split('\n'), 1):
            for pattern in self.patterns:
                try:
                    if re.search(pattern.pattern, line):
                        findings.append({
                            "rule_id": f"SECRET_{pattern.name.upper().replace(' ', '_')}",
                            "rule_name": pattern.name,
                            "severity": pattern.severity,
                            "description": f"Potential secret found: {pattern.name}",
                            "resource_id": filename,
                            "line": line_num,
                            "categories": pattern.categories,
                            "confidence": pattern.confidence,
                            "remediation": self._get_remediation(pattern.name),
                        })
                except re.error as e:
                    logger.error(f"Regex error for pattern {pattern.name}: {e}")

        return findings

    def scan_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Scan file for secrets."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return self.scan_text(content, file_path)
        except Exception as e:
            logger.error(f"Error scanning file {file_path}: {e}")
            return []

    def scan_repository(self, repo_path: str) -> Dict[str, Any]:
        """Scan entire repository for secrets."""
        findings = []
        scanned_files = 0

        # Patterns to exclude
        exclude_patterns = [
            r'\.git',
            r'node_modules',
            r'\.env\.example',
            r'package-lock\.json',
            r'\.idea',
            r'__pycache__',
            r'\.venv',
            r'venv',
        ]

        try:
            import os
            for root, dirs, files in os.walk(repo_path):
                # Skip excluded directories
                dirs[:] = [
                    d for d in dirs
                    if not any(re.search(pattern, d) for pattern in exclude_patterns)
                ]

                for file in files:
                    file_path = os.path.join(root, file)
                    
                    # Skip binary files and certain extensions
                    if not self._is_scannable_file(file_path):
                        continue

                    scanned_files += 1
                    findings.extend(self.scan_file(file_path))

        except Exception as e:
            logger.error(f"Error scanning repository: {e}")

        return {
            "scan_type": "secrets",
            "findings": findings,
            "total_count": len(findings),
            "scanned_files": scanned_files,
            "critical_count": len([f for f in findings if f["severity"] == "CRITICAL"]),
            "high_count": len([f for f in findings if f["severity"] == "HIGH"]),
        }

    def _is_scannable_file(self, file_path: str) -> bool:
        """Check if file should be scanned."""
        # Text files that might contain secrets
        scannable_extensions = {
            '.py', '.js', '.ts', '.json', '.yaml', '.yml',
            '.env', '.properties', '.conf', '.config',
            '.tf', '.hcl', '.sh', '.bash',
            '.java', '.go', '.rs', '.cpp', '.c',
            '.php', '.rb', '.pl',
        }

        # Skip large files
        try:
            if os.path.getsize(file_path) > 10 * 1024 * 1024:  # 10MB
                return False
        except:
            pass

        _, ext = os.path.splitext(file_path)
        return ext.lower() in scannable_extensions or file_path.endswith('.env')

    def _get_remediation(self, secret_type: str) -> str:
        """Get remediation advice for secret type."""
        remediation_map = {
            "AWS Access Key": "Rotate the AWS access key immediately. Use AWS Systems Manager to store secrets.",
            "AWS Secret Key": "Rotate the AWS secret key immediately. Enable MFA delete protection.",
            "GitHub Personal Token": "Revoke the token immediately from GitHub settings. Rotate all credentials.",
            "Private SSH Key": "Revoke the key immediately. Generate a new key pair and update authorized keys.",
            "Private PEM Key": "Revoke the certificate immediately. Generate new keys with proper protection.",
            "Database Connection String": "Change database password immediately. Use connection pooling and encryption.",
            "Database Password": "Change the database password immediately. Use strong, unique passwords.",
            "Stripe API Key": "Revoke the key from Stripe dashboard. Regenerate and update all deployments.",
            "Generic API Key": "Revoke the API key immediately. Regenerate and distribute securely.",
            "Bearer Token": "Revoke the token immediately. Regenerate and update all clients.",
            "JWT Token": "Check token expiration and revoke if necessary. Regenerate with new signing key.",
            "Environment Password": "Change the password immediately. Use secrets management solution.",
            "Google Service Account": "Disable the service account immediately. Rotate and re-authenticate.",
            "Slack Bot Token": "Revoke the token from Slack app settings. Regenerate token.",
            "NPM Token": "Revoke the token from npm account settings. Regenerate token.",
        }
        return remediation_map.get(secret_type, "Remove the secret immediately and rotate credentials.")

    def validate_secret(self, secret: str, secret_type: str) -> bool:
        """Validate if a string is likely a real secret."""
        # Additional validation to reduce false positives
        entropy = self._calculate_entropy(secret)
        
        # Secrets typically have high entropy
        if len(secret) > 16 and entropy > 3.5:
            return True
        
        return False

    def _calculate_entropy(self, text: str) -> float:
        """Calculate Shannon entropy of text."""
        import math
        if not text:
            return 0.0
        
        freq = {}
        for char in text:
            freq[char] = freq.get(char, 0) + 1
        
        entropy = 0.0
        for count in freq.values():
            prob = count / len(text)
            entropy -= prob * math.log2(prob)
        
        return entropy


# For scanning
import os

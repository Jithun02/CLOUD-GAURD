// frontend/lib/local-scanner.ts
import { Policy, Violation, ScanResult, Stats } from './types';

export const LOCAL_POLICIES: Policy[] = [
  {
    id: "AWS-001",
    name: "Hardcoded AWS Credentials",
    severity: "CRITICAL",
    cloud: "AWS",
    category: "IAM / Security Best Practices",
    description: "Detects AWS access keys and secret keys hardcoded directly in configuration files.",
    fix: "Use IAM roles or AWS Secrets Manager.",
    risk: "Hardcoded credentials can be committed to version control repositories, making them accessible to anyone with repository access and leading to complete account compromise.",
    remediation: "Do not store AWS credentials in your Terraform files. Use environment variables or IAM roles instead.\n\nRecommended Fix:\n- Remove access_key and secret_key from the provider block.\n- Configure AWS credentials using environment variables or a shared credentials file.\n- For production, use IAM Roles."
  },
  {
    id: "AWS-002",
    name: "S3 Public Access",
    severity: "CRITICAL",
    cloud: "AWS",
    category: "Storage / Data Protection",
    description: "S3 bucket is configured with a public ACL (like 'public-read' or 'public-read-write'), exposing data to the public internet.",
    fix: "Set acl = 'private' and use aws_s3_bucket_public_access_block.",
    risk: "Publicly accessible S3 buckets are a leading cause of data breaches, exposing sensitive organizational or customer data to anyone on the internet.",
    remediation: "Configure S3 bucket ACLs to 'private' and block public access explicitly.\n\nRecommended Fix:\n- Change acl to \"private\" in the aws_s3_bucket resource.\n- Attach an aws_s3_bucket_public_access_block resource to ensure all public access is blocked."
  },
  {
    id: "AWS-003",
    name: "Open Security Group (0.0.0.0/0)",
    severity: "HIGH",
    cloud: "AWS",
    category: "Networking / Firewalls",
    description: "Security group rules allow ingress traffic from any IP address (0.0.0.0/0) on sensitive ports or protocols.",
    fix: "Restrict cidr_blocks to specific IP ranges or VPC subnets.",
    risk: "Unrestricted ingress allows attackers anywhere on the internet to attempt to connect to internal resources, increasing the attack surface.",
    remediation: "Remove the 0.0.0.0/0 ingress rule and replace it with restricted CIDR blocks representing your corporate network or specific authorized IPs."
  },
  {
    id: "AWS-004",
    name: "IAM Wildcard Actions",
    severity: "HIGH",
    cloud: "AWS",
    category: "IAM / Access Control",
    description: "IAM policies grant permissions using a wildcard (*) action, giving excessive access rights.",
    fix: "Specify precise IAM actions instead of wildcards.",
    risk: "Wildcard policies violate the principle of least privilege, enabling users or services to perform unintended actions and escalate privileges.",
    remediation: "Define specific actions instead of using \"*\" in your policy document."
  },
  {
    id: "AWS-005",
    name: "RDS Public Access",
    severity: "HIGH",
    cloud: "AWS",
    category: "Database / Security",
    description: "RDS database instances are set to public, allowing connection attempts from outside the VPC.",
    fix: "Set publicly_accessible = false and deploy database in private subnets.",
    risk: "Exposing databases to the internet makes them targets for brute force attacks and exposes data to potential interception.",
    remediation: "Change publicly_accessible to false in your aws_db_instance configuration, and use security groups and bastions/VPNs for administrative access."
  },
  {
    id: "AWS-006",
    name: "Hardcoded Password",
    severity: "CRITICAL",
    cloud: "AWS",
    category: "Security Best Practices",
    description: "Plaintext passwords hardcoded in resources like databases, virtual machines, or local variables.",
    fix: "Pass passwords via secure input variables or load them from Secrets Manager.",
    risk: "Hardcoded passwords in infrastructure code are exposed to developers, CI/CD runners, and potentially the public, leading to unauthorized database access.",
    remediation: "Remove the plaintext password. Declare a variable for the password and set it dynamically, or use dynamic data blocks to retrieve it."
  },
  {
    id: "AWS-007",
    name: "S3 Encryption Disabled",
    severity: "MEDIUM",
    cloud: "AWS",
    category: "Storage / Encryption",
    description: "S3 bucket does not have server-side encryption configured to encrypt data at rest.",
    fix: "Add aws_s3_bucket_server_side_encryption_configuration to configure AES256 or KMS.",
    risk: "Unencrypted buckets pose a compliance risk and fail to protect data at rest in the event of hardware theft or unauthorized access inside AWS.",
    remediation: "Add an aws_s3_bucket_server_side_encryption_configuration block referencing the bucket to enforce AES256 or aws:kms encryption."
  },
  {
    id: "AWS-008",
    name: "CloudTrail Logging Disabled",
    severity: "MEDIUM",
    cloud: "AWS",
    category: "Logging / Audit",
    description: "CloudTrail auditing is disabled or not configured to record API activities.",
    fix: "Set enable_logging = true in your aws_cloudtrail resource.",
    risk: "Disabling logging prevents security teams from performing incident response, auditing API usage, or detecting active breaches in the cloud account.",
    remediation: "Ensure enable_logging is set to true on all aws_cloudtrail configurations."
  },
  {
    id: "GCP-001",
    name: "Open Firewall Rule",
    severity: "CRITICAL",
    cloud: "GCP",
    category: "Networking / Firewalls",
    description: "GCP firewall rule allows unrestricted inbound access from all internet IP addresses (0.0.0.0/0).",
    fix: "Restrict source_ranges to corporate networks or authorized IP addresses.",
    risk: "Open firewalls expose internal virtual machines and database ports to direct internet scans and exploit attempts.",
    remediation: "Define specific IP ranges in source_ranges rather than allowing 0.0.0.0/0 for ingress firewall rules."
  },
  {
    id: "GCP-002",
    name: "Public GCS Bucket",
    severity: "CRITICAL",
    cloud: "GCP",
    category: "Storage / Access Control",
    description: "Google Cloud Storage bucket has allUsers or allAuthenticatedUsers roles assigned, exposing data publicly.",
    fix: "Remove public members from GCS IAM bindings.",
    risk: "Exposing storage buckets publicly allows anonymous users to download and inspect corporate documents, backups, and user uploads.",
    remediation: "Use fine-grained IAM controls and avoid binding allUsers or allAuthenticatedUsers to roles like storage.objectViewer."
  },
  {
    id: "GCP-003",
    name: "Cloud SQL Public IP",
    severity: "HIGH",
    cloud: "GCP",
    category: "Database / Networking",
    description: "Cloud SQL instance enables public IP and has no authorized networks configured.",
    fix: "Disable ipv4_enabled or define specific authorized networks.",
    risk: "Exposing Cloud SQL instances over public IPs increases threat exposure and leaves the database vulnerable to brute force and zero-day connection exploits.",
    remediation: "Set ipv4_enabled to false and configure Private IP for internal database access."
  },
  {
    id: "GCP-004",
    name: "GCP Storage Bucket Logging Disabled",
    severity: "MEDIUM",
    cloud: "GCP",
    category: "Storage / Logging",
    description: "Google Cloud Storage bucket does not have access logs enabled to track bucket access.",
    fix: "Configure a logging block to write access logs to a secure logs bucket.",
    risk: "Lacking access logs prevents security teams from investigating unauthorized access to GCS data resources.",
    remediation: "Add a logging configuration block specifying the log_bucket and log_object_prefix."
  },
  {
    id: "AZ-001",
    name: "HTTP-Only Storage",
    severity: "HIGH",
    cloud: "Azure",
    category: "Storage / Encryption",
    description: "Azure Storage Account allows insecure HTTP connections for data access.",
    fix: "Set enable_https_traffic_only = true in your storage account resource.",
    risk: "Insecure HTTP connections are vulnerable to eavesdropping and man-in-the-middle attacks, exposing data in transit.",
    remediation: "Enable secure transfer by setting enable_https_traffic_only to true in the azurerm_storage_account resource."
  },
  {
    id: "AZ-002",
    name: "Blob Public Access",
    severity: "CRITICAL",
    cloud: "Azure",
    category: "Storage / Data Security",
    description: "Azure Storage Account container or blob public access is enabled.",
    fix: "Set allow_blob_public_access = false and container_access_type = 'private'.",
    risk: "Anonymous read access allows anyone with the URL to download sensitive blob datasets.",
    remediation: "Disable public access on the Storage Account and set container_access_type to \"private\"."
  },
  {
    id: "AZ-003",
    name: "Azure SQL Database Open to Internet",
    severity: "HIGH",
    cloud: "Azure",
    category: "Database / Networking",
    description: "Azure SQL firewall rule is configured to allow all external IP addresses (0.0.0.0 to 255.255.255.255).",
    fix: "Configure specific start and end IP addresses for authorized clients.",
    risk: "Allowing all IP addresses bypasses firewall protection, making the database vulnerable to brute force and denial of service attacks.",
    remediation: "Define firewall rules matching only authorized client ranges, or use service endpoints."
  },
  {
    id: "K8S-001",
    name: "Container Running as Root",
    severity: "HIGH",
    cloud: "Kubernetes",
    category: "Container Security",
    description: "Kubernetes pod container runs as the root user (UID 0), granting full root permissions inside the container.",
    fix: "Set runAsNonRoot: true and define a non-zero runAsUser (e.g. 1000).",
    risk: "If a container is compromised, running as root makes host escape and privilege escalation significantly easier.",
    remediation: "Configure securityContext with runAsNonRoot: true and runAsUser: 1000 in your pod spec."
  },
  {
    id: "K8S-002",
    name: "Privileged Container",
    severity: "CRITICAL",
    cloud: "Kubernetes",
    category: "Container Security",
    description: "Container is running with privileged mode enabled, giving it access to the host node's kernel and devices.",
    fix: "Set privileged: false and request specific Linux capabilities instead.",
    risk: "Privileged containers have almost the same access as the host machine, making container breakout trivial for an attacker.",
    remediation: "Disable privileged mode (set privileged: false) and use caps-drop/add permissions if required."
  },
  {
    id: "K8S-003",
    name: "Hardcoded Secret in Env",
    severity: "HIGH",
    cloud: "Kubernetes",
    category: "Security Best Practices",
    description: "Sensitive credentials or secrets are set as plaintext values in environment variables.",
    fix: "Use valueFrom referencing a Kubernetes Secret object.",
    risk: "Environment variables are visible to developers, logs, and anyone with read access to the namespace, exposing credentials.",
    remediation: "Create a Kubernetes Secret and reference it using the valueFrom.secretKeyRef field."
  }
];

// Simple Client-side regex engine port
export function scanCodeLocally(content: string, filename: string, cloud: string): ScanResult {
  const violations: Violation[] = [];
  const lines = content.split('\n');
  
  // RegEx match definitions
  const patterns: { [key: string]: RegExp[] } = {
    "AWS-001": [/AKIA[A-Z0-9]{16}/, /aws_access_key\s*=\s*"[^"]+"/, /aws_secret_key\s*=\s*"[^"]+"/],
    "AWS-002": [/acl\s*=\s*"public-read"/, /acl\s*=\s*"public-read-write"/],
    "AWS-003": [/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/],
    "AWS-004": [/actions\s*=\s*\[\s*"\*"\s*\]/, /"Action"\s*:\s*"\*"/],
    "AWS-005": [/publicly_accessible\s*=\s*true/],
    "AWS-006": [/password\s*=\s*"(?!var\.)([^"]+)"/i],
    "AWS-007": [/sse_algorithm\s*=\s*"none"/, /encryption_disabled\s*=\s*true/],
    "AWS-008": [/enable_logging\s*=\s*false/],
    "GCP-001": [/source_ranges\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/],
    "GCP-002": [/member\s*=\s*"allUsers"/, /member\s*=\s*"allAuthenticatedUsers"/],
    "GCP-003": [/ipv4_enabled\s*=\s*true/],
    "GCP-004": [/logging\s*\{\s*\n*\s*\}/],
    "AZ-001": [/enable_https_traffic_only\s*=\s*false/],
    "AZ-002": [/allow_blob_public_access\s*=\s*true/, /container_access_type\s*=\s*"blob"/, /container_access_type\s*=\s*"container"/],
    "AZ-003": [/start_ip_address\s*=\s*"0\.0\.0\.0"\s*,\s*end_ip_address\s*=\s*"255\.255\.255\.255"/],
    "K8S-001": [/runAsNonRoot\s*:\s*false/, /runAsUser\s*:\s*0/],
    "K8S-002": [/privileged\s*:\s*true/],
    "K8S-003": [/value\s*:\s*"sk_live_[^"]+"/, /value\s*:\s*"[a-zA-Z0-9_\-\.]{12,}"/]
  };

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    LOCAL_POLICIES.forEach((policy) => {
      const regexes = patterns[policy.id] || [];
      regexes.forEach((regex) => {
        if (regex.test(line)) {
          // Check false positives for variables
          if ((policy.id === "AWS-006" || policy.id === "AWS-001") && /=\s*"(?:var|local|module|aws_)\./i.test(line)) {
            return;
          }

          // AWS-003 egress exclusion
          if (policy.id === "AWS-003") {
            let insideEgress = false;
            for (let i = index; i >= 0; i--) {
              if (lines[i].includes("egress {")) {
                insideEgress = true;
                break;
              }
              if (lines[i].includes("ingress {") || lines[i].includes("resource ")) {
                break;
              }
            }
            if (insideEgress) return;
          }

          // Deduplicate
          if (violations.some(v => v.id === policy.id && v.line === lineNum)) {
            return;
          }

          // Surrounding lines context
          const startCtx = Math.max(0, index - 2);
          const endCtx = Math.min(lines.length, index + 3);
          const contextLines: string[] = [];
          for (let c = startCtx; c < endCtx; c++) {
            const marker = (c + 1) === lineNum ? "      # <-- Detected violation" : "";
            contextLines.push(`${c + 1} | ${lines[c]}${marker}`);
          }
          const context = contextLines.join('\n');

          // Resource name inference
          let resource = "unknown";
          for (let s = index; s >= 0; s--) {
            const resMatch = lines[s].match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
            if (resMatch) {
              resource = `${resMatch[1]} "${resMatch[2]}"`;
              break;
            }
            const provMatch = lines[s].match(/provider\s+"([^"]+)"/);
            if (provMatch) {
              resource = `provider "${provMatch[1]}"`;
              break;
            }
            const kindMatch = lines[s].match(/kind:\s*(\w+)/);
            if (kindMatch) {
              resource = kindMatch[1];
              break;
            }
          }

          violations.push({
            id: policy.id,
            name: policy.name,
            severity: policy.severity,
            cloud: policy.cloud,
            category: policy.category,
            line: lineNum,
            code: line.trim(),
            context,
            resource,
            message: policy.description,
            fix: policy.fix,
            remediation: policy.remediation
          });
        }
      });
    });
  });

  const critical = violations.filter(v => v.severity === 'CRITICAL').length;
  const high = violations.filter(v => v.severity === 'HIGH').length;
  const medium = violations.filter(v => v.severity === 'MEDIUM').length;
  const low = violations.filter(v => v.severity === 'LOW').length;

  return {
    id: Math.random().toString(36).substr(2, 9),
    filename,
    cloud,
    timestamp: new Date().toISOString(),
    status: violations.length > 0 ? 'failed' : 'passed',
    violations,
    summary: { critical, high, medium, low, total: violations.length },
    engine: 'built-in',
    source: 'WEB'
  };
}

# backend/policies_data.py

POLICIES_LIST = [
    {
        "id": "AWS-001",
        "name": "Hardcoded AWS Credentials",
        "severity": "CRITICAL",
        "cloud": "AWS",
        "category": "IAM / Security Best Practices",
        "description": "Detects AWS access keys and secret keys hardcoded directly in configuration files.",
        "patterns": [
            r"AKIA[A-Z0-9]{16}",
            r"aws_access_key\s*=\s*\"([^\"]+)\"",
            r"aws_secret_key\s*=\s*\"([^\"]+)\""
        ],
        "fix": "Use IAM roles or AWS Secrets Manager.",
        "risk": "Hardcoded credentials can be committed to version control repositories, making them accessible to anyone with repository access and leading to complete account compromise.",
        "remediation": "Do not store AWS credentials in your Terraform files. Use environment variables or IAM roles instead.\n\nRecommended Fix:\n- Remove access_key and secret_key from the provider block.\n- Configure AWS credentials using environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) or a shared credentials file (~/.aws/credentials).\n- For production, use IAM Roles."
    },
    {
        "id": "AWS-002",
        "name": "S3 Public Access",
        "severity": "CRITICAL",
        "cloud": "AWS",
        "category": "Storage / Data Protection",
        "description": "S3 bucket is configured with a public ACL (like 'public-read' or 'public-read-write'), exposing data to the public internet.",
        "patterns": [
            r"acl\s*=\s*\"public-read\"",
            r"acl\s*=\s*\"public-read-write\""
        ],
        "fix": "Set acl = 'private' and use aws_s3_bucket_public_access_block.",
        "risk": "Publicly accessible S3 buckets are a leading cause of data breaches, exposing sensitive organizational or customer data to anyone on the internet.",
        "remediation": "Configure S3 bucket ACLs to 'private' and block public access explicitly.\n\nRecommended Fix:\n- Change acl to \"private\" in the aws_s3_bucket resource.\n- Attach an aws_s3_bucket_public_access_block resource to ensure all public access is blocked."
    },
    {
        "id": "AWS-003",
        "name": "Open Security Group (0.0.0.0/0)",
        "severity": "HIGH",
        "cloud": "AWS",
        "category": "Networking / Firewalls",
        "description": "Security group rules allow ingress traffic from any IP address (0.0.0.0/0) on sensitive ports or protocols.",
        "patterns": [
            r"cidr_blocks\s*=\s*\[\s*\"0\.0\.0\.0/0\"\s*\]"
        ],
        "fix": "Restrict cidr_blocks to specific IP ranges or VPC subnets.",
        "risk": "Unrestricted ingress allows attackers anywhere on the internet to attempt to connect to internal resources, increasing the attack surface.",
        "remediation": "Remove the 0.0.0.0/0 ingress rule and replace it with restricted CIDR blocks representing your corporate network or specific authorized IPs."
    },
    {
        "id": "AWS-004",
        "name": "IAM Wildcard Actions",
        "severity": "HIGH",
        "cloud": "AWS",
        "category": "IAM / Access Control",
        "description": "IAM policies grant permissions using a wildcard (*) action, giving excessive access rights.",
        "patterns": [
            r"actions\s*=\s*\[\s*\"\*\"\s*\]",
            r"\"Action\"\s*:\s*\"\\*\""
        ],
        "fix": "Specify precise IAM actions instead of wildcards.",
        "risk": "Wildcard policies violate the principle of least privilege, enabling users or services to perform unintended actions and escalate privileges.",
        "remediation": "Define specific actions (e.g., s3:GetObject, ec2:DescribeInstances) instead of using \"*\" in your policy document."
    },
    {
        "id": "AWS-005",
        "name": "RDS Public Access",
        "severity": "HIGH",
        "cloud": "AWS",
        "category": "Database / Security",
        "description": "RDS database instances are set to public, allowing connection attempts from outside the VPC.",
        "patterns": [
            r"publicly_accessible\s*=\s*true"
        ],
        "fix": "Set publicly_accessible = false and deploy database in private subnets.",
        "risk": "Exposing databases to the internet makes them targets for brute force attacks and exposes data to potential interception.",
        "remediation": "Change publicly_accessible to false in your aws_db_instance configuration, and use security groups and bastions/VPNs for administrative access."
    },
    {
        "id": "AWS-006",
        "name": "Hardcoded Password",
        "severity": "CRITICAL",
        "cloud": "AWS",
        "category": "Security Best Practices",
        "description": "Plaintext passwords hardcoded in resources like databases, virtual machines, or local variables.",
        "patterns": [
            r"password\s*=\s*\"(?![vV]ar\.)([^\"]+)\""
        ],
        "fix": "Pass passwords via secure input variables or load them from Secrets Manager.",
        "risk": "Hardcoded passwords in infrastructure code are exposed to developers, CI/CD runners, and potentially the public, leading to unauthorized database access.",
        "remediation": "Remove the plaintext password. Declare a variable for the password and set it dynamically, or use dynamic data blocks to retrieve it from Secrets Manager/HashiCorp Vault."
    },
    {
        "id": "AWS-007",
        "name": "S3 Encryption Disabled",
        "severity": "MEDIUM",
        "cloud": "AWS",
        "category": "Storage / Encryption",
        "description": "S3 bucket does not have server-side encryption configured to encrypt data at rest.",
        "patterns": [
            # Check for lack of server-side encryption or explicit disable
            r"sse_algorithm\s*=\s*\"none\"",
            r"encryption_disabled\s*=\s*true"
        ],
        "fix": "Add aws_s3_bucket_server_side_encryption_configuration to configure AES256 or KMS.",
        "risk": "Unencrypted buckets pose a compliance risk and fail to protect data at rest in the event of hardware theft or unauthorized access inside AWS.",
        "remediation": "Add an aws_s3_bucket_server_side_encryption_configuration block referencing the bucket to enforce AES256 or aws:kms encryption."
    },
    {
        "id": "AWS-008",
        "name": "CloudTrail Logging Disabled",
        "severity": "MEDIUM",
        "cloud": "AWS",
        "category": "Logging / Audit",
        "description": "CloudTrail auditing is disabled or not configured to record API activities.",
        "patterns": [
            r"enable_logging\s*=\s*false"
        ],
        "fix": "Set enable_logging = true in your aws_cloudtrail resource.",
        "risk": "Disabling logging prevents security teams from performing incident response, auditing API usage, or detecting active breaches in the cloud account.",
        "remediation": "Ensure enable_logging is set to true on all aws_cloudtrail configurations."
    },
    {
        "id": "GCP-001",
        "name": "Open Firewall Rule",
        "severity": "CRITICAL",
        "cloud": "GCP",
        "category": "Networking / Firewalls",
        "description": "GCP firewall rule allows unrestricted inbound access from all internet IP addresses (0.0.0.0/0).",
        "patterns": [
            r"source_ranges\s*=\s*\[\s*\"0\.0\.0\.0/0\"\s*\]"
        ],
        "fix": "Restrict source_ranges to corporate networks or authorized IP addresses.",
        "risk": "Open firewalls expose internal virtual machines and database ports to direct internet scans and exploit attempts.",
        "remediation": "Define specific IP ranges in source_ranges rather than allowing 0.0.0.0/0 for ingress firewall rules."
    },
    {
        "id": "GCP-002",
        "name": "Public GCS Bucket",
        "severity": "CRITICAL",
        "cloud": "GCP",
        "category": "Storage / Access Control",
        "description": "Google Cloud Storage bucket has allUsers or allAuthenticatedUsers roles assigned, exposing data publicly.",
        "patterns": [
            r"member\s*=\s*\"allUsers\"",
            r"member\s*=\s*\"allAuthenticatedUsers\""
        ],
        "fix": "Remove public members from GCS IAM bindings.",
        "risk": "Exposing storage buckets publicly allows anonymous users to download and inspect corporate documents, backups, and user uploads.",
        "remediation": "Use fine-grained IAM controls and avoid binding allUsers or allAuthenticatedUsers to roles like storage.objectViewer or storage.admin."
    },
    {
        "id": "GCP-003",
        "name": "Cloud SQL Public IP",
        "severity": "HIGH",
        "cloud": "GCP",
        "category": "Database / Networking",
        "description": "Cloud SQL instance enables public IP and has no authorized networks configured.",
        "patterns": [
            r"ipv4_enabled\s*=\s*true"
        ],
        "fix": "Disable ipv4_enabled or define specific authorized networks.",
        "risk": "Exposing Cloud SQL instances over public IPs increases threat exposure and leaves the database vulnerable to brute force and zero-day connection exploits.",
        "remediation": "Set ipv4_enabled to false and configure Private IP (Private Service Connection) for internal database access."
    },
    {
        "id": "GCP-004",
        "name": "GCP Storage Bucket Logging Disabled",
        "severity": "MEDIUM",
        "cloud": "GCP",
        "category": "Storage / Logging",
        "description": "Google Cloud Storage bucket does not have access logs enabled to track bucket access.",
        "patterns": [
            r"logging\s*\{\s*\n*\s*\}"
        ],
        "fix": "Configure a logging block to write access logs to a secure logs bucket.",
        "risk": "Lacking access logs prevents security teams from investigating unauthorized access to GCS data resources.",
        "remediation": "Add a logging configuration block specifying the log_bucket and log_object_prefix."
    },
    {
        "id": "AZ-001",
        "name": "HTTP-Only Storage",
        "severity": "HIGH",
        "cloud": "Azure",
        "category": "Storage / Encryption",
        "description": "Azure Storage Account allows insecure HTTP connections for data access.",
        "patterns": [
            r"enable_https_traffic_only\s*=\s*false"
        ],
        "fix": "Set enable_https_traffic_only = true in your storage account resource.",
        "risk": "Insecure HTTP connections are vulnerable to eavesdropping and man-in-the-middle attacks, exposing data in transit.",
        "remediation": "Enable secure transfer by setting enable_https_traffic_only to true in the azurerm_storage_account resource."
    },
    {
        "id": "AZ-002",
        "name": "Blob Public Access",
        "severity": "CRITICAL",
        "cloud": "Azure",
        "category": "Storage / Data Security",
        "description": "Azure Storage Account container or blob public access is enabled.",
        "patterns": [
            r"allow_blob_public_access\s*=\s*true",
            r"container_access_type\s*=\s*\"blob\"",
            r"container_access_type\s*=\s*\"container\""
        ],
        "fix": "Set allow_blob_public_access = false and container_access_type = 'private'.",
        "risk": "Anonymous read access allows anyone with the URL to download sensitive blob datasets.",
        "remediation": "Disable public access on the Storage Account and set container_access_type to \"private\"."
    },
    {
        "id": "AZ-003",
        "name": "Azure SQL Database Open to Internet",
        "severity": "HIGH",
        "cloud": "Azure",
        "category": "Database / Networking",
        "description": "Azure SQL firewall rule is configured to allow all external IP addresses (0.0.0.0 to 255.255.255.255).",
        "patterns": [
            r"start_ip_address\s*=\s*\"0\.0\.0\.0\"\s*,\s*end_ip_address\s*=\s*\"255\.255\.255\.255\""
        ],
        "fix": "Configure specific start and end IP addresses for authorized clients.",
        "risk": "Allowing all IP addresses bypasses firewall protection, making the database vulnerable to brute force and denial of service attacks.",
        "remediation": "Define firewall rules matching only authorized client ranges, or use service endpoints/private endpoints."
    },
    {
        "id": "K8S-001",
        "name": "Container Running as Root",
        "severity": "HIGH",
        "cloud": "Kubernetes",
        "category": "Container Security",
        "description": "Kubernetes pod container runs as the root user (UID 0), granting full root permissions inside the container.",
        "patterns": [
            r"runAsNonRoot\s*:\s*false",
            r"runAsUser\s*:\s*0"
        ],
        "fix": "Set runAsNonRoot: true and define a non-zero runAsUser (e.g. 1000).",
        "risk": "If a container is compromised, running as root makes host escape and privilege escalation significantly easier.",
        "remediation": "Configure securityContext with runAsNonRoot: true and runAsUser: 1000 in your pod or deployment specs."
    },
    {
        "id": "K8S-002",
        "name": "Privileged Container",
        "severity": "CRITICAL",
        "cloud": "Kubernetes",
        "category": "Container Security",
        "description": "Container is running with privileged mode enabled, giving it access to the host node's kernel and devices.",
        "patterns": [
            r"privileged\s*:\s*true"
        ],
        "fix": "Set privileged: false and request specific Linux capabilities instead.",
        "risk": "Privileged containers have almost the same access as the host machine, making container breakout trivial for an attacker.",
        "remediation": "Disable privileged mode (set privileged: false) and use caps-drop/add permissions if specific capabilities are required."
    },
    {
        "id": "K8S-003",
        "name": "Hardcoded Secret in Env",
        "severity": "HIGH",
        "cloud": "Kubernetes",
        "category": "Security Best Practices",
        "description": "Sensitive credentials or secrets are set as plaintext values in environment variables.",
        "patterns": [
            r"value\s*:\s*\"sk_live_[^\"]+\"",
            r"value\s*:\s*\"[a-zA-Z0-9_\-\.]{12,}\""
        ],
        "fix": "Use valueFrom referencing a Kubernetes Secret object.",
        "risk": "Environment variables are visible to developers, logs, and anyone with read access to the namespace, exposing credentials.",
        "remediation": "Create a Kubernetes Secret and reference it using the valueFrom.secretKeyRef field in your container spec."
    }
]

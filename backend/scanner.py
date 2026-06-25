# backend/scanner.py
import re
import os
import tempfile
import subprocess
import json
from backend.policies_data import POLICIES_LIST

def scan_with_regex(content: str, filename: str):
    violations = []
    lines = content.splitlines()
    
    for line_idx, line in enumerate(lines):
        line_num = line_idx + 1
        for policy in POLICIES_LIST:
            for pattern in policy["patterns"]:
                if re.search(pattern, line, re.IGNORECASE):
                    # Check if it's a false positive (e.g., referencing a variable like var.password or local.password)
                    if policy["id"] in ["AWS-006", "AWS-001"] and re.search(r"=\s*\"(?:var|local|module|aws_)\.", line, re.IGNORECASE):
                        continue
                        
                    # AWS-003 should not flag egress rules
                    if policy["id"] == "AWS-003":
                        # Check if inside egress block
                        inside_egress = False
                        for idx in range(line_idx, -1, -1):
                            if "egress {" in lines[idx]:
                                inside_egress = True
                                break
                            if "ingress {" in lines[idx] or "resource " in lines[idx]:
                                break
                        if inside_egress:
                            continue
                    
                    # Deduplicate: don't add the same policy on the same line multiple times
                    already_flagged = False
                    for v in violations:
                        if v["id"] == policy["id"] and v["line"] == line_num:
                            already_flagged = True
                            break
                    if already_flagged:
                        continue

                    # Extract context (2 lines before and 2 lines after)
                    start_ctx = max(0, line_idx - 2)
                    end_ctx = min(len(lines), line_idx + 3)
                    context_lines = []
                    for c_idx in range(start_ctx, end_ctx):
                        c_num = c_idx + 1
                        marker = "      # <-- Detected violation" if c_num == line_num else ""
                        context_lines.append(f"{c_num} | {lines[c_idx]}{marker}")
                    context_str = "\n".join(context_lines)

                    # Try to infer resource name
                    resource_name = "unknown"
                    # Look backwards to find the resource block
                    for search_idx in range(line_idx, -1, -1):
                        resource_match = re.search(r"resource\s+\"([^\"]+)\"\s+\"([^\"]+)\"", lines[search_idx])
                        if resource_match:
                            resource_name = f'{resource_match.group(1)} "{resource_match.group(2)}"'
                            break
                        provider_match = re.search(r"provider\s+\"([^\"]+)\"", lines[search_idx])
                        if provider_match:
                            resource_name = f'provider "{provider_match.group(1)}"'
                            break
                        # K8s object detection
                        kind_match = re.search(r"kind:\s*(\w+)", lines[search_idx])
                        if kind_match:
                            resource_name = kind_match.group(1)
                            break

                    violations.append({
                        "id": policy["id"],
                        "name": policy["name"],
                        "severity": policy["severity"],
                        "cloud": policy["cloud"],
                        "category": policy["category"],
                        "line": line_num,
                        "code": line.strip(),
                        "context": context_str,
                        "resource": resource_name,
                        "message": policy["description"],
                        "fix": policy["fix"],
                        "remediation": policy["remediation"]
                    })
                    break # Matches one pattern, no need to check other patterns for this policy on this line
    return violations

def scan_with_checkov(content: str, filename: str):
    # Try importing checkov or running via subprocess if installed
    # In a local sandbox we can check if checkov command is available.
    try:
        # Check if checkov is installed
        result = subprocess.run(["checkov", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            return None
    except Exception:
        return None

    # Checkov is available, run it on a temp file
    suffix = ".tf" if filename.endswith(".tf") else (".yaml" if filename.endswith((".yaml", ".yml")) else ".tf")
    with tempfile.NamedTemporaryFile(mode='w', suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_name = tmp.name

    try:
        # Run checkov in JSON format
        cmd = ["checkov", "-f", tmp_name, "-o", "json", "--quiet"]
        checkov_run = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if not checkov_run.stdout.strip():
            return None
            
        data = json.loads(checkov_run.stdout)
        
        # Checkov output can be a list or a dict
        results = []
        if isinstance(data, dict):
            results = [data]
        elif isinstance(data, list):
            results = data
            
        violations = []
        for res in results:
            check_results = res.get("results", {})
            failed_checks = check_results.get("failed_checks", [])
            for check in failed_checks:
                # Map Checkov results to our format
                # We can also cross-reference checks to our custom IDs if they match
                check_id = check.get("check_id")
                check_name = check.get("check_name")
                file_line_range = check.get("file_line_range", [1, 1])
                line_num = file_line_range[0]
                code_block = check.get("code_block", [])
                
                # Format context
                context_str = "\n".join([f"{l[0]} | {l[1]}" for l in code_block])
                
                severity = "MEDIUM"
                if "critical" in check_name.lower() or "credential" in check_name.lower():
                    severity = "CRITICAL"
                elif "high" in check_name.lower() or "public" in check_name.lower():
                    severity = "HIGH"
                elif "low" in check_name.lower():
                    severity = "LOW"
                    
                violations.append({
                    "id": f"CKV-{check_id}",
                    "name": check_name,
                    "severity": severity,
                    "cloud": "Multi-Cloud",
                    "category": check.get("check_category", "Security"),
                    "line": line_num,
                    "code": code_block[0][1] if code_block else "",
                    "context": context_str,
                    "resource": check.get("resource", "unknown"),
                    "message": check_name,
                    "fix": "Refer to Checkov documentation for remediation steps.",
                    "remediation": f"Checkov violation found. Follow standard policy configurations.\n\nRecommended Fix:\n- Refer to Checkov ID: {check_id} documentation."
                })
        return violations
    except Exception:
        return None
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def compute_summary(violations):
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "total": len(violations)
    }
    for v in violations:
        sev = v["severity"].lower()
        if sev in summary:
            summary[sev] += 1
    return summary

def scan_file(content: str, filename: str, cloud: str = "AWS"):
    # Try Checkov first
    violations = scan_with_checkov(content, filename)
    engine = "checkov"
    
    # Fallback to regex
    if violations is None:
        violations = scan_with_regex(content, filename)
        engine = "built-in"
        
    return {
        "violations": violations,
        "summary": compute_summary(violations),
        "engine": engine
    }

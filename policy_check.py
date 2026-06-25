#!/usr/bin/env python3
# policy_check.py - Standalone CLI Policy Scanner
import os
import sys
from datetime import datetime

# Add root folder to python path to allow importing backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.scanner import scan_file

# ANSI Colors
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_header(filename, provider):
    print(f"{BOLD}[*] PolicySync v1.2.0 - Scanning configuration...{RESET}")
    print(f"[*] File: {filename}")
    print(f"[*] Provider: {provider}   Region: us-east-1")
    print(f"[*] Scan Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("======================================\n")

def run_cli_scan(path):
    if not os.path.exists(path):
        print(f"{RED}Error: Path '{path}' does not exist.{RESET}")
        sys.exit(2)
        
    files_to_scan = []
    if os.path.isdir(path):
        for root, _, files in os.walk(path):
            for file in files:
                if file.endswith((".tf", ".yaml", ".yml")):
                    files_to_scan.append(os.path.join(root, file))
    else:
        files_to_scan.append(path)
        
    if not files_to_scan:
        print(f"{YELLOW}No Terraform (.tf) or Kubernetes (.yaml/.yml) files found to scan.{RESET}")
        sys.exit(0)
        
    total_summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0, "passed": 0}
    violations_found = []
    
    for file_path in files_to_scan:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"{RED}Could not read file {file_path}: {e}{RESET}")
            continue
            
        # Determine cloud/provider based on file suffix or folder name
        cloud = "AWS"
        if "gcp" in file_path.lower():
            cloud = "GCP"
        elif "azure" in file_path.lower() or "az" in file_path.lower():
            cloud = "Azure"
        elif "k8s" in file_path.lower() or "kube" in file_path.lower() or file_path.endswith((".yaml", ".yml")):
            cloud = "Kubernetes"
            
        result = scan_file(content, os.path.basename(file_path), cloud)
        
        # Display header for the scan
        print_header(file_path, cloud)
        
        if result["violations"]:
            print(f"{RED}======================================{RESET}")
            print(f"{RED}{BOLD}[!] VIOLATION FOUND ({len(result['violations'])}){RESET}")
            print(f"{RED}======================================{RESET}")
            
            for v in result["violations"]:
                violations_found.append(v)
                sev_color = RED if v["severity"] in ["CRITICAL", "HIGH"] else YELLOW
                print(f"{sev_color}{BOLD}[{v['severity']}] {v['id']}: {v['name']}{RESET}")
                print(f"File       : {file_path}")
                print(f"Line       : {v['line']}")
                print(f"Resource   : {v['resource']}")
                print(f"Message    : {v['message']}")
                print(f"Severity   : {v['severity']}")
                print(f"Category   : {v['category']}")
                print("-" * 40)
                print(v["context"])
                print("-" * 40)
                print(f"{GREEN}💡 How to Fix{RESET}")
                print(f"{GREEN}============={RESET}")
                print(v["remediation"])
                print("======================================\n")
                
            total_summary["critical"] += result["summary"]["critical"]
            total_summary["high"] += result["summary"]["high"]
            total_summary["medium"] += result["summary"]["medium"]
            total_summary["low"] += result["summary"]["low"]
            total_summary["total"] += result["summary"]["total"]
        else:
            print(f"{GREEN}✔ No violations found.{RESET}")
            print("======================================\n")
            total_summary["passed"] += 1
            
    # Print overall execution summary
    status_color = RED if total_summary["total"] > 0 else GREEN
    print(f"{status_color}{BOLD}Scan Summary: {total_summary['total']} violations found "
          f"({total_summary['critical']} CRITICAL, "
          f"{total_summary['high']} HIGH, "
          f"{total_summary['medium']} MEDIUM, "
          f"{total_summary['low']} LOW, "
          f"{total_summary['passed']} PASSED){RESET}")
          
    if total_summary["total"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python3 {sys.argv[0]} [scan] <file_or_directory_path>")
        sys.exit(1)
        
    path_arg = sys.argv[2] if sys.argv[1] == "scan" and len(sys.argv) > 2 else sys.argv[1]
    run_cli_scan(path_arg)

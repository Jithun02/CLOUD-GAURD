# backend/test_scanner.py
import unittest
from backend.scanner import scan_file

class TestPolicySyncScanner(unittest.TestCase):
    def test_hardcoded_aws_credentials(self):
        content = """
        provider "aws" {
          region     = "us-east-1"
          access_key = "AKIAIDSFODNN7EXAMPLE"
          secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
        """
        result = scan_file(content, "main.tf")
        violations = result["violations"]
        
        # Verify AWS-001 is found and is CRITICAL
        cred_violations = [v for v in violations if v["id"] == "AWS-001"]
        self.assertTrue(len(cred_violations) > 0)
        self.assertEqual(cred_violations[0]["severity"], "CRITICAL")

    def test_public_s3_bucket(self):
        content = """
        resource "aws_s3_bucket" "b" {
          bucket = "my-bucket"
          acl    = "public-read"
        }
        """
        result = scan_file(content, "main.tf")
        violations = result["violations"]
        
        # Verify AWS-002 S3 Public Access is CRITICAL
        s3_violations = [v for v in violations if v["id"] == "AWS-002"]
        self.assertTrue(len(s3_violations) > 0)
        self.assertEqual(s3_violations[0]["severity"], "CRITICAL")

    def test_open_security_group(self):
        content = """
        resource "aws_security_group" "allow_all" {
          ingress {
            cidr_blocks = ["0.0.0.0/0"]
          }
        }
        """
        result = scan_file(content, "main.tf")
        violations = result["violations"]
        
        # Verify AWS-003 Open SG is HIGH
        sg_violations = [v for v in violations if v["id"] == "AWS-003"]
        self.assertTrue(len(sg_violations) > 0)
        self.assertEqual(sg_violations[0]["severity"], "HIGH")

    def test_privileged_kubernetes_container(self):
        content = """
        apiVersion: v1
        kind: Pod
        metadata:
          name: security-context-demo
        spec:
          containers:
          - name: sec-ctx-demo
            image: gcr.io/google-samples/node-hello:1.0
            securityContext:
              privileged: true
        """
        result = scan_file(content, "pod.yaml")
        violations = result["violations"]
        
        # Verify K8S-002 Privileged Container is CRITICAL
        k8s_violations = [v for v in violations if v["id"] == "K8S-002"]
        self.assertTrue(len(k8s_violations) > 0)
        self.assertEqual(k8s_violations[0]["severity"], "CRITICAL")

    def test_clean_configuration(self):
        content = """
        provider "aws" {
          region = "us-east-1"
        }
        resource "aws_s3_bucket" "private_bucket" {
          bucket = "my-private-bucket"
          acl    = "private"
        }
        resource "aws_security_group" "restricted" {
          ingress {
            cidr_blocks = ["10.0.0.0/16"]
          }
        }
        """
        result = scan_file(content, "main.tf")
        violations = result["violations"]
        self.assertEqual(len(violations), 0)

if __name__ == "__main__":
    unittest.main()

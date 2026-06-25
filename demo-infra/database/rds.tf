# database/rds.tf
# Violations: AWS-005 HIGH, AWS-006 CRITICAL, AWS-003 HIGH

resource "aws_security_group" "db_sg" {
  name        = "db-security-group"
  description = "Security group for database"
  vpc_id      = "vpc-123456"

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # HIGH: Open database port to the internet
  }
}

resource "aws_db_instance" "production_db" {
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "13.4"
  instance_class         = "db.t3.micro"
  name                   = "production_db"
  username               = "db_admin"
  password               = "db_password_123_unsafe!" # CRITICAL: Hardcoded plaintext password
  publicly_accessible    = true                      # HIGH: Publicly accessible database
  vpc_security_group_ids = [aws_security_group.db_sg.id]
}

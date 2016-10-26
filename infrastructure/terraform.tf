data "terraform_remote_state" "main" {
  backend = "s3"
  config {
    bucket = "terraform.sparks.network"
    key = "terraform.tfstate"
  }
}


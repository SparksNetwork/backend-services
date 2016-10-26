data "terraform_remote_state" "terraform" {
  backend = "s3"
  config {
    bucket = "terraform.sparks.network"
    key = "terraform.tfstate"
  }
}


output "firebase_credentials_bucket" {
  value = "${data.terraform_remote_state.main.firebase_credentials_bucket}"
}
output "firebase_credentials_key" {
  value = "${data.terraform_remote_state.main.firebase_credentials_key}"
}
output "firebase_credentials_kms_arn" {
  value = "${data.terraform_remote_state.main.firebase_credentials_kms_arn}"
}

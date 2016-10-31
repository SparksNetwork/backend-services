output "firebase_credentials_bucket" {
  value = "${data.terraform_remote_state.main.firebase_credentials_bucket}"
}
output "firebase_credentials_key" {
  value = "${data.terraform_remote_state.main.firebase_credentials_key}"
}
output "braintree_credentials_bucket" {
  value = "${data.terraform_remote_state.main.braintree_credentials_bucket}"
}
output "braintree_credentials_key" {
  value = "${data.terraform_remote_state.main.braintree_credentials_key}"
}
output "credentials_kms_arn" {
  value = "${data.terraform_remote_state.main.credentials_kms_arn}"
}


resource "aws_lambda_event_source_mapping" "arrivals-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "arrivals"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "commitments-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "commitments"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "assignments-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "assignments"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagements-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "engagements"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsNotifications-data_firebase" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "engagementsNotifications"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsPayment-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "engagementsPayment"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsPaymentToken-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "engagementsPaymentToken"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "firebase-data_firebase" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "firebase"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsReclaim-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "engagementsReclaim"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "fulfillers-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "fulfillers"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "gatewayCustomer-data_firebase" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "gatewayCustomer"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "memberships-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "memberships"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "organizers-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "organizers"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "opps-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "opps"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "projects-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "projects"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "profiles-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "profiles"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "s3Writer-data_firebase" {
  batch_size        = 25
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "s3Writer"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "sendgrid-data_emails" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_emails_arn}"
  enabled           = true
  function_name     = "sendgrid"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "teams-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "teams"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "users-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "users"
  starting_position = "LATEST"
}


resource "aws_lambda_event_source_mapping" "arrivals-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_arrivals}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "assignments-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_assignments}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagements-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_engagements}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsNotifications-data_firebase" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "${var.apex_function_engagementsNotifications}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "commitments-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_commitments}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsPayment-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_engagementsPayment}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsPaymentToken-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_engagementsPaymentToken}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "engagementsReclaim-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_engagementsReclaim}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "firebase-data_firebase" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "${var.apex_function_firebase}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "fulfillers-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_fulfillers}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "gatewayCustomer-data_firebase" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "${var.apex_function_gatewayCustomer}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "memberships-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_memberships}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "opps-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_opps}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "organizers-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_organizers}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "projects-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_projects}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "profiles-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_profiles}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "s3Writer-data_firebase" {
  batch_size        = 25
  event_source_arn  = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled           = true
  function_name     = "${var.apex_function_s3Writer}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "sendgrid-data_emails" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.data_emails_arn}"
  enabled           = true
  function_name     = "${var.apex_function_sendgrid}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "teams-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_teams}"
  starting_position = "LATEST"
}

resource "aws_lambda_event_source_mapping" "users-commands" {
  batch_size        = 1
  event_source_arn  = "${data.terraform_remote_state.main.commands_arn}"
  enabled           = true
  function_name     = "${var.apex_function_users}"
  starting_position = "LATEST"
}

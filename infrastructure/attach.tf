resource "aws_lambda_event_source_mapping" "arrivals-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.arrivals.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.arrivals-stream"]
}
resource "aws_lambda_event_source_mapping" "assignments-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.assignments.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.assignments-stream"]
}
resource "aws_lambda_event_source_mapping" "commitments-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.commitments.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.commitments-stream"]
}
resource "aws_lambda_event_source_mapping" "engagements-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.engagements.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.engagements-stream"]
}
resource "aws_lambda_event_source_mapping" "engagementsNotifications-data_firebase" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled = true
  function_name = "${aws_lambda_function.engagementsNotifications.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.engagementsNotifications-stream"]
}
resource "aws_lambda_event_source_mapping" "engagementsPayment-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.engagementsPayment.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.engagementsPayment-stream"]
}
resource "aws_lambda_event_source_mapping" "engagementsPaymentToken-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.engagementsPaymentToken.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.engagementsPaymentToken-stream"]
}
resource "aws_lambda_event_source_mapping" "engagementsReclaim-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.engagementsReclaim.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.engagementsReclaim-stream"]
}
resource "aws_lambda_event_source_mapping" "firebase-data_firebase" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled = true
  function_name = "${aws_lambda_function.firebase.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.firebase-stream"]
}
resource "aws_lambda_event_source_mapping" "fulfillers-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.fulfillers.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.fulfillers-stream"]
}
resource "aws_lambda_event_source_mapping" "gatewayCustomer-data_firebase" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled = true
  function_name = "${aws_lambda_function.gatewayCustomer.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.gatewayCustomer-stream"]
}
resource "aws_lambda_event_source_mapping" "memberships-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.memberships.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.memberships-stream"]
}
resource "aws_lambda_event_source_mapping" "opps-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.opps.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.opps-stream"]
}
resource "aws_lambda_event_source_mapping" "organizers-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.organizers.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.organizers-stream"]
}
resource "aws_lambda_event_source_mapping" "profiles-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.profiles.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.profiles-stream"]
}
resource "aws_lambda_event_source_mapping" "projects-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.projects.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.projects-stream"]
}
resource "aws_lambda_event_source_mapping" "s3Writer-data_firebase" {
  batch_size = 25
  event_source_arn = "${data.terraform_remote_state.main.data_firebase_arn}"
  enabled = true
  function_name = "${aws_lambda_function.s3Writer.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.s3Writer-stream"]
}
resource "aws_lambda_event_source_mapping" "sendgrid-data_emails" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.data_emails_arn}"
  enabled = true
  function_name = "${aws_lambda_function.sendgrid.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.sendgrid-stream"]
}
resource "aws_lambda_event_source_mapping" "teams-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.teams.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.teams-stream"]
}
resource "aws_lambda_event_source_mapping" "users-commands" {
  batch_size = 1
  event_source_arn = "${data.terraform_remote_state.main.commands_arn}"
  enabled = true
  function_name = "${aws_lambda_function.users.arn}"
  starting_position = "LATEST"
  depends_on = ["aws_iam_role_policy.users-stream"]
}

resource "aws_lambda_function" "arrivals" {
  filename = "../dist/arrivals.zip"
  function_name = "sparks_arrivals"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.arrivals.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/arrivals.zip"))}"
}
resource "aws_lambda_function" "assignments" {
  filename = "../dist/assignments.zip"
  function_name = "sparks_assignments"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.assignments.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/assignments.zip"))}"
}
resource "aws_lambda_function" "commitments" {
  filename = "../dist/commitments.zip"
  function_name = "sparks_commitments"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.commitments.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/commitments.zip"))}"
}
resource "aws_lambda_function" "engagements" {
  filename = "../dist/engagements.zip"
  function_name = "sparks_engagements"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.engagements.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/engagements.zip"))}"
}
resource "aws_lambda_function" "engagementsNotifications" {
  filename = "../dist/engagementsNotifications.zip"
  function_name = "sparks_engagementsNotifications"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.engagementsNotifications.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/engagementsNotifications.zip"))}"
}
resource "aws_lambda_function" "engagementsPayment" {
  filename = "../dist/engagementsPayment.zip"
  function_name = "sparks_engagementsPayment"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.engagementsPayment.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/engagementsPayment.zip"))}"
}
resource "aws_lambda_function" "engagementsPaymentToken" {
  filename = "../dist/engagementsPaymentToken.zip"
  function_name = "sparks_engagementsPaymentToken"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.engagementsPaymentToken.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/engagementsPaymentToken.zip"))}"
}
resource "aws_lambda_function" "engagementsReclaim" {
  filename = "../dist/engagementsReclaim.zip"
  function_name = "sparks_engagementsReclaim"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.engagementsReclaim.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/engagementsReclaim.zip"))}"
}
resource "aws_lambda_function" "firebase" {
  filename = "../dist/firebase.zip"
  function_name = "sparks_firebase"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.firebase.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/firebase.zip"))}"
}
resource "aws_lambda_function" "fulfillers" {
  filename = "../dist/fulfillers.zip"
  function_name = "sparks_fulfillers"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.fulfillers.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/fulfillers.zip"))}"
}
resource "aws_lambda_function" "gatewayCustomer" {
  filename = "../dist/gatewayCustomer.zip"
  function_name = "sparks_gatewayCustomer"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.gatewayCustomer.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/gatewayCustomer.zip"))}"
}
resource "aws_lambda_function" "memberships" {
  filename = "../dist/memberships.zip"
  function_name = "sparks_memberships"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.memberships.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/memberships.zip"))}"
}
resource "aws_lambda_function" "notifications" {
  filename = "../dist/notifications.zip"
  function_name = "sparks_notifications"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.notifications.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/notifications.zip"))}"
}
resource "aws_lambda_function" "opps" {
  filename = "../dist/opps.zip"
  function_name = "sparks_opps"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.opps.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/opps.zip"))}"
}
resource "aws_lambda_function" "organizers" {
  filename = "../dist/organizers.zip"
  function_name = "sparks_organizers"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.organizers.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/organizers.zip"))}"
}
resource "aws_lambda_function" "profiles" {
  filename = "../dist/profiles.zip"
  function_name = "sparks_profiles"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.profiles.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/profiles.zip"))}"
}
resource "aws_lambda_function" "projects" {
  filename = "../dist/projects.zip"
  function_name = "sparks_projects"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.projects.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/projects.zip"))}"
}
resource "aws_lambda_function" "s3Writer" {
  filename = "../dist/s3Writer.zip"
  function_name = "sparks_s3Writer"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.s3Writer.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/s3Writer.zip"))}"
}
resource "aws_lambda_function" "sendgrid" {
  filename = "../dist/sendgrid.zip"
  function_name = "sparks_sendgrid"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.sendgrid.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/sendgrid.zip"))}"
}
resource "aws_lambda_function" "teams" {
  filename = "../dist/teams.zip"
  function_name = "sparks_teams"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.teams.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/teams.zip"))}"
}
resource "aws_lambda_function" "users" {
  filename = "../dist/users.zip"
  function_name = "sparks_users"
  handler = "_apex_index.handle"
  role = "${aws_iam_role.users.arn}"
  memory_size = 256
  runtime = "nodejs4.3"
  timeout = 10
  source_code_hash = "${base64sha256(file("../dist/users.zip"))}"
}

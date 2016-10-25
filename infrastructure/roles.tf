resource "aws_iam_role" "arrivals" {
  name_prefix = "arrivals"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "arrivals-stream" {
  name = "commands"
  role = "${aws_iam_role.arrivals.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "assignments" {
  name_prefix = "assignments"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "assignments-stream" {
  name = "commands"
  role = "${aws_iam_role.assignments.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "commitments" {
  name_prefix = "commitments"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "commitments-stream" {
  name = "commands"
  role = "${aws_iam_role.commitments.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "engagements" {
  name_prefix = "engagements"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "engagements-stream" {
  name = "commands"
  role = "${aws_iam_role.engagements.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "engagementsNotifications" {
  name_prefix = "engagementsNotifications"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "engagementsNotifications-stream" {
  name = "data_firebase"
  role = "${aws_iam_role.engagementsNotifications.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.data_firebase_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "engagementsPayment" {
  name_prefix = "engagementsPayment"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "engagementsPayment-stream" {
  name = "commands"
  role = "${aws_iam_role.engagementsPayment.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "engagementsPaymentToken" {
  name_prefix = "engagementsPaymentToken"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "engagementsPaymentToken-stream" {
  name = "commands"
  role = "${aws_iam_role.engagementsPaymentToken.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "engagementsReclaim" {
  name_prefix = "engagementsReclaim"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "engagementsReclaim-stream" {
  name = "commands"
  role = "${aws_iam_role.engagementsReclaim.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "firebase" {
  name_prefix = "firebase"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "firebase-stream" {
  name = "data_firebase"
  role = "${aws_iam_role.firebase.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.data_firebase_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "fulfillers" {
  name_prefix = "fulfillers"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "fulfillers-stream" {
  name = "commands"
  role = "${aws_iam_role.fulfillers.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "gatewayCustomer" {
  name_prefix = "gatewayCustomer"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "gatewayCustomer-stream" {
  name = "data_firebase"
  role = "${aws_iam_role.gatewayCustomer.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.data_firebase_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "memberships" {
  name_prefix = "memberships"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "memberships-stream" {
  name = "commands"
  role = "${aws_iam_role.memberships.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "notifications" {
  name_prefix = "notifications"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role" "opps" {
  name_prefix = "opps"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "opps-stream" {
  name = "commands"
  role = "${aws_iam_role.opps.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "organizers" {
  name_prefix = "organizers"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "organizers-stream" {
  name = "commands"
  role = "${aws_iam_role.organizers.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "profiles" {
  name_prefix = "profiles"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "profiles-stream" {
  name = "commands"
  role = "${aws_iam_role.profiles.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "projects" {
  name_prefix = "projects"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "projects-stream" {
  name = "commands"
  role = "${aws_iam_role.projects.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "s3Writer" {
  name_prefix = "s3Writer"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "s3Writer-stream" {
  name = "data_firebase"
  role = "${aws_iam_role.s3Writer.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.data_firebase_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "sendgrid" {
  name_prefix = "sendgrid"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "sendgrid-stream" {
  name = "data_emails"
  role = "${aws_iam_role.sendgrid.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.data_emails_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "teams" {
  name_prefix = "teams"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "teams-stream" {
  name = "commands"
  role = "${aws_iam_role.teams.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}
resource "aws_iam_role" "users" {
  name_prefix = "users"
  path = "/"
  assume_role_policy = "${file("policies/lambda.json")}"
  lifecycle {
    create_before_destroy = true
}
}
resource "aws_iam_role_policy" "users-stream" {
  name = "commands"
  role = "${aws_iam_role.users.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:ListStreams",
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.commands_arn}"
      ]
    }
  ]
}
JSON
}

















resource "aws_iam_role_policy" "s3Writer-custom" {
  name = "custom"
  role = "${aws_iam_role.s3Writer.id}"
  policy = <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:*"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.streams.arn}"
      ]
    }
  ]
}
JSON
}



resource "aws_iam_policy_attachment" "logs" {
  name = "logs"
  policy_arn = "${aws_iam_policy.logs.arn}"
  roles = ["${aws_iam_role.arrivals.id}", "${aws_iam_role.assignments.id}", "${aws_iam_role.commitments.id}", "${aws_iam_role.engagements.id}", "${aws_iam_role.engagementsNotifications.id}", "${aws_iam_role.engagementsPayment.id}", "${aws_iam_role.engagementsPaymentToken.id}", "${aws_iam_role.engagementsReclaim.id}", "${aws_iam_role.firebase.id}", "${aws_iam_role.fulfillers.id}", "${aws_iam_role.gatewayCustomer.id}", "${aws_iam_role.memberships.id}", "${aws_iam_role.notifications.id}", "${aws_iam_role.opps.id}", "${aws_iam_role.organizers.id}", "${aws_iam_role.profiles.id}", "${aws_iam_role.projects.id}", "${aws_iam_role.s3Writer.id}", "${aws_iam_role.sendgrid.id}", "${aws_iam_role.teams.id}", "${aws_iam_role.users.id}"]
}
resource "aws_iam_policy_attachment" "write-to-data-firebase" {
  name = "write-to-data-firebase-attachment"
  policy_arn = "${aws_iam_policy.write-to-data-firebase.arn}"
  roles = ["${aws_iam_role.arrivals.id}", "${aws_iam_role.assignments.id}", "${aws_iam_role.commitments.id}", "${aws_iam_role.engagements.id}", "${aws_iam_role.engagementsNotifications.id}", "${aws_iam_role.engagementsPayment.id}", "${aws_iam_role.engagementsPaymentToken.id}", "${aws_iam_role.engagementsReclaim.id}", "${aws_iam_role.firebase.id}", "${aws_iam_role.fulfillers.id}", "${aws_iam_role.gatewayCustomer.id}", "${aws_iam_role.memberships.id}", "${aws_iam_role.notifications.id}", "${aws_iam_role.opps.id}", "${aws_iam_role.organizers.id}", "${aws_iam_role.profiles.id}", "${aws_iam_role.projects.id}", "${aws_iam_role.s3Writer.id}", "${aws_iam_role.sendgrid.id}", "${aws_iam_role.teams.id}", "${aws_iam_role.users.id}"]
}
resource "aws_iam_policy_attachment" "write-to-data-emails" {
  name = "write-to-data-emails-attachment"
  policy_arn = "${aws_iam_policy.write-to-data-emails.arn}"
  roles = ["${aws_iam_role.arrivals.id}", "${aws_iam_role.assignments.id}", "${aws_iam_role.commitments.id}", "${aws_iam_role.engagements.id}", "${aws_iam_role.engagementsNotifications.id}", "${aws_iam_role.engagementsPayment.id}", "${aws_iam_role.engagementsPaymentToken.id}", "${aws_iam_role.engagementsReclaim.id}", "${aws_iam_role.firebase.id}", "${aws_iam_role.fulfillers.id}", "${aws_iam_role.gatewayCustomer.id}", "${aws_iam_role.memberships.id}", "${aws_iam_role.notifications.id}", "${aws_iam_role.opps.id}", "${aws_iam_role.organizers.id}", "${aws_iam_role.profiles.id}", "${aws_iam_role.projects.id}", "${aws_iam_role.s3Writer.id}", "${aws_iam_role.sendgrid.id}", "${aws_iam_role.teams.id}", "${aws_iam_role.users.id}"]
}

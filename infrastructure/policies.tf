resource "aws_iam_policy" "logs" {
  name = "lambda-logs"
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:*"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "write-to-data-firebase" {
  name = "write-to-data-firebase"
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:PutRecord",
        "kinesis:PutRecords",
        "kinesis:DescribeStream"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.data_firebase_arn}"
      ]
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "write-to-data-emails" {
  name = "write-to-data-emails"
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "kinesis:PutRecord",
        "kinesis:PutRecords",
        "kinesis:DescribeStream"
      ],
      "Effect": "Allow",
      "Resource": [
        "${data.terraform_remote_state.main.data_emails_arn}"
      ]
    }
  ]
}
POLICY
}


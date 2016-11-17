# resource "aws_sns_topic_subscription" "kafka-register" {
#   topic_arn = "${data.terraform_remote_state.main.kafka_asg_topic_arn}"
#   protocol = "lambda"
#   endpoint = "${aws_lambda_function.kafka-register.arn}"
#
#   depends_on = ["aws_lambda_permission.kafka-register"]
# }

resource "aws_lambda_permission" "kafka-register" {
  statement_id  = "AllowFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.kafka-register.function_name}"
  principal     = "sns.amazonaws.com"
  source_arn    = "${data.terraform_remote_state.main.kafka_asg_topic_arn}"
}

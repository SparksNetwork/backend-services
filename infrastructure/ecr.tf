resource "aws_ecr_repository" "invoker" {
  name = "invoker"
}

output "invoker_repository_url" {
  value = "${aws_ecr_repository.invoker.repository_url}"
}
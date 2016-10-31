resource "aws_s3_bucket" "streams" {
  bucket = "streams.sparks.network"
}

resource "aws_s3_bucket_object" "functions" {
  bucket = "terraform.sparks.network"
  key = "functions.json"
  source = "../dist/functions.json"
  content_type = "application/json"
  etag = "${md5(file("../dist/functions.json"))}"
}
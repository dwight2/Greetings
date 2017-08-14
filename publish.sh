#!/usr/bin/env bash
rm -rf lambda_upload.zip
zip -r lambda_upload.zip lambdaFun/index.js
aws lambda update-function-code --function-name ShowoffSkill --zip-file fileb://lambda_upload.zip

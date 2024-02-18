# deploy script for compiling lambda function and updating terraform state

function deploy {
  cd ../lambda/ && \
  npm i && \
  npm run build && \
  npm prune --production && \
  mkdir dist && \
  cp -r ./src/*.js dist/ && \
  cp -r ./node_modules dist/ && \
  cd dist && \
  find . -name "*.zip" -type f -delete && \
  zip -r ../../terraform/zips/image_processor_lambda.zip . && \
  cd .. && rm -rf dist && \
  cd ../terraform && \
  terraform plan && \
  terraform apply
}

deploy
# Add the executable file path of protobufjs-cli to the PATH environment variable
# Replace {absolute path of protobufjs-cli in your node_modules}/bin with the absolute path of protobufjs-cli in node_modules
export "PATH=$PATH:/Users/phucle/Documents/workspace/demo-video-call/node_modules/protobufjs-cli/bin"

# Generate JavaScript example code
pbjs -t json-module -w es6 ./SttMessage.proto > ./SttMessage_es6.js

echo "JavaScript code generation completed."
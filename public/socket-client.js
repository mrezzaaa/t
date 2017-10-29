const env = "production";
var server = env == "production" ? "https://operator.logisthink.id:85" : "https://localhost:85";
var socket = io.connect(server);

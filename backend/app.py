from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow requests from frontend

@app.route("/ping")
def ping():
    return "pong"

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    url = data.get("url")
    # For Phase 1, just return a test response
    return jsonify({"message": f"Received URL: {url}"})

if __name__ == "__main__":
    app.run(debug=True)

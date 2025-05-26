#!/usr/bin/env python3
"""
Diagnostic script to verify Flask routes
"""
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"status": "success", "message": "Test API is working!"})

@app.route('/api/addReview', methods=['POST'])
def add_review_test():
    # Get request data
    data = request.json if request.is_json else {}
    print("Received data:", data)
    
    # Return success response
    return jsonify({
        "status": "success",
        "message": "Review API called successfully",
        "received": data
    })

if __name__ == '__main__':
    print("Starting test Flask server on port 5000...")
    app.run(debug=True, port=5000)
    print("Server started!")

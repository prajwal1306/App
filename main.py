from app import app

# This is for Vercel serverless deployment
app.debug = False

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

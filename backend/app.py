from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    urls = data.get("urls", [])

    results = []
    for url in urls:
        result = {
            "url": url,
            "scores": {
                "carbon": 70,
                "reputation": 60,
                "location": 50,
                "policy": 40,
                "total": 55
            },
            "raw": {
                "website": {
                    "found_keywords": ["sustainability", "green", "eco"],
                    "reports": []
                }
            },
            "summary": f"This is a demo sustainability summary for {url}"
        }
        results.append(result)

    return jsonify(results)


@app.route("/export-pdf", methods=["POST"])
def export_pdf():
    payload = request.get_json()
    pdf_file = "report.pdf"

    c = canvas.Canvas(pdf_file, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "TerraTrust Report")

    y = height - 100
    for item in payload.get("results", []):
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, f"Company: {item['url']}")
        y -= 20
        c.setFont("Helvetica", 10)
        c.drawString(60, y, f"Total Score: {item['scores']['total']}")
        y -= 15
        for k, v in item["scores"].items():
            c.drawString(70, y, f"{k.capitalize()}: {v}")
            y -= 15
        c.drawString(60, y, f"Summary: {item['summary']}")
        y -= 40
        if y < 100:  # New page if too low
            c.showPage()
            y = height - 50

    c.save()

    return send_file(pdf_file, mimetype="application/pdf", as_attachment=True, download_name="terratrust_report.pdf")


if __name__ == "__main__":
    app.run(debug=True, port=5000)

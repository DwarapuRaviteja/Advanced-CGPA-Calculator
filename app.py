from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
from PIL import Image
import io
import json
import re
import os
app = Flask(__name__)

genai.configure(api_key=os.environ.get("calculator"))


model = genai.GenerativeModel("models/gemini-2.5-flash")

grade_points = {"S":10,"A":9,"B":8,"C":7,"D":6,"E":5,"F":0}

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        file = request.files['image']
        img_bytes = file.read()
image =
Image.open(io.BytesIO(img_bytes)).convert("RGB")
max_size = (1500,1500)
image.thumbnail(max_size)
        prompt = """
        Analyze this academic result image.
        Extract subject code, subject name, credits and grade.
        Return strictly JSON:

        {
        "valid": true,
        "subjects":[
        {"code":"","name":"","credits":"","grade":""}
        ]
        }

        If not academic result return:
        {"valid": false}
        """

        response = model.generate_content([prompt, image])
        text = response.text

        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            return jsonify({"valid": False})

        data = json.loads(match.group())

        if not data.get("valid"):
            return jsonify({"valid": False})

        return jsonify(data)

    except:
        return jsonify({"valid": False})

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    semesters = data["semesters"]

    total_points_all = 0
    total_credits_all = 0
    semester_results = []

    for semester in semesters:
        total_points = 0
        total_credits = 0

        for sub in semester:
            grade = sub["grade"].strip().upper()
            credits = float(sub["credits"])
            if grade in grade_points:
                total_points += grade_points[grade] * credits
                total_credits += credits

        sgpa = round(total_points / total_credits, 2)
        semester_results.append(sgpa)

        total_points_all += total_points
        total_credits_all += total_credits

    cgpa = round(total_points_all / total_credits_all, 2)
    percentage = round((cgpa - 0.75) * 10, 2)

    return jsonify({
        "semester_sgpa": semester_results,
        "cgpa": cgpa,
        "percentage": percentage
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))

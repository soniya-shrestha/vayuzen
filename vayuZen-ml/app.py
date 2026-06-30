"""
VayuZen — Flask ML Microservice
Runs on port 5000. Spring Boot calls this to get health risk predictions
AND personalized recommendations.
Start with: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = "model.pkl"

if not os.path.exists(MODEL_PATH):
    print("❌ model.pkl not found. Run train_model.py first!")
    model_data = None
else:
    with open(MODEL_PATH, "rb") as f:
        model_data = pickle.load(f)
    print(f"✅ Model loaded — version {model_data.get('version', 'unknown')}")
    print(f"   Age groups:       {list(model_data['age_encoder'].classes_)}")
    print(f"   Health conditions:{list(model_data['condition_encoder'].classes_)}")
    print(f"   Risk levels:      {list(model_data['risk_encoder'].classes_)}")


# ─── Recommendation Engine ────────────────────────────────────────────────────
# Generates personalized recommendations based on:
#   1. Predicted risk level (from the Random Forest model)
#   2. Raw pollutant values (PM2.5, PM10, NO2)
#   3. User's health condition and age group
#
# This runs AFTER the ML prediction, using the predicted risk_level as input —
# so it's genuinely downstream of the model's output, not a separate guess.

def generate_recommendations(risk_level, pm25, pm10, no2, age_group, health_condition):
    recs = []

    is_respiratory = health_condition in ("ASTHMA", "RESPIRATORY")
    is_cardiac      = health_condition == "HEART_DISEASE"
    is_vulnerable_age = age_group in ("CHILD", "ELDERLY")

    # ── Outdoor activity advice ──
    if risk_level == "Very High":
        recs.append({
            "color": "#E53E3E",
            "icon": "🚫",
            "title": "Stay indoors",
            "body": "Air quality is very unhealthy. Avoid all outdoor activity and keep windows closed."
        })
    elif risk_level == "High":
        if is_respiratory or is_cardiac:
            recs.append({
                "color": "#E53E3E",
                "icon": "⚠️",
                "title": "Avoid outdoor exercise",
                "body": f"Current air quality poses a real risk given your {health_condition.replace('_', ' ').lower()} condition."
            })
        else:
            recs.append({
                "color": "#D69E2E",
                "icon": "🏃",
                "title": "Limit prolonged outdoor exertion",
                "body": "Air quality is unhealthy for sensitive groups. Keep outdoor activity light and brief."
            })
    elif risk_level == "Moderate":
        recs.append({
            "color": "#D69E2E",
            "icon": "🌤️",
            "title": "Outdoor activity OK with caution",
            "body": "Air quality is acceptable, but unusually sensitive individuals may notice mild effects."
        })
    else:  # Low
        recs.append({
            "color": "#38A169",
            "icon": "✅",
            "title": "Good time for outdoor activity",
            "body": "Air quality is healthy today. Enjoy your time outside!"
        })

    # ── Mask advice based on actual PM2.5 ──
    if pm25 > 55:
        recs.append({
            "color": "#D69E2E",
            "icon": "😷",
            "title": "Wear an N95 mask",
            "body": f"PM2.5 is at {pm25:.0f} µg/m³, well above the safe limit of 25. An N95 mask filters these fine particles effectively."
        })

    # ── Condition-specific advice ──
    if is_respiratory and risk_level in ("High", "Very High"):
        recs.append({
            "color": "#E53E3E",
            "icon": "💊",
            "title": "Keep your inhaler nearby",
            "body": "Given your respiratory condition, have rescue medication accessible today."
        })

    if is_cardiac and risk_level in ("High", "Very High"):
        recs.append({
            "color": "#E53E3E",
            "icon": "❤️",
            "title": "Monitor for symptoms",
            "body": "High pollution can strain the cardiovascular system. Watch for unusual fatigue or chest discomfort."
        })

    if is_vulnerable_age and risk_level in ("Moderate", "High", "Very High"):
        recs.append({
            "color": "#D69E2E",
            "icon": "🛡️",
            "title": f"Extra caution for {'children' if age_group == 'CHILD' else 'elderly'}",
            "body": f"{'Children' if age_group == 'CHILD' else 'Elderly individuals'} are more sensitive to air pollution — limit outdoor exposure."
        })

    # ── Indoor air advice ──
    if risk_level in ("High", "Very High"):
        recs.append({
            "color": "#38B6C8",
            "icon": "🏠",
            "title": "Improve indoor air quality",
            "body": "Keep windows closed and use an air purifier indoors if available."
        })

    # ── General wellness (always included) ──
    recs.append({
        "color": "#38A169",
        "icon": "💧",
        "title": "Stay hydrated",
        "body": "Drinking water helps your body manage the effects of air pollution exposure."
    })

    # Return top 3 — most specific/urgent first
    return recs[:3]


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "VayuZen ML service running ✅",
        "model_loaded": model_data is not None,
        "version": model_data.get("version") if model_data else None
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Spring Boot sends:
    {
        "pm25": 89.0, "pm10": 142.0, "no2": 38.0, "aqi": 168,
        "age_group": "ADULT", "health_condition": "ASTHMA"
    }

    Returns:
    {
        "risk_level": "High",
        "confidence": 0.87,
        "probabilities": {...},
        "recommendations": [
            { "color": "#E53E3E", "icon": "⚠️", "title": "...", "body": "..." },
            ...
        ]
    }
    """
    if model_data is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    try:
        body = request.get_json()
        required = ["pm25", "pm10", "no2", "aqi", "age_group", "health_condition"]
        missing = [f for f in required if f not in body]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        pm25             = float(body["pm25"])
        pm10             = float(body["pm10"])
        no2              = float(body["no2"])
        aqi              = float(body["aqi"])
        age_group        = str(body["age_group"]).upper()
        health_condition = str(body["health_condition"]).upper()

        # Encode categorical inputs
        age_enc       = model_data["age_encoder"].transform([age_group])[0]
        condition_enc = model_data["condition_encoder"].transform([health_condition])[0]

        features = np.array([[pm25, pm10, no2, aqi, age_enc, condition_enc]])

        model          = model_data["model"]
        risk_encoder   = model_data["risk_encoder"]
        prediction_enc = model.predict(features)[0]
        probabilities  = model.predict_proba(features)[0]
        risk_level     = risk_encoder.inverse_transform([prediction_enc])[0]
        confidence     = float(max(probabilities))

        prob_map = {
            risk_encoder.classes_[i]: round(float(p), 3)
            for i, p in enumerate(probabilities)
        }

        # Generate recommendations using the PREDICTED risk level
        recommendations = generate_recommendations(
            risk_level, pm25, pm10, no2, age_group, health_condition
        )

        print(f"Prediction: {risk_level} (confidence: {confidence:.2f}) | "
              f"AQI={aqi}, PM2.5={pm25}, {age_group}, {health_condition} | "
              f"{len(recommendations)} recommendations generated")

        return jsonify({
            "risk_level":      risk_level,
            "confidence":      round(confidence, 3),
            "probabilities":   prob_map,
            "recommendations": recommendations
        })

    except ValueError as e:
        return jsonify({"error": f"Invalid value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    print("\n🌬️  VayuZen ML Microservice starting on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
"""
Flask Application for Exoplanet Classifier
File: app.py
"""

from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file
import numpy as np
import pickle
import os
import json
import joblib
import xgboost as xgb

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'

# Load the trained model (assumes you have a saved model)
# Replace this with your actual model loading logic
MODEL_JOBLIB = 'models/combined_xgb_tuned.joblib'
MODEL_JSON = 'models/combined_xgb_tuned.json'
METRICS_JSON = 'models/combined_metrics.json'

def load_model():
    """Load trained model: try joblib (sklearn wrapper) then xgboost JSON booster, fallback to legacy pickle."""
    try:
        # Prefer joblib-wrapped sklearn/xgboost model
        if os.path.exists(MODEL_JOBLIB):
            try:
                model = joblib.load(MODEL_JOBLIB)
                return model
            except Exception as e:
                print(f"Error loading joblib model: {e}")
        # Fallback to XGBoost Booster saved as JSON
        if os.path.exists(MODEL_JSON):
            try:
                booster = xgb.Booster()
                booster.load_model(MODEL_JSON)
                return booster
            except Exception as e:
                print(f"Error loading xgboost json model: {e}")
        # Legacy pickle path (keeps compatibility with existing code)
        legacy_path = 'models/exoplanet_classifier.pkl'
        if os.path.exists(legacy_path):
            try:
                with open(legacy_path, 'rb') as f:
                    model = pickle.load(f)
                return model
            except Exception as e:
                print(f"Error loading pickle model: {e}")
        print(f"Warning: No model file found at {MODEL_JOBLIB}, {MODEL_JSON} or {legacy_path}")
        return None
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def load_metrics():
    """Load evaluation metrics JSON if present."""
    if os.path.exists(METRICS_JSON):
        try:
            with open(METRICS_JSON, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading metrics file: {e}")
            return {}
    return {}

# Load model and metrics on startup
model = load_model()
metrics = load_metrics()


# --- Sample Feature Data for API Demo ---
# These are dummy inputs that represent typical values for each case.
SAMPLE_CONFIRMED_DATA = [
    9.488036,   # koi_period (days)
    2.783,      # koi_duration (hrs)
    1.94,       # koi_prad (Earth radii)
    344.6,      # koi_depth (ppm)
    4.467,      # koi_slogg 
    0.927,      # koi_srad 
    0.146,      # koi_impact 
    93.59,      # koi_insol 
    707.2,      # koi_teq 
    0.946,      # koi_score 
    67.6,       # koi_steff 
    4.467,      # koi_model_snr
    170.538,    # koi_time0bk 
    0.089,      # koi_dor
    89.37       # koi_incl
]

SAMPLE_FALSE_POSITIVE_DATA = [
    3.5224,     # koi_period (days)
    1.082,      # koi_duration (hrs)
    0.85,       # koi_prad (Earth radii)
    55.1,       # koi_depth (ppm) - Very shallow dip
    4.550,      # koi_slogg
    0.851,      # koi_srad
    0.950,      # koi_impact
    1200.0,     # koi_insol
    1000.0,     # koi_teq
    0.051,      # koi_score - Low score
    12.2,       # koi_steff 
    4.550,      # koi_model_snr
    132.890,    # koi_time0bk
    0.045,      # koi_dor
    85.12       # koi_incl
]


def predict_exoplanet(features):
    """
    Make prediction using the loaded model
    Returns: (label_str, confidence_score_percent)
    """
    try:
        if model is None:
            # fallback mock prediction
            period = features[0] if len(features) > 0 else 0
            depth = features[3] if len(features) > 3 else 0
            if depth > 100 and period > 5:
                confidence = np.random.uniform(90, 99)
                prediction = 1
            else:
                confidence = np.random.uniform(70, 80)
                prediction = 0
        else:
            arr = np.array(features).reshape(1, -1)
            # sklearn-like estimator
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(arr)[0]
                prediction = int(np.argmax(proba))
                confidence = float(max(proba) * 100)
            # xgboost.Booster
            elif isinstance(model, xgb.Booster):
                dmat = xgb.DMatrix(arr)
                preds = model.predict(dmat)  # returns probability for binary
                prob = float(preds[0])
                prediction = 1 if prob >= 0.5 else 0
                confidence = prob * 100
            # sklearn-like regressors or other
            else:
                prediction = int(model.predict(arr)[0])
                confidence = 95.0

        label = 'CONFIRMED EXOPLANET' if prediction == 1 else 'FALSE POSITIVE'
        return label, round(confidence, 2)
    except Exception as e:
        print(f"Prediction error: {e}")
        return 'ERROR', 0.0

@app.route('/api/sample_prediction', methods=['GET'])
def sample_prediction():
    """
    API endpoint that returns features and a mock prediction for a sample type.
    """
    curve_type = request.args.get('type', 'confirmed')
    
    if curve_type == 'confirmed':
        features = SAMPLE_CONFIRMED_DATA
        result = 'CONFIRMED EXOPLANET'
        confidence = round(np.random.uniform(92, 99), 2)
        sample_name = 'KOI-123.01'
    else: # false_positive
        features = SAMPLE_FALSE_POSITIVE_DATA
        result = 'FALSE POSITIVE'
        confidence = round(np.random.uniform(75, 85), 2)
        sample_name = 'KOI-456.02'
        
    return jsonify({
        'features': features,
        'result': result,
        'confidence': confidence,
        'sample_name': sample_name
    })


@app.route('/')
def index():
    """Render the main page"""
    # Clear result if we are navigating back to index without a form submission result
    result = request.args.get('result')
    confidence = request.args.get('confidence')
    return render_template('index.html', result=result, confidence=confidence)


@app.route('/predict', methods=['POST'])
def predict():
    """Handle prediction requests"""
    try:
        # Extract 15 features from form (koi_period, koi_duration, etc.)
        features = [
            float(request.form.get('koi_period', 0)),
            float(request.form.get('koi_duration', 0)),
            float(request.form.get('koi_prad', 0)),
            float(request.form.get('koi_depth', 0)),
            float(request.form.get('koi_slogg', 0)),
            float(request.form.get('koi_srad', 0)),
            float(request.form.get('koi_impact', 0)),
            float(request.form.get('koi_insol', 0)),
            float(request.form.get('koi_teq', 0)),
            float(request.form.get('koi_score', 0)),
            float(request.form.get('koi_steff', 0)),
            float(request.form.get('koi_model_snr', 0)),
            float(request.form.get('koi_time0bk', 0)),
            float(request.form.get('koi_dor', 0)),
            float(request.form.get('koi_incl', 0))
        ]
        
        # Validate features
        if any(f == 0 for f in features):
            return redirect(url_for('index', result='ERROR: All fields are required', confidence='0.0'))
        
        # Make prediction
        prediction_label, confidence = predict_exoplanet(features)
        
        # Redirect to index with results in query params
        return redirect(url_for('index', result=prediction_label, confidence=confidence))
    
    except ValueError as e:
        return redirect(url_for('index', result='ERROR: Invalid input values', confidence='0.0'))
    except Exception as e:
        print(f"Error in prediction route: {e}")
        return redirect(url_for('index', result='ERROR: Something went wrong', confidence='0.0'))


@app.route('/api/light_curve', methods=['GET'])
def light_curve_data():
    """
    API endpoint to generate and serve simulated light curve data (Time vs. Normalized Flux).
    Accepts 'type' parameter: 'confirmed' or 'false_positive'.
    """
    curve_type = request.args.get('type', 'confirmed') 
    
    num_points = 100
    time = np.arange(num_points)
    
    # Base flux is slightly above 1.0, representing the star's natural luminosity
    base_flux = np.random.normal(loc=1.000, scale=0.0005, size=num_points)
    
    start_dip = 45
    end_dip = 55
    max_dip = 0.025 # Max dip for a confirmed exoplanet (2.5% flux drop)
    
    # Adjust parameters based on the requested type
    if curve_type == 'false_positive':
        # Simulate a much shallower, noisier dip
        max_dip = 0.005 
        # Introduce higher noise level to simulate instrument or stellar noise
        base_flux = np.random.normal(loc=1.000, scale=0.002, size=num_points)
    
    # Generate the dip shape
    dip_center = (start_dip + end_dip) / 2
    dip_width = (end_dip - start_dip) / 2
    
    for i in range(start_dip, end_dip):
        normalized_distance = abs(i - dip_center) / dip_width
        
        # Invert the parabola shape (1 - x^2) to create a dip shape
        depth_factor = 1.0 - (normalized_distance ** 2)
        depth_factor = np.clip(depth_factor, 0, 1)
        
        # Apply the dip to the flux, ensuring some noise remains
        base_flux[i] = base_flux[i] - (max_dip * depth_factor) 

    flux = np.round(base_flux, 5).tolist()

    return jsonify({
        'time': time.tolist(),
        'flux': flux,
        'transit_start': start_dip,
        'transit_end': end_dip
    })

# =========================================================
# NEW API ENDPOINT FOR ANALYSIS CHARTS
# =========================================================
@app.route('/api/analysis_data')
def analysis_data():
    """
    API endpoint to serve mock data for the three analysis charts.
    """
    # 1. Data for "Data Exploration" Chart (Exoplanet Size Distribution)
    data_exploration = {
        'labels': ['Super-Earths', 'Neptune-like', 'Gas Giants', 'Earth-sized', 'Sub-terrans'],
        'data': [1785, 1892, 1650, 560, 130] 
    }

    # 2. Data for "Feature Importance" Chart
    # (Mock scores representing how much each feature contributes to the prediction)
    feature_importance = {
        'labels': ['koi_score', 'koi_fpflag_ss', 'koi_depth', 'koi_prad', 'koi_duration', 'koi_impact', 'koi_steff'],
        'data': [0.95, 0.91, 0.86, 0.75, 0.68, 0.61, 0.55]
    }
    
    # 3. Data for "Model Performance" Chart (Confusion Matrix values)
    # [True Negative, False Positive, False Negative, True Positive]
    model_performance = {
        'labels': ['True Negative', 'False Positive', 'False Negative', 'True Positive'],
        'data': [4102, 120, 250, 4850] # Represents TN, FP, FN, TP
    }

    return jsonify({
        'data_exploration': data_exploration,
        'feature_importance': feature_importance,
        'model_performance': model_performance
    })


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return render_template('index.html', result='ERROR: Page Not Found', confidence=None), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return render_template('index.html', 
                           result='ERROR: Server error occurred', 
                           confidence=None), 500

@app.route('/api/metrics', methods=['GET'])
def api_metrics():
    """Return saved evaluation metrics and best params."""
    if not metrics:
        return jsonify({'error': 'metrics not found'}), 404
    return jsonify(metrics)

@app.route('/download_model', methods=['GET'])
def download_model():
    """Download the model file (joblib preferred, fallback to JSON or pickle)."""
    if os.path.exists(MODEL_JOBLIB):
        return send_file(MODEL_JOBLIB, as_attachment=True)
    if os.path.exists(MODEL_JSON):
        return send_file(MODEL_JSON, as_attachment=True)
    legacy_path = 'models/exoplanet_classifier.pkl'
    if os.path.exists(legacy_path):
        return send_file(legacy_path, as_attachment=True)
    return jsonify({'error': 'model file not found'}), 404


if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
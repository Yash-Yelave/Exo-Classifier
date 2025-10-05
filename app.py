# app.py (Final, Complete Version with All Features and API Routes)

from flask import Flask, render_template, request, redirect, url_for, jsonify
import numpy as np
import pandas as pd
import joblib
import os
import io

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# --- POINT THIS TO THE CORRECT MODEL FILE ---
MODEL_PATH = 'models/exo_classifier_compatible.joblib'
# -----------------------------------------------------------------

def load_model():
    """ Loads the compatible model. """
    try:
        if not os.path.exists(MODEL_PATH):
            print(f"❌ ERROR: Model file not found at '{MODEL_PATH}'")
            return None
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded successfully from '{MODEL_PATH}'")
        return model
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None

model = load_model()

def predict_exoplanet(features):
    """ Prediction function for a single row of data. """
    try:
        if model is None: return 'ERROR: Model not loaded', 0.0
        feature_names = [
            'koi_period', 'koi_duration', 'koi_prad', 'koi_ror', 'koi_slogg',
            'koi_srad', 'koi_impact', 'koi_insol', 'koi_teq', 'koi_smass',
            'koi_model_snr', 'koi_srho', 'koi_time0bk', 'koi_dor', 'koi_incl'
        ]
        input_df = pd.DataFrame([features], columns=feature_names)
        proba = model.predict_proba(input_df)[0]
        prediction = int(np.argmax(proba))
        confidence = float(max(proba) * 100)
        label = 'CONFIRMED EXOPLANET' if prediction == 1 else 'FALSE POSITIVE'
        return label, round(confidence, 2)
    except Exception as e:
        print(f"!!!!!!!! PREDICTION ERROR !!!!!!!!\n{e}\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return 'ERROR', 0.0

# --- Primary Flask Routes ---

@app.route('/')
def index():
    """ Renders the main page for the AI Demo. """
    return render_template('index.html', result=request.args.get('result'), confidence=request.args.get('confidence'))

@app.route('/predict', methods=['POST'])
def predict():
    """ Handles the single prediction from the AI Demo form. """
    try:
        features = [
            float(request.form.get('koi_period')), float(request.form.get('koi_duration')),
            float(request.form.get('koi_prad')), float(request.form.get('koi_ror')),
            float(request.form.get('koi_slogg')), float(request.form.get('koi_srad')),
            float(request.form.get('koi_impact')), float(request.form.get('koi_insol')),
            float(request.form.get('koi_teq')), float(request.form.get('koi_mass')),
            float(request.form.get('koi_snr')), float(request.form.get('koi_density')),
            float(request.form.get('koi_time0bk')), float(request.form.get('koi_dor')),
            float(request.form.get('koi_incl'))
        ]
        label, confidence = predict_exoplanet(features)
        return redirect(url_for('index', result=label, confidence=confidence))
    except (ValueError, TypeError):
        return redirect(url_for('index', result='ERROR: Invalid input', confidence='0.0'))

# --- Batch Analysis Routes ---

@app.route('/batch')
def batch_analysis():
    """ Renders the initial batch analysis page. """
    return render_template('batch.html')

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    """ Handles the batch file upload and prediction. """
    if 'dataset_file' not in request.files:
        return render_template('batch.html', error="No file was uploaded.")
    
    file = request.files['dataset_file']
    if file.filename == '':
        return render_template('batch.html', error="No file was selected.")

    if file and model:
        try:
            csv_data = io.StringIO(file.stream.read().decode("UTF8"))
            df = pd.read_csv(csv_data, comment='#')
            original_headers = df.columns.tolist()

            feature_names = [
                'koi_period', 'koi_duration', 'koi_prad', 'koi_ror', 'koi_slogg',
                'koi_srad', 'koi_impact', 'koi_insol', 'koi_teq', 'koi_smass',
                'koi_model_snr', 'koi_srho', 'koi_time0bk', 'koi_dor', 'koi_incl'
            ]

            if not all(feature in df.columns for feature in feature_names):
                missing = [f for f in feature_names if f not in df.columns]
                return render_template('batch.html', error=f"CSV file is missing required columns: {', '.join(missing)}")

            df_to_predict = df[feature_names]
            predictions_num = model.predict(df_to_predict)
            predictions_label = ['CONFIRMED EXOPLANET' if p == 1 else 'FALSE POSITIVE' for p in predictions_num]
            
            df['AI_Prediction'] = predictions_label

            stats = {
                'total': len(df),
                'confirmed': predictions_label.count('CONFIRMED EXOPLANET'),
                'false_positive': predictions_label.count('FALSE POSITIVE')
            }

            results_list = df.to_dict(orient='records')
            
            return render_template('batch.html', results=results_list, stats=stats, original_headers=original_headers)
        except Exception as e:
            print(f"Error processing batch file: {e}")
            return render_template('batch.html', error="An error occurred while processing the file. Please ensure it is a valid CSV.")
            
    return redirect(url_for('batch_analysis'))

# --- API Routes for Front-End Charts (Restored) ---

@app.route('/api/sample_prediction', methods=['GET'])
def sample_prediction():
    """ Returns a MOCK prediction for the UI demo. """
    curve_type = request.args.get('type', 'confirmed')
    if curve_type == 'confirmed':
        result, confidence = 'CONFIRMED EXOPLANET', round(np.random.uniform(92, 99), 2)
    else:
        result, confidence = 'FALSE POSITIVE', round(np.random.uniform(75, 85), 2)
    return jsonify({'result': result, 'confidence': confidence})

@app.route('/api/light_curve', methods=['GET'])
def light_curve_data():
    """ Generates SIMULATED light curve data for the chart. """
    curve_type = request.args.get('type', 'confirmed') 
    num_points, time = 100, np.arange(100)
    base_flux = np.random.normal(loc=1.000, scale=0.0005, size=num_points)
    start_dip, end_dip, max_dip = 45, 55, 0.025
    if curve_type == 'false_positive':
        max_dip = 0.005
        base_flux = np.random.normal(loc=1.000, scale=0.002, size=num_points)
    dip_center = (start_dip + end_dip) / 2
    dip_width = (end_dip - start_dip) / 2
    for i in range(start_dip, end_dip):
        normalized_distance = abs(i - dip_center) / dip_width
        depth_factor = np.clip(1.0 - (normalized_distance ** 2), 0, 1)
        base_flux[i] = base_flux[i] - (max_dip * depth_factor)
    return jsonify({'time': time.tolist(), 'flux': np.round(base_flux, 5).tolist()})

@app.route('/api/analysis_data')
def analysis_data():
    """ Serves MOCK data for the three analysis charts at the bottom of the main page. """
    data_exploration = {'labels': ['Super-Earths', 'Neptune-like', 'Gas Giants', 'Earth-sized', 'Sub-terrans'], 'data': [1785, 1892, 1650, 560, 130]}
    feature_importance = {'labels': ['R_ror', 'SNR', 'R_prad', 'Log g', 'Mass', 'Insol', 'Period'], 'data': [0.95, 0.91, 0.86, 0.75, 0.68, 0.61, 0.55]}
    model_performance = {'labels': ['True Negative', 'False Positive', 'False Negative', 'True Positive'], 'data': [4102, 120, 250, 4850]}
    return jsonify({'data_exploration': data_exploration, 'feature_importance': feature_importance, 'model_performance': model_performance})


if __name__ == '__main__':
    if not os.path.exists('models'):
        os.makedirs('models')
    app.run(debug=True, host='0.0.0.0', port=5000)
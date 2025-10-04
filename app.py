"""
Flask Application for Exoplanet Classifier
File: app.py
"""

from flask import Flask, render_template, request, redirect, url_for
import numpy as np
import pickle
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'

# Load the trained model (assumes you have a saved model)
# Replace this with your actual model loading logic
MODEL_PATH = 'models/exoplanet_classifier.pkl'

def load_model():
    """Load the trained ML model"""
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            return model
        else:
            print(f"Warning: Model file not found at {MODEL_PATH}")
            return None
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

# Load model on startup
model = load_model()


def predict_exoplanet(features):
    """
    Make prediction using the loaded model
    
    Args:
        features: List or array of 15 feature values
    
    Returns:
        tuple: (prediction_label, confidence_score)
    """
    try:
        if model is None:
            # Mock prediction for demonstration
            # Remove this and use actual model prediction
            confidence = np.random.uniform(75, 99)
            prediction = 1 if confidence > 85 else 0
        else:
            # Actual model prediction
            features_array = np.array(features).reshape(1, -1)
            prediction = model.predict(features_array)[0]
            
            # Get probability/confidence if model supports it
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(features_array)[0]
                confidence = max(proba) * 100
            else:
                confidence = 95.0  # Default confidence
        
        # Convert prediction to label
        prediction_label = 'CONFIRMED EXOPLANET' if prediction == 1 else 'FALSE POSITIVE'
        
        return prediction_label, round(confidence, 2)
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return 'ERROR', 0.0


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html', result=None, confidence=None)


@app.route('/predict', methods=['POST'])
def predict():
    """Handle prediction requests"""
    try:
        # Extract features from form
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
            return render_template('index.html', 
                                 result='ERROR: All fields are required', 
                                 confidence=None)
        
        # Make prediction
        prediction_label, confidence = predict_exoplanet(features)
        
        # Render template with results
        return render_template('index.html', 
                             result=prediction_label, 
                             confidence=confidence)
    
    except ValueError as e:
        return render_template('index.html', 
                             result='ERROR: Invalid input values', 
                             confidence=None)
    except Exception as e:
        print(f"Error in prediction route: {e}")
        return render_template('index.html', 
                             result='ERROR: Something went wrong', 
                             confidence=None)


@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API endpoint for predictions (JSON)"""
    try:
        data = request.get_json()
        
        features = [
            float(data.get('koi_period', 0)),
            float(data.get('koi_duration', 0)),
            float(data.get('koi_prad', 0)),
            float(data.get('koi_depth', 0)),
            float(data.get('koi_slogg', 0)),
            float(data.get('koi_srad', 0)),
            float(data.get('koi_impact', 0)),
            float(data.get('koi_insol', 0)),
            float(data.get('koi_teq', 0)),
            float(data.get('koi_score', 0)),
            float(data.get('koi_steff', 0)),
            float(data.get('koi_model_snr', 0)),
            float(data.get('koi_time0bk', 0)),
            float(data.get('koi_dor', 0)),
            float(data.get('koi_incl', 0))
        ]
        
        prediction_label, confidence = predict_exoplanet(features)
        
        return {
            'success': True,
            'prediction': prediction_label,
            'confidence': confidence,
            'features': features
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, 400


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return render_template('index.html', result=None, confidence=None), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return render_template('index.html', 
                         result='ERROR: Server error occurred', 
                         confidence=None), 500


if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
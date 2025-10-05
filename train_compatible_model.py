# train_compatible_model.py (Final Version - now finds a perfect sample)

import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import os
import numpy as np

print("Starting the model training process...")

# --- 1. Load the LOCAL Dataset ---
DATASET_FILE = 'cumulative.csv'
if not os.path.exists(DATASET_FILE):
    print(f"❌ ERROR: Dataset file not found! Please ensure '{DATASET_FILE}' is in this directory.")
    exit()

try:
    print(f"Reading local dataset: {DATASET_FILE}...")
    df = pd.read_csv(DATASET_FILE, comment='#')
    print("✅ Dataset loaded successfully.")
except Exception as e:
    print(f"❌ Could not read the dataset file. Error: {e}")
    exit()

# --- 2. Define the EXACT Features Your Web Form and Documentation Use ---
feature_mapping = {
    'koi_period': 'koi_period', 'koi_duration': 'koi_duration', 'koi_prad': 'koi_prad',
    'koi_ror': 'koi_ror', 'koi_slogg': 'koi_slogg', 'koi_srad': 'koi_srad',
    'koi_impact': 'koi_impact', 'koi_insol': 'koi_insol', 'koi_teq': 'koi_teq',
    'koi_mass': 'koi_smass', 'koi_snr': 'koi_model_snr', 'koi_density': 'koi_srho',
    'koi_time0bk': 'koi_time0bk', 'koi_dor': 'koi_dor', 'koi_incl': 'koi_incl'
}
features_to_use = list(feature_mapping.values())
target_column = 'koi_disposition'

# --- 3. Prepare Data for Training ---
print("Preparing data for training...")
df.dropna(subset=features_to_use + [target_column], inplace=True) 
X = df[features_to_use]
y = df[target_column].apply(lambda x: 1 if x == 'CONFIRMED' else 0)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print("✅ Data has been prepared and split.")

# --- 4. Train the New, Compatible XGBoost Model ---
print("Training new XGBoost model...")
model = xgb.XGBClassifier(
    objective='binary:logistic', eval_metric='logloss', n_estimators=500,
    learning_rate=0.05, max_depth=5, use_label_encoder=False, random_state=42
)
model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
print("✅ Model training complete.")

# --- 5. Evaluate and Save the New Model ---
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"📊 New model accuracy on test data: {accuracy:.4f}")

model_filename = 'exo_classifier_compatible.joblib'
joblib.dump(model, model_filename)
print(f"✅ New, compatible model saved successfully as '{model_filename}'")

# --- 6. Find a Guaranteed "CONFIRMED" Sample for the Demo ---
print("\nSearching for a guaranteed 'CONFIRMED' sample for the demo button...")
# Predict probabilities on the original, full dataset
full_dataset_X = df[features_to_use]
full_dataset_y = df[target_column]
predictions = model.predict_proba(full_dataset_X)[:, 1] # Get probability of being 'CONFIRMED'

# Find a row that is actually 'CONFIRMED' AND our model predicts it as 'CONFIRMED' with > 99% confidence
perfect_sample = df[(full_dataset_y == 'CONFIRMED') & (predictions > 0.99)].iloc[0]

# Map the dataset columns back to the form field names
sample_for_js = {
    "koi_period": perfect_sample['koi_period'],
    "koi_duration": perfect_sample['koi_duration'],
    "koi_prad": perfect_sample['koi_prad'],
    "koi_ror": perfect_sample['koi_ror'],
    "koi_slogg": perfect_sample['koi_slogg'],
    "koi_srad": perfect_sample['koi_srad'],
    "koi_impact": perfect_sample['koi_impact'],
    "koi_insol": perfect_sample['koi_insol'],
    "koi_teq": perfect_sample['koi_teq'],
    "koi_mass": perfect_sample['koi_smass'], # map from koi_smass
    "koi_snr": perfect_sample['koi_model_snr'], # map from koi_model_snr
    "koi_density": perfect_sample['koi_srho'], # map from koi_srho
    "koi_time0bk": perfect_sample['koi_time0bk'],
    "koi_dor": perfect_sample['koi_dor'],
    "koi_incl": perfect_sample['koi_incl']
}

print("✅ Found a perfect sample!")
print("Please use the following data in your app.js 'fillSampleData' function:")
print("------------------------------------------------------------------")
print(sample_for_js)
print("------------------------------------------------------------------")

print("\n🎉 Process finished. You can now move the new model to the /models folder and run app.py.")


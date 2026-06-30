"""
VayuZen — Random Forest Model Training Script (Real Kaggle Data)
Dataset: Air Quality Data in India — city_day.csv
Run: python train_model.py
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os

print("=" * 55)
print("  VayuZen ML Model Training — Real Kaggle Data")
print("=" * 55)

# ─── 1. Load Kaggle Dataset ───────────────────────────────────────────────────
print("\n[1/6] Loading Kaggle dataset...")

CSV_FILE = "city_day.csv"

if not os.path.exists(CSV_FILE):
    print(f"\n❌ '{CSV_FILE}' not found in this folder.")
    print("   Please download from:")
    print("   https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india")
    print("   and place city_day.csv in this folder.")
    exit(1)

df = pd.read_csv(CSV_FILE)
print(f"   Loaded {len(df):,} rows, {len(df.columns)} columns")
print(f"   Columns: {list(df.columns)}")

# ─── 2. Select and Clean Columns ─────────────────────────────────────────────
print("\n[2/6] Cleaning data...")

# Keep only the columns we need
# Kaggle dataset uses: PM2.5, PM10, NO2, AQI
needed = ['PM2.5', 'PM10', 'NO2', 'AQI']
missing_cols = [c for c in needed if c not in df.columns]
if missing_cols:
    print(f"   ❌ Missing columns: {missing_cols}")
    print(f"   Available columns: {list(df.columns)}")
    exit(1)

# Keep only relevant columns
df = df[needed].copy()

# Drop rows where any of our key columns is missing
before = len(df)
df.dropna(subset=needed, inplace=True)
after = len(df)
print(f"   Removed {before - after:,} rows with missing values")
print(f"   Remaining: {after:,} clean rows")

# Remove obvious outliers (sensor errors)
df = df[df['PM2.5'] >= 0]
df = df[df['PM2.5'] <= 999]
df = df[df['PM10']  >= 0]
df = df[df['PM10']  <= 999]
df = df[df['NO2']   >= 0]
df = df[df['NO2']   <= 500]
df = df[df['AQI']   >= 0]
df = df[df['AQI']   <= 999]

print(f"   After outlier removal: {len(df):,} rows")

# Rename to match our app's naming
df.rename(columns={
    'PM2.5': 'pm25',
    'PM10':  'pm10',
    'NO2':   'no2',
    'AQI':   'aqi'
}, inplace=True)

# ─── 3. Generate risk_level from AQI (Indian AQI scale) ──────────────────────
# Indian AQI scale:
#   0–50   = Good       → Low
#   51–100 = Satisfactory → Low
#   101–200 = Moderate  → Moderate
#   201–300 = Poor      → High
#   301+    = Very Poor / Severe → Very High
print("\n[3/6] Generating risk levels from AQI...")

def aqi_to_risk(aqi):
    if aqi <= 100:   return 'Low'
    elif aqi <= 200: return 'Moderate'
    elif aqi <= 300: return 'High'
    else:            return 'Very High'

df['risk_level'] = df['aqi'].apply(aqi_to_risk)
print(f"   Risk level distribution:")
for level, count in df['risk_level'].value_counts().items():
    pct = count / len(df) * 100
    print(f"     {level:<12} {count:>5,} rows ({pct:.1f}%)")

# ─── 4. Add Synthetic Health Profile Columns ─────────────────────────────────
# The Kaggle dataset has no age_group or health_condition columns
# We add them synthetically but in a realistic way:
# The health condition affects the FINAL risk, not just AQI
print("\n[4/6] Adding health profile features...")

np.random.seed(42)
n = len(df)

age_groups       = ['CHILD', 'YOUNG_ADULT', 'ADULT', 'ELDERLY']
health_conditions = ['NONE', 'ASTHMA', 'HEART_DISEASE', 'DIABETES', 'RESPIRATORY']

# Realistic distribution — most people are adults with no condition
df['age_group'] = np.random.choice(
    age_groups,
    size=n,
    p=[0.15, 0.30, 0.40, 0.15]   # CHILD, YOUNG_ADULT, ADULT, ELDERLY
)

df['health_condition'] = np.random.choice(
    health_conditions,
    size=n,
    p=[0.55, 0.15, 0.12, 0.10, 0.08]  # NONE, ASTHMA, HEART_DISEASE, DIABETES, RESPIRATORY
)

# Adjust risk upward for vulnerable groups when AQI is borderline
# e.g. AQI 90 is "Low" for a healthy adult but "Moderate" for an elderly asthma patient
def adjust_risk(row):
    risk  = row['risk_level']
    aqi   = row['aqi']
    age   = row['age_group']
    cond  = row['health_condition']

    is_vulnerable = (
        age in ['CHILD', 'ELDERLY'] or
        cond in ['ASTHMA', 'RESPIRATORY', 'HEART_DISEASE']
    )

    # Bump up risk one level for vulnerable groups in borderline AQI zones
    if is_vulnerable:
        if risk == 'Low' and aqi > 75:       return 'Moderate'
        if risk == 'Moderate' and aqi > 150: return 'High'
        if risk == 'High' and aqi > 250:     return 'Very High'

    return risk

df['risk_level'] = df.apply(adjust_risk, axis=1)

print(f"   Adjusted risk level distribution (after health profile):")
for level, count in df['risk_level'].value_counts().items():
    pct = count / len(df) * 100
    print(f"     {level:<12} {count:>5,} rows ({pct:.1f}%)")

# ─── 5. Encode and Train ──────────────────────────────────────────────────────
print("\n[5/6] Encoding and training model...")

age_encoder       = LabelEncoder()
condition_encoder = LabelEncoder()
risk_encoder      = LabelEncoder()

df['age_group_enc']        = age_encoder.fit_transform(df['age_group'])
df['health_condition_enc'] = condition_encoder.fit_transform(df['health_condition'])
df['risk_level_enc']       = risk_encoder.fit_transform(df['risk_level'])

# Features and label
X = df[['pm25', 'pm10', 'no2', 'aqi', 'age_group_enc', 'health_condition_enc']]
y = df['risk_level_enc']

# Sample max 20,000 rows for fast training (dataset can be huge)
if len(X) > 20000:
    X = X.sample(20000, random_state=42)
    y = y.loc[X.index]
    print(f"   Sampled 20,000 rows for training efficiency")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"   Training: {len(X_train):,} | Testing: {len(X_test):,}")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42,
    class_weight='balanced',
    n_jobs=-1  # use all CPU cores
)
model.fit(X_train, y_train)

y_pred   = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n   ✅ Model accuracy: {accuracy * 100:.1f}%")
print("\n   Classification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=risk_encoder.classes_
))

# Feature importance
importances   = model.feature_importances_
feature_names = ['PM2.5', 'PM10', 'NO2', 'AQI', 'Age Group', 'Health Condition']
print("   Feature importances:")
for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
    bar = '█' * int(imp * 40)
    print(f"     {name:<20} {imp:.3f}  {bar}")

# ─── 6. Save ──────────────────────────────────────────────────────────────────
print("\n[6/6] Saving model...")

model_data = {
    'model':             model,
    'age_encoder':       age_encoder,
    'condition_encoder': condition_encoder,
    'risk_encoder':      risk_encoder,
    'feature_names':     ['pm25', 'pm10', 'no2', 'aqi', 'age_group_enc', 'health_condition_enc'],
    'version':           '2.0.0',
    'training_samples':  len(X_train),
    'accuracy':          round(accuracy * 100, 1)
}

with open('model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print(f"   ✅ Saved model.pkl  (accuracy: {accuracy*100:.1f}%,  {len(X_train):,} training samples)")
print("\n" + "=" * 55)
print("  Done! Run: python app.py")
print("=" * 55)
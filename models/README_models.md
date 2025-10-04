# Combined XGBoost model

This folder contains a combined XGBoost model trained on all scaled datasets with synthetic labels.

Best params and metrics:
{
  "model_path": "c:\\Users\\siddh\\Downloads\\NASA  HAc\\models\\combined_xgb_tuned.json",
  "params": {
    "learning_rate": 0.018682452933515652,
    "max_depth": 10,
    "min_child_weight": 10,
    "subsample": 0.61780480706746,
    "colsample_bytree": 0.5025673112471494,
    "gamma": 1.3514945560156022e-05,
    "lambda": 0.0001832758478013196,
    "alpha": 6.9647395482245166e-06,
    "objective": "binary:logistic",
    "seed": 42
  },
  "results": {
    "test_auc": 0.9976859428743139,
    "test_accuracy": 0.9781433607520564
  }
}
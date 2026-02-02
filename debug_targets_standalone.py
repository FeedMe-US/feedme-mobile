
# Self-contained logic from src/utils/targets.py to avoid relative import issues in debug

# Constants
ACTIVITY_MULTIPLIERS = {
    "Sedentary": 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Extra Active": 1.9,
}

GOAL_CALORIE_ADJUSTMENTS = {
    "Bulk Up": 300,
    "Get Lean": -500,
    "Maintain": 0,
    "Perform Better": 100,
}

def calculate_bmr(weight_lbs, height_inches, age, sex):
    weight_kg = weight_lbs * 0.453592
    height_cm = height_inches * 2.54
    if sex == "male":
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
    return int(round(bmr))

def calculate_tdee(bmr, activity_level):
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    return int(round(bmr * multiplier))

def calculate_targets_debug(weight_lbs, height_inches, age, sex, activity, goal, weekly_change=None):
    bmr = calculate_bmr(weight_lbs, height_inches, age, sex)
    tdee = calculate_tdee(bmr, activity)
    
    if weekly_change is not None:
        adj = int(round(weekly_change * 3500 / 7))
    else:
        adj = GOAL_CALORIE_ADJUSTMENTS.get(goal, 0)
        
    target = tdee + adj
    # Bounds check
    target = max(1200, min(5000, target))
    
    return bmr, tdee, adj, target

# --- RUN ---

# 1. Get Lean / Lightly Active / Male / 160lbs
bmr, tdee, adj, target = calculate_targets_debug(160, 69, 19, "male", "Lightly Active", "Get Lean", None)
print(f"--- Get Lean ---")
print(f"BMR: {bmr}")
print(f"TDEE: {tdee}")
print(f"Adj: {adj}")
print(f"Target: {target}")

# 2. Bulk Up / Lightly Active / Male / 160lbs
bmr, tdee, adj, target = calculate_targets_debug(160, 69, 19, "male", "Lightly Active", "Bulk Up", None)
print(f"\n--- Bulk Up ---")
print(f"BMR: {bmr}")
print(f"TDEE: {tdee}")
print(f"Adj: {adj}")
print(f"Target: {target}")

# 3. Simulate the BUG (Get Lean but with +1.0 override)
bmr, tdee, adj, target = calculate_targets_debug(160, 69, 19, "male", "Lightly Active", "Get Lean", 1.0)
print(f"\n--- BUG (Get Lean + 1.0lb override) ---")
print(f"BMR: {bmr}")
print(f"TDEE: {tdee}")
print(f"Adj: {adj}")
print(f"Target: {target}")

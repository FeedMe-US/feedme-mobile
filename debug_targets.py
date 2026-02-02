
import sys
sys.path.append("/Users/yashyadavalli/FinalApp/feedme-api/src")
from utils.targets import calculate_targets

# Scenario 1: Get Lean (Standard)
lean_targets = calculate_targets(
    weight_lbs=160,
    height_inches=69,
    age=19,
    sex="male",
    activity_level="Lightly Active",
    goal_type="Get Lean",
    target_weekly_change_lbs=None  # Simulating the reset
)

# Scenario 2: Bulk Up (Standard)
bulk_targets = calculate_targets(
    weight_lbs=160,
    height_inches=69,
    age=19,
    sex="male",
    activity_level="Lightly Active",
    goal_type="Bulk Up",
    target_weekly_change_lbs=None # Simulating the reset
)

print(f"--- Get Lean ---")
print(f"BMR: {lean_targets.bmr}")
print(f"TDEE: {lean_targets.tdee}")
print(f"Adj: {lean_targets.calorie_adjustment}")
print(f"Target: {lean_targets.daily_calories}")

print(f"\n--- Bulk Up ---")
print(f"BMR: {bulk_targets.bmr}")
print(f"TDEE: {bulk_targets.tdee}")
print(f"Adj: {bulk_targets.calorie_adjustment}")
print(f"Target: {bulk_targets.daily_calories}")

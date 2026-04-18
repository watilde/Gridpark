#!/bin/bash

# CAPE Parallel Execution Script
# This script orchestrates parallel conversations with Gemini based on CAPE roles.

TASK=$1
if [ -z "$TASK" ]; then
  echo "Usage: $0 \"Your task description\""
  exit 1
fi

TASK_ID=$(date +%s)
OUTPUT_DIR="cape_outputs/$TASK_ID"
mkdir -p "$OUTPUT_DIR"

echo "Starting CAPE parallel session for task: $TASK"
echo "Outputs will be saved to $OUTPUT_DIR"

# Function to run an agent
run_agent() {
  local role_name=$1
  local role_file=$2
  local protocol_file="cape/0_team/0_protocol.md"
  
  echo "Running $role_name..."
  
  # Construct the prompt
  local role_content=$(cat "$role_file")
  local protocol_content=$(cat "$protocol_file")
  
  local full_prompt="You are acting as the $role_name defined below:
---
$role_content
---
Follow this communication protocol:
---
$protocol_content
---
Task: $TASK
Task ID: $TASK_ID

Please provide your output strictly following the JSON format in the protocol.
Your output should focus ONLY on your role's responsibilities."

  gemini -p "$full_prompt" > "$OUTPUT_DIR/${role_name}.json"
  echo "$role_name finished."
}

# Run agents sequentially to avoid quota limits
run_agent "POA" "cape/1_product/0_role.md"
run_agent "DA" "cape/2_design/0_role.md"
run_agent "DevA" "cape/3_development/0_role.md"

echo "All agents have responded. Aggregating results..."

# Simple aggregation (optional: could be more sophisticated)
cat "$OUTPUT_DIR"/*.json > "$OUTPUT_DIR/summary.log"

echo "Session complete. Results available in $OUTPUT_DIR"

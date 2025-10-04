#!/usr/bin/env bash

set -euo pipefail

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  cat <<USAGE
Usage: $(basename "$0") [base_url] [organization_id]

Defaults:
  base_url         http://localhost:3000
  organization_id  mock-org-123
USAGE
  exit 0
fi

BASE_URL="${1:-http://localhost:3000}"
ORG_ID="${2:-mock-org-123}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to run this script" >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"

TMP_DIR="${TMPDIR:-/tmp}"
SIMULATE_FILE="$TMP_DIR/simulate.json"
RISK_FILE="$TMP_DIR/risk.json"
VALIDATE_FILE="$TMP_DIR/validate.json"

GREEN="\033[32m"
RED="\033[31m"
RESET="\033[0m"

pass() {
  local message=$1
  echo -e "${GREEN}✔${RESET} $message"
}

fail() {
  local message=$1
  echo -e "${RED}✖${RESET} $message"
  exit 1
}

make_request() {
  local method=$1
  local path=$2
  local output=$3
  local data=${4-}
  local url="${BASE_URL}${path}"
  local -a curl_opts=(-sS -o "$output" -w "%{http_code}" -X "$method")

  if [[ "$method" == "POST" || "$method" == "PUT" || "$method" == "PATCH" ]]; then
    curl_opts+=(-H "Content-Type: application/json" --data "$data")
  fi

  set +e
  local status
  status=$(curl "${curl_opts[@]}" "$url")
  local curl_exit=$?
  set -e

  if (( curl_exit != 0 )); then
    fail "$method $path (curl exited with status $curl_exit)"
  fi

  if [[ ! $status =~ ^[0-9]{3}$ ]]; then
    fail "$method $path (unexpected response status: '$status')"
  fi

  echo "$status"
}

SIMULATE_BODY=$(cat <<JSON
{
  "organizationId": "$ORG_ID",
  "scenarios": [
    {
      "name": "Baseline",
      "coverageDays": 30,
      "leadTimeStrategy": "P50",
      "includeStockReserve": true
    },
    {
      "name": "Aggressive",
      "coverageDays": 45,
      "leadTimeStrategy": "P90",
      "includeStockReserve": true
    }
  ],
  "compareResults": true
}
JSON
)

VALIDATE_BODY=$(cat <<JSON
{
  "supplier": "SUP-001",
  "orders": [
    { "sku": "SKU-001", "quantity": 80 },
    { "sku": "SKU-002", "quantity": 40 }
  ]
}
JSON
)

simulate_status=$(make_request "POST" "/api/products/purchase-requirement/simulate" "$SIMULATE_FILE" "$SIMULATE_BODY")
if [[ $simulate_status == "200" ]]; then
  pass "POST /purchase-requirement/simulate (status: $simulate_status)"
else
  fail "POST /purchase-requirement/simulate (status: $simulate_status). See $SIMULATE_FILE"
fi

risk_path="/api/products/purchase-requirement/risk?organizationId=${ORG_ID}&threshold=0.5"
risk_status=$(make_request "GET" "$risk_path" "$RISK_FILE")
if [[ $risk_status == "200" ]]; then
  pass "GET /purchase-requirement/risk (status: $risk_status)"
else
  fail "GET /purchase-requirement/risk (status: $risk_status). See $RISK_FILE"
fi

validate_status=$(make_request "POST" "/api/products/purchase-requirement/validate" "$VALIDATE_FILE" "$VALIDATE_BODY")
if [[ $validate_status == "200" ]]; then
  pass "POST /purchase-requirement/validate (status: $validate_status)"
else
  fail "POST /purchase-requirement/validate (status: $validate_status). See $VALIDATE_FILE"
fi

echo
echo "Responses saved to $SIMULATE_FILE, $RISK_FILE, $VALIDATE_FILE"

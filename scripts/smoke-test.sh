#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:3333"}
COOKIE_JAR=${COOKIE_JAR:-"/tmp/tavolo-smoke.cookies"}
TMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

note() {
  echo "[smoke] $*"
}

fail() {
  echo "[smoke][erro] $*" >&2
  if [[ -s "$TMP_DIR/status" ]]; then
    echo "[smoke][erro] status HTTP:" >&2
    cat "$TMP_DIR/status" >&2
  fi
  if [[ -s "$TMP_DIR/headers" ]]; then
    echo "[smoke][erro] headers:" >&2
    cat "$TMP_DIR/headers" >&2
  fi
  if [[ -s "$TMP_DIR/body" ]]; then
    echo "[smoke][erro] corpo da resposta:" >&2
    cat "$TMP_DIR/body" >&2
  fi
  exit 1
}

request() {
  local method=$1
  local path=$2
  local data_file=${3:-""}
  local extra_args=${4:-""}

  local url="${BASE_URL}${path}"

  if [[ -n "$data_file" ]]; then
    curl -sS -X "$method" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -D "$TMP_DIR/headers" -o "$TMP_DIR/body" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      --data-binary "@$data_file" $extra_args -w "%{http_code}" "$url" >"$TMP_DIR/status"
  else
    curl -sS -X "$method" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -D "$TMP_DIR/headers" -o "$TMP_DIR/body" \
      $extra_args -w "%{http_code}" "$url" >"$TMP_DIR/status"
  fi

  cat "$TMP_DIR/status"
}

request_form() {
  local path=$1
  local form_data=$2
  local extra_args=${3:-""}

  local url="${BASE_URL}${path}"

  curl -sS -X POST -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -D "$TMP_DIR/headers" -o "$TMP_DIR/body" \
    --data "$form_data" $extra_args -w "%{http_code}" "$url" >"$TMP_DIR/status"

  cat "$TMP_DIR/status"
}

request_multipart() {
  local path=$1
  shift
  local url="${BASE_URL}${path}"

  curl -sS -X POST -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -D "$TMP_DIR/headers" -o "$TMP_DIR/body" \
    -w "%{http_code}" "$url" "$@" >"$TMP_DIR/status"

  cat "$TMP_DIR/status"
}

request_json() {
  local path=$1
  local json_file=$2
  local extra_args=${3:-""}

  local url="${BASE_URL}${path}"

  curl -sS -X POST -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -D "$TMP_DIR/headers" -o "$TMP_DIR/body" \
    -H "Content-Type: application/json" \
    --data-binary "@$json_file" $extra_args -w "%{http_code}" "$url" >"$TMP_DIR/status"

  cat "$TMP_DIR/status"
}

expect_status() {
  local got=$1
  local expected=$2
  local label=$3

  if [[ "$got" != "$expected" ]]; then
    fail "$label: esperado HTTP $expected, recebido $got"
  fi
  note "$label: HTTP $got"
}

expect_body_contains() {
  local needle=$1
  local label=$2

  if ! grep -q "$needle" "$TMP_DIR/body"; then
    fail "$label: texto nao encontrado -> $needle"
  fi
  note "$label: texto encontrado"
}

note "Base URL: $BASE_URL"

# Public pages
status=$(request GET "/login")
expect_status "$status" "200" "GET /login"

status=$(request GET "/register")
expect_status "$status" "200" "GET /register"

status=$(request GET "/forgot-password")
expect_status "$status" "200" "GET /forgot-password"

status=$(request GET "/rota-inexistente-404")
expect_status "$status" "404" "GET /rota-inexistente-404"
if ! grep -Eq "P.gina N.o Encontrada" "$TMP_DIR/body"; then
  fail "404 pt-BR: texto nao encontrado"
fi
note "404 pt-BR: texto encontrado"

# Optional 500 test
if [[ -n "${SMOKE_FORCE_500_URL:-}" ]]; then
  status=$(request GET "$SMOKE_FORCE_500_URL")
  expect_status "$status" "500" "GET $SMOKE_FORCE_500_URL"
  expect_body_contains "Erro do Servidor" "500 pt-BR"
else
  note "SMOKE_FORCE_500_URL nao definido; pulando teste 500"
fi

# Optional login for protected routes
if [[ -n "${TEST_EMAIL:-}" && -n "${TEST_PASSWORD:-}" ]]; then
  note "Tentando login de teste"
  login_page=$(curl -sS -c "$COOKIE_JAR" "${BASE_URL}/login")
  csrf=$(echo "$login_page" | sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' | head -n1)

  if [[ -z "$csrf" ]]; then
    fail "CSRF nao encontrado na pagina de login"
  fi

  status=$(request_form "/login" "_csrf=${csrf}&email=${TEST_EMAIL}&password=${TEST_PASSWORD}" "-L")
  expect_status "$status" "200" "POST /login"

  status=$(request GET "/dashboard")
  expect_status "$status" "200" "GET /dashboard"
else
  note "TEST_EMAIL/TEST_PASSWORD nao definidos; pulando login e rotas protegidas"
fi

# Optional 500 route (auth)
if [[ -n "${SMOKE_FORCE_500_ROUTE:-}" ]]; then
  if [[ -z "${TEST_EMAIL:-}" || -z "${TEST_PASSWORD:-}" ]]; then
    fail "SMOKE_FORCE_500_ROUTE exige TEST_EMAIL e TEST_PASSWORD"
  fi

  status=$(request GET "/test/force-500?confirm=1")
  expect_status "$status" "500" "GET /test/force-500"
  expect_body_contains "Erro do Servidor" "500 pt-BR (rota temporaria)"
fi

# Optional fiscal config upload test
if [[ -n "${TEST_EMAIL:-}" && -n "${TEST_PASSWORD:-}" && -n "${TEST_FISCAL_CONFIG:-}" ]]; then
  note "Testando formulario de configuracao fiscal"
  config_page=$(curl -sS -b "$COOKIE_JAR" "${BASE_URL}/config/fiscal/create")
  csrf=$(echo "$config_page" | sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' | head -n1)

  if [[ -z "$csrf" ]]; then
    fail "CSRF nao encontrado na pagina de configuracao fiscal"
  fi

  if [[ -n "${CERT_PATH:-}" && -n "${CSC_ID:-}" && -n "${CSC_TOKEN:-}" && -n "${CERT_PASSWORD:-}" ]]; then
    status=$(request_multipart "/config/fiscal" \
      -F "_csrf=$csrf" \
      -F "is_homologation=true" \
      -F "certificate_password=${CERT_PASSWORD}" \
      -F "csc_id=${CSC_ID}" \
      -F "csc_token=${CSC_TOKEN}" \
      -F "certificate=@${CERT_PATH}" \
      -L)
    expect_status "$status" "200" "POST /config/fiscal (upload)"
  else
    status=$(request_multipart "/config/fiscal" \
      -F "_csrf=$csrf" \
      -F "is_homologation=true" \
      -F "certificate_password=" \
      -F "csc_id=" \
      -F "csc_token=" \
      -L)
    expect_status "$status" "200" "POST /config/fiscal (faltando certificado)"
    expect_body_contains "Certificado" "Mensagem de certificado"
  fi
else
  note "TEST_FISCAL_CONFIG nao definido ou sem login; pulando upload fiscal"
fi

# Optional fiscal config API
if [[ -n "${FISCAL_CONFIG_JSON:-}" ]]; then
  if [[ -z "${TEST_EMAIL:-}" || -z "${TEST_PASSWORD:-}" ]]; then
    fail "FISCAL_CONFIG_JSON exige TEST_EMAIL e TEST_PASSWORD"
  fi

  if [[ ! -f "$FISCAL_CONFIG_JSON" ]]; then
    fail "FISCAL_CONFIG_JSON nao encontrado: $FISCAL_CONFIG_JSON"
  fi

  FISCAL_CONFIG_PATH=${FISCAL_CONFIG_PATH:-"/api/fiscal/config"}
  FISCAL_CONFIG_EXPECT_STATUS=${FISCAL_CONFIG_EXPECT_STATUS:-""}
  FISCAL_CONFIG_EXPECT_TEXT=${FISCAL_CONFIG_EXPECT_TEXT:-"Configura..o fiscal"}

  note "Testando API de configuracao fiscal em ${FISCAL_CONFIG_PATH}"
  status=$(request_json "$FISCAL_CONFIG_PATH" "$FISCAL_CONFIG_JSON")
  note "Fiscal config status: HTTP $status"

  if [[ -n "$FISCAL_CONFIG_EXPECT_STATUS" ]]; then
    expect_status "$status" "$FISCAL_CONFIG_EXPECT_STATUS" "Fiscal config status"
  fi

  if grep -Eq "$FISCAL_CONFIG_EXPECT_TEXT" "$TMP_DIR/body"; then
    note "Mensagem de configuracao fiscal encontrada"
  else
    fail "Mensagem de configuracao fiscal nao encontrada"
  fi
else
  note "FISCAL_CONFIG_JSON nao definido; pulando API /api/fiscal/config"
fi

# Optional XSD validation
if [[ -n "${XSD_PAYLOAD_JSON:-}" ]]; then
  XSD_EMIT_PATH=${XSD_EMIT_PATH:-"/api/fiscal/emit"}
  XSD_EXPECT_STATUS=${XSD_EXPECT_STATUS:-""}
  XSD_EXPECT_TEXT=${XSD_EXPECT_TEXT:-"XML inv.lido|XSD"}

  if [[ ! -f "$XSD_PAYLOAD_JSON" ]]; then
    fail "XSD_PAYLOAD_JSON nao encontrado: $XSD_PAYLOAD_JSON"
  fi

  note "Testando validacao XSD em ${XSD_EMIT_PATH}"
  status=$(request_json "$XSD_EMIT_PATH" "$XSD_PAYLOAD_JSON")
  note "XSD emit status: HTTP $status"

  if [[ -n "$XSD_EXPECT_STATUS" ]]; then
    expect_status "$status" "$XSD_EXPECT_STATUS" "XSD status"
  fi

  if grep -Eq "$XSD_EXPECT_TEXT" "$TMP_DIR/body"; then
    note "Mensagem XSD/XML encontrada"
  else
    fail "Mensagem de validacao XSD/XML nao encontrada"
  fi
else
  note "XSD_PAYLOAD_JSON nao definido; pulando validacao XSD"
fi

note "Smoke-test finalizado com sucesso"

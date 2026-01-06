#!/bin/bash

# Test Webhook Coolify pour Da Vinci
# Usage: ./scripts/test-webhook.sh [webhook-url]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default URL
WEBHOOK_URL="${1:-http://localhost:5173/api/webhooks/coolify}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🔔 Test Webhook Coolify - Da Vinci${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}URL:${NC} $WEBHOOK_URL"
echo ""

# Test 1: Deployment Started
echo -e "${BLUE}Test 1: application:deployment:started${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "application:deployment:started",
    "data": {
      "applicationUuid": "test-app-uuid-123",
      "deploymentUuid": "test-deploy-uuid-456",
      "startedAt": "2026-01-06T10:00:00Z",
      "commitSha": "abc123",
      "commitMessage": "Test deployment",
      "branch": "main"
    },
    "timestamp": "2026-01-06T10:00:00Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Deployment Started - OK${NC}"
  echo "   Response: $RESPONSE"
else
  echo -e "${RED}❌ Deployment Started - FAILED${NC}"
  echo "   Response: $RESPONSE"
fi
echo ""

# Wait a bit
sleep 1

# Test 2: Deployment Success
echo -e "${BLUE}Test 2: application:deployment:success${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "application:deployment:success",
    "data": {
      "applicationUuid": "test-app-uuid-123",
      "deploymentUuid": "test-deploy-uuid-456",
      "finishedAt": "2026-01-06T10:05:00Z",
      "duration": 300,
      "logs": "Build successful!\nDeployment complete."
    },
    "timestamp": "2026-01-06T10:05:00Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Deployment Success - OK${NC}"
  echo "   Response: $RESPONSE"
else
  echo -e "${RED}❌ Deployment Success - FAILED${NC}"
  echo "   Response: $RESPONSE"
fi
echo ""

sleep 1

# Test 3: Deployment Failed
echo -e "${BLUE}Test 3: application:deployment:failed${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "application:deployment:failed",
    "data": {
      "applicationUuid": "test-app-uuid-123",
      "deploymentUuid": "test-deploy-uuid-789",
      "finishedAt": "2026-01-06T10:10:00Z",
      "duration": 120,
      "error": "Build failed: npm install error",
      "logs": "npm ERR! Failed to install dependencies"
    },
    "timestamp": "2026-01-06T10:10:00Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Deployment Failed - OK${NC}"
  echo "   Response: $RESPONSE"
else
  echo -e "${RED}❌ Deployment Failed - FAILED${NC}"
  echo "   Response: $RESPONSE"
fi
echo ""

sleep 1

# Test 4: Application Status Changed
echo -e "${BLUE}Test 4: application:status:changed${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "application:status:changed",
    "data": {
      "applicationUuid": "test-app-uuid-123",
      "status": "running"
    },
    "timestamp": "2026-01-06T10:15:00Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Application Status Changed - OK${NC}"
  echo "   Response: $RESPONSE"
else
  echo -e "${RED}❌ Application Status Changed - FAILED${NC}"
  echo "   Response: $RESPONSE"
fi
echo ""

# Test 5: Invalid Event (should handle gracefully)
echo -e "${BLUE}Test 5: Invalid Event Type${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invalid:event:type",
    "data": {},
    "timestamp": "2026-01-06T10:20:00Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${YELLOW}⚠️  Invalid Event - Handled${NC}"
  echo "   Response: $RESPONSE"
else
  echo -e "${RED}❌ Invalid Event - ERROR${NC}"
  echo "   Response: $RESPONSE"
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Tests terminés !${NC}"
echo ""
echo -e "${YELLOW}📝 Vérifiez les logs dans le terminal Da Vinci pour voir :${NC}"
echo "   - [Coolify Webhook] events"
echo "   - [Notification] messages"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

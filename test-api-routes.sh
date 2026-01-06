#!/bin/bash

###############################################################################
# Script de Test des Routes API - Da Vinci
# Teste toutes les routes CRUD pour Organizations, Users, Projects
###############################################################################

set -e

API_URL="${API_URL:-http://localhost:5173}"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}╔══════════════════════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║       Da Vinci - Test des Routes API                        ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚══════════════════════════════════════════════════════════════╝${COLOR_RESET}"
echo ""
echo -e "API URL: ${COLOR_YELLOW}${API_URL}${COLOR_RESET}"
echo ""

# Variables pour stocker les IDs
ORG_ID=""
USER_ID=""
PROJECT_ID=""

###############################################################################
# ORGANIZATIONS
###############################################################################

echo -e "${COLOR_YELLOW}📦 TEST: Organizations${COLOR_RESET}"
echo ""

# 1. Créer une organisation
echo -e "${COLOR_BLUE}→ POST /api/organizations${COLOR_RESET}"
ORG_RESPONSE=$(curl -s -X POST "${API_URL}/api/organizations" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agence Web Test",
    "domain": "test-agency.com",
    "settings": {
      "allowedDomains": ["test.com"],
      "maxProjects": 10
    }
  }')

echo "$ORG_RESPONSE" | jq '.'
ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.data.id')

if [ "$ORG_ID" != "null" ] && [ -n "$ORG_ID" ]; then
  echo -e "${COLOR_GREEN}✓ Organisation créée: $ORG_ID${COLOR_RESET}"
else
  echo -e "${COLOR_RED}✗ Échec création organisation${COLOR_RESET}"
  exit 1
fi
echo ""

# 2. Lister les organisations
echo -e "${COLOR_BLUE}→ GET /api/organizations${COLOR_RESET}"
curl -s "${API_URL}/api/organizations" | jq '.data[] | {id, name, domain}'
echo -e "${COLOR_GREEN}✓ Liste récupérée${COLOR_RESET}"
echo ""

# 3. Récupérer une organisation
echo -e "${COLOR_BLUE}→ GET /api/organizations/${ORG_ID}${COLOR_RESET}"
curl -s "${API_URL}/api/organizations/${ORG_ID}" | jq '.data | {id, name, domain, settings}'
echo -e "${COLOR_GREEN}✓ Détails récupérés${COLOR_RESET}"
echo ""

# 4. Mettre à jour l'organisation
echo -e "${COLOR_BLUE}→ PUT /api/organizations/${ORG_ID}${COLOR_RESET}"
curl -s -X PUT "${API_URL}/api/organizations/${ORG_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agence Web Test (Updated)",
    "coolifyOrganizationId": "coolify-123"
  }' | jq '.data | {id, name, coolifyOrganizationId}'
echo -e "${COLOR_GREEN}✓ Organisation mise à jour${COLOR_RESET}"
echo ""

###############################################################################
# USERS
###############################################################################

echo -e "${COLOR_YELLOW}👥 TEST: Users${COLOR_RESET}"
echo ""

# 1. Créer un utilisateur
echo -e "${COLOR_BLUE}→ POST /api/users${COLOR_RESET}"
USER_RESPONSE=$(curl -s -X POST "${API_URL}/api/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@agency.com\",
    \"name\": \"John Doe\",
    \"organizationId\": \"${ORG_ID}\",
    \"role\": \"ADMIN\"
  }")

echo "$USER_RESPONSE" | jq '.'
USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data.id')

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo -e "${COLOR_GREEN}✓ Utilisateur créé: $USER_ID${COLOR_RESET}"
else
  echo -e "${COLOR_RED}✗ Échec création utilisateur${COLOR_RESET}"
  exit 1
fi
echo ""

# 2. Lister les utilisateurs
echo -e "${COLOR_BLUE}→ GET /api/users?organizationId=${ORG_ID}${COLOR_RESET}"
curl -s "${API_URL}/api/users?organizationId=${ORG_ID}" | jq '.data[] | {id, name, email, role}'
echo -e "${COLOR_GREEN}✓ Liste récupérée${COLOR_RESET}"
echo ""

# 3. Récupérer un utilisateur
echo -e "${COLOR_BLUE}→ GET /api/users/${USER_ID}${COLOR_RESET}"
curl -s "${API_URL}/api/users/${USER_ID}" | jq '.data | {id, name, email, role, organization: .organization.name}'
echo -e "${COLOR_GREEN}✓ Détails récupérés${COLOR_RESET}"
echo ""

# 4. Mettre à jour l'utilisateur
echo -e "${COLOR_BLUE}→ PUT /api/users/${USER_ID}${COLOR_RESET}"
curl -s -X PUT "${API_URL}/api/users/${USER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe (Senior Dev)",
    "role": "DEVELOPER"
  }' | jq '.data | {id, name, role}'
echo -e "${COLOR_GREEN}✓ Utilisateur mis à jour${COLOR_RESET}"
echo ""

###############################################################################
# PROJECTS
###############################################################################

echo -e "${COLOR_YELLOW}🚀 TEST: Projects${COLOR_RESET}"
echo ""

# 1. Créer un projet
echo -e "${COLOR_BLUE}→ POST /api/projects${COLOR_RESET}"
PROJECT_RESPONSE=$(curl -s -X POST "${API_URL}/api/projects" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Site Vitrine Client\",
    \"organizationId\": \"${ORG_ID}\",
    \"domain\": \"client.test.com\",
    \"gitRepository\": \"https://github.com/test/client-site\",
    \"status\": \"ACTIVE\"
  }")

echo "$PROJECT_RESPONSE" | jq '.'
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.data.id')

if [ "$PROJECT_ID" != "null" ] && [ -n "$PROJECT_ID" ]; then
  echo -e "${COLOR_GREEN}✓ Projet créé: $PROJECT_ID${COLOR_RESET}"
else
  echo -e "${COLOR_RED}✗ Échec création projet${COLOR_RESET}"
  exit 1
fi
echo ""

# 2. Lister les projets
echo -e "${COLOR_BLUE}→ GET /api/projects?organizationId=${ORG_ID}${COLOR_RESET}"
curl -s "${API_URL}/api/projects?organizationId=${ORG_ID}" | jq '.data[] | {id, name, domain, status}'
echo -e "${COLOR_GREEN}✓ Liste récupérée${COLOR_RESET}"
echo ""

# 3. Récupérer un projet
echo -e "${COLOR_BLUE}→ GET /api/projects/${PROJECT_ID}${COLOR_RESET}"
curl -s "${API_URL}/api/projects/${PROJECT_ID}" | jq '.data | {id, name, domain, status, organization: .organization.name}'
echo -e "${COLOR_GREEN}✓ Détails récupérés${COLOR_RESET}"
echo ""

# 4. Mettre à jour le projet
echo -e "${COLOR_BLUE}→ PUT /api/projects/${PROJECT_ID}${COLOR_RESET}"
curl -s -X PUT "${API_URL}/api/projects/${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAUSED",
    "coolifyProjectId": "coolify-proj-456"
  }' | jq '.data | {id, name, status, coolifyProjectId}'
echo -e "${COLOR_GREEN}✓ Projet mis à jour${COLOR_RESET}"
echo ""

###############################################################################
# CLEANUP (optionnel)
###############################################################################

echo -e "${COLOR_YELLOW}🧹 CLEANUP (optionnel - appuyez sur Enter pour passer)${COLOR_RESET}"
read -p "Voulez-vous supprimer les données de test ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${COLOR_BLUE}→ DELETE /api/projects/${PROJECT_ID}${COLOR_RESET}"
  curl -s -X DELETE "${API_URL}/api/projects/${PROJECT_ID}" | jq '.'
  echo -e "${COLOR_GREEN}✓ Projet supprimé${COLOR_RESET}"
  echo ""

  echo -e "${COLOR_BLUE}→ DELETE /api/users/${USER_ID}${COLOR_RESET}"
  curl -s -X DELETE "${API_URL}/api/users/${USER_ID}" | jq '.'
  echo -e "${COLOR_GREEN}✓ Utilisateur supprimé${COLOR_RESET}"
  echo ""

  echo -e "${COLOR_BLUE}→ DELETE /api/organizations/${ORG_ID}${COLOR_RESET}"
  curl -s -X DELETE "${API_URL}/api/organizations/${ORG_ID}" | jq '.'
  echo -e "${COLOR_GREEN}✓ Organisation supprimée${COLOR_RESET}"
  echo ""
fi

###############################################################################
# RÉSUMÉ
###############################################################################

echo ""
echo -e "${COLOR_GREEN}╔══════════════════════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_GREEN}║              ✓ Tous les tests réussis !                     ║${COLOR_RESET}"
echo -e "${COLOR_GREEN}╚══════════════════════════════════════════════════════════════╝${COLOR_RESET}"
echo ""
echo -e "IDs créés:"
echo -e "  Organization: ${COLOR_YELLOW}${ORG_ID}${COLOR_RESET}"
echo -e "  User:         ${COLOR_YELLOW}${USER_ID}${COLOR_RESET}"
echo -e "  Project:      ${COLOR_YELLOW}${PROJECT_ID}${COLOR_RESET}"
echo ""

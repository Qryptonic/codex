#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
echo -e "${CYAN}"
echo "==============================================="
echo "  QStrike Dockerfile Update Script"
echo "==============================================="
echo -e "${NC}"

# Base directory
BASE_DIR="/Users/jason/Documents/QS/QStrike"

# Find all Dockerfiles
DOCKERFILES=$(find "$BASE_DIR" -name "Dockerfile" -type f)

# Function to update a Dockerfile
update_dockerfile() {
  local file=$1
  echo -e "${YELLOW}Updating $file...${NC}"
  
  # Replace 'npm ci' with 'npm install' 
  sed -i '' 's/RUN npm ci/RUN npm install/g' "$file"
  
  # Replace 'npm ci --only=production' with 'npm install --omit=dev'
  sed -i '' 's/RUN npm ci --only=production/RUN npm install --omit=dev/g' "$file"
  
  echo -e "${GREEN}✓ Updated $file${NC}"
}

# Update each Dockerfile
for file in $DOCKERFILES; do
  update_dockerfile "$file"
done

# Summary
echo -e "\n${CYAN}==== Summary ====${NC}"
echo -e "${GREEN}Updated $(echo "$DOCKERFILES" | wc -l | tr -d ' ') Dockerfiles!${NC}"
echo -e "${YELLOW}You can now run:${NC}"
echo -e "  cd ${BASE_DIR}"
echo -e "  ./run-with-dashboard.sh --rebuild"
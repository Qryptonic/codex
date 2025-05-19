#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
echo -e "${CYAN}"
echo "==============================================="
echo "  QStrike Package Synchronization Tool"
echo "==============================================="
echo -e "${NC}"

# Base directory
BASE_DIR="/Users/jason/Documents/QS/QStrike"

# Array of directories containing package.json files
PACKAGE_DIRS=(
    "${BASE_DIR}"
    "${BASE_DIR}/packages/dashboard-ui"
    "${BASE_DIR}/packages/lhr-viewer"
    "${BASE_DIR}/services/calibration-poller"
    "${BASE_DIR}/services/planner"
    "${BASE_DIR}/services/delay-player"
    "${BASE_DIR}/services/upload-service"
    "${BASE_DIR}/src"
)

# Function to sync a single package
sync_package() {
    local dir=$1
    if [ -f "${dir}/package.json" ]; then
        echo -e "${YELLOW}Syncing dependencies in ${dir}...${NC}"
        cd "${dir}" || return
        # Run npm install to update package-lock.json
        npm install
        # Check if it worked
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully synchronized ${dir}${NC}"
        else
            echo -e "${RED}✗ Failed to synchronize ${dir}${NC}"
            FAILED_DIRS+=("${dir}")
        fi
    else
        echo -e "${YELLOW}No package.json found in ${dir}, skipping.${NC}"
    fi
}

# Track failed directories
FAILED_DIRS=()

# Process each directory
for dir in "${PACKAGE_DIRS[@]}"; do
    sync_package "${dir}"
done

# Summary
echo -e "\n${CYAN}==== Summary ====${NC}"
if [ ${#FAILED_DIRS[@]} -eq 0 ]; then
    echo -e "${GREEN}All package.json and package-lock.json files are now synchronized!${NC}"
    echo -e "${YELLOW}You can now run:${NC}"
    echo -e "  cd ${BASE_DIR}"
    echo -e "  ./run-with-dashboard.sh"
else
    echo -e "${RED}Failed to synchronize the following directories:${NC}"
    for failed_dir in "${FAILED_DIRS[@]}"; do
        echo -e "  - ${failed_dir}"
    done
    echo -e "${YELLOW}Please check the errors and try again.${NC}"
fi
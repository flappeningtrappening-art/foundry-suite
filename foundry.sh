#!/bin/bash

# FOUNDRY SUITE MASTER CONTROLLER
# One script to rule the factory.

# Colors for better logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}==================================================${NC}"
echo -e "${PURPLE}   THE FOUNDRY | INTEGRATED PRODUCTION SYSTEM     ${NC}"
echo -e "${PURPLE}==================================================${NC}"

# CLEANUP: Kill anything already on our ports
echo -e "${BLUE}Performing pre-flight port cleanup...${NC}"
fuser -k 8000/tcp 3101/tcp 3010/tcp 3005/tcp 3006/tcp 4000/tcp > /dev/null 2>&1
sleep 2

# Cleanup function to kill background processes on exit
cleanup() {
    echo -e "\n${PURPLE}Stopping The Foundry...${NC}"
    kill $PYTHON_PID $GENKIT_PID $CONSOLE_PID 2>/dev/null
    exit
}

trap cleanup SIGINT

# 1. START PYTHON ANALYTIC SERVICE (Port 8000)
echo -e "${BLUE}[1/3] Starting Forensic Engine (Python)...${NC}"
mkdir -p .foundry/logs
cd solution-factory/services/analytic-service
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:.
python3 src/main.py > ../../../.foundry/logs/python.log 2>&1 &
PYTHON_PID=$!
cd ../../..

# Wait for Python to be ready
echo -n "Waiting for Forensic Engine..."
ENGINE_READY=false
for i in {1..30}; do
    if lsof -i :8000 > /dev/null; then
        echo -e " ${GREEN}READY${NC}"
        ENGINE_READY=true
        break
    fi
    echo -n "."
    sleep 1
done

if [ "$ENGINE_READY" = false ]; then
    echo -e " ${RED}FAILED${NC}"
    echo "Check logs at .foundry/logs/python.log"
    kill $PYTHON_PID 2>/dev/null
    exit 1
fi

# 2. START GENKIT SERVER (Port 3101 / UI 4000)
echo -e "${BLUE}[2/3] Starting Genkit Orchestrator...${NC}"
cd solution-factory/apps/genkit-server
pnpm dev > ../../../.foundry/logs/genkit.log 2>&1 &
GENKIT_PID=$!
cd ../../..

# Wait for Genkit to be ready
echo -n "Waiting for Orchestrator..."
for i in {1..30}; do
    if lsof -i :3101 > /dev/null; then
        echo -e " ${GREEN}READY${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# 3. START FOUNDRY APPS

echo -e "${BLUE}[3/3] Starting Foundry Application Suite...${NC}"



# Start Realty (Port 3005)

echo -n "Starting Foundry Realty..."

cd solution-factory/apps/real-estate-generator

pnpm dev > ../../../.foundry/logs/realty.log 2>&1 &

REALTY_PID=$!

cd ../../..

echo -e " ${GREEN}LAUNCHED (Port 3005)${NC}"



# Start Outreach (Port 3006)

echo -n "Starting Foundry Outreach..."

cd solution-factory/apps/cold-email-generator

pnpm dev > ../../../.foundry/logs/outreach.log 2>&1 &

OUTREACH_PID=$!

cd ../../..

echo -e " ${GREEN}LAUNCHED (Port 3006)${NC}"



# Start Main Console (Foreground)

echo -e "${BLUE}Starting Foundry Console (Port 3010)...${NC}"

cd solution-factory/apps/foundry-console

pnpm dev

CONSOLE_PID=$!



# Cleanup function update

cleanup() {

    echo -e "\n${PURPLE}Stopping The Foundry...${NC}"

    kill $PYTHON_PID $GENKIT_PID $CONSOLE_PID $REALTY_PID $OUTREACH_PID 2>/dev/null

    exit

}

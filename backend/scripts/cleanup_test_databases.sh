#!/bin/bash
# Script to clean up test databases from PostgreSQL container
# Usage: ./backend/scripts/cleanup_test_databases.sh [--all|--worker|--main]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_CONTAINER="postgres_timescale_pg_vector"
POSTGRES_USER="postgres"
DEV_DB="speech_db"
TEST_DB_PREFIX="test_db_"

echo -e "${GREEN}=== Test Database Cleanup Script ===${NC}"

# Check if docker compose is running
if ! docker compose ps | grep -q "${POSTGRES_CONTAINER}.*Up"; then
    echo -e "${RED}Error: PostgreSQL container is not running!${NC}"
    echo "Start it with: docker compose up -d ${POSTGRES_CONTAINER}"
    exit 1
fi

# Function to list test databases
list_test_dbs() {
    echo -e "${YELLOW}Listing test databases...${NC}"
    docker compose exec -T ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -t -c \
        "SELECT datname FROM pg_database WHERE datname LIKE '${TEST_DB_PREFIX}%' ORDER BY datname;" \
        | grep -v '^$' | sed 's/^[[:space:]]*//' || true
}

# Function to drop a database
drop_database() {
    local db_name=$1
    echo -e "${YELLOW}Dropping database: ${db_name}${NC}"
    
    # Terminate connections first
    docker compose exec -T ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db_name}' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1 || true
    
    # Drop the database
    docker compose exec -T ${POSTGRES_CONTAINER} dropdb -U ${POSTGRES_USER} --if-exists "${db_name}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully dropped: ${db_name}${NC}"
    else
        echo -e "${RED}✗ Failed to drop: ${db_name}${NC}"
    fi
}

# Function to drop all test databases
drop_all_test_dbs() {
    local test_dbs=$(list_test_dbs)
    
    if [ -z "$test_dbs" ]; then
        echo -e "${GREEN}No test databases found.${NC}"
        return
    fi
    
    echo -e "${YELLOW}Found test databases:${NC}"
    echo "$test_dbs" | sed 's/^/  - /'
    echo ""
    
    read -p "Are you sure you want to drop ALL test databases? (yes/no): " confirmation
    if [ "$confirmation" != "yes" ]; then
        echo -e "${YELLOW}Cleanup cancelled.${NC}"
        exit 0
    fi
    
    echo ""
    while IFS= read -r db_name; do
        [ -z "$db_name" ] && continue
        drop_database "$db_name"
    done <<< "$test_dbs"
}

# Function to drop worker databases only
drop_worker_dbs() {
    local worker_dbs=$(docker compose exec -T ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -t -c \
        "SELECT datname FROM pg_database WHERE datname LIKE '${TEST_DB_PREFIX}worker%' ORDER BY datname;" \
        | grep -v '^$' | sed 's/^[[:space:]]*//' || true)
    
    if [ -z "$worker_dbs" ]; then
        echo -e "${GREEN}No worker test databases found.${NC}"
        return
    fi
    
    echo -e "${YELLOW}Found worker databases:${NC}"
    echo "$worker_dbs" | sed 's/^/  - /'
    echo ""
    
    while IFS= read -r db_name; do
        [ -z "$db_name" ] && continue
        drop_database "$db_name"
    done <<< "$worker_dbs"
}

# Function to drop main test database
drop_main_db() {
    local main_db="${TEST_DB_PREFIX}main"
    
    if docker compose exec -T ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -lqt | cut -d \| -f 1 | grep -qw "$main_db"; then
        drop_database "$main_db"
    else
        echo -e "${GREEN}Main test database does not exist.${NC}"
    fi
}

# Safety check - prevent dropping development database
check_safety() {
    local all_dbs=$(docker compose exec -T ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -t -c \
        "SELECT datname FROM pg_database WHERE datname = '${DEV_DB}';" \
        | grep -v '^$' | sed 's/^[[:space:]]*//' || true)
    
    if [ ! -z "$all_dbs" ]; then
        echo -e "${GREEN}✓ Development database '${DEV_DB}' exists and will NOT be touched.${NC}"
    fi
}

# Main script logic
main() {
    check_safety
    
    case "${1:-}" in
        --all|-a)
            drop_all_test_dbs
            ;;
        --worker|-w)
            drop_worker_dbs
            ;;
        --main|-m)
            drop_main_db
            ;;
        --list|-l)
            list_test_dbs
            ;;
        --help|-h)
            echo "Usage: $0 [option]"
            echo ""
            echo "Options:"
            echo "  --all, -a      Drop all test databases (requires confirmation)"
            echo "  --worker, -w   Drop only worker test databases (test_db_worker_*)"
            echo "  --main, -m     Drop only main test database (test_db_main)"
            echo "  --list, -l     List all test databases"
            echo "  --help, -h     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --all       # Drop all test databases"
            echo "  $0 --worker    # Drop worker databases only"
            echo "  $0 --list      # List test databases"
            ;;
        *)
            echo -e "${YELLOW}No option specified. Use --help for usage information.${NC}"
            echo ""
            list_test_dbs
            echo ""
            echo -e "${YELLOW}Run with --all to drop all test databases${NC}"
            ;;
    esac
}

main "$@"

echo -e "${GREEN}=== Cleanup Complete ===${NC}"

#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting BrokerFlow CRM Application${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is installed (either standalone or plugin)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}❌ docker-compose is not installed. Please install docker-compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and docker-compose are installed${NC}"
echo ""

# Build and start services
echo -e "${YELLOW}📦 Building and starting services...${NC}"
$DOCKER_COMPOSE up -d

echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
if $DOCKER_COMPOSE ps | grep -q "crm_imob_backend"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    $DOCKER_COMPOSE logs backend
    exit 1
fi

if $DOCKER_COMPOSE ps | grep -q "crm_imob_db"; then
    echo -e "${GREEN}✓ Database is running${NC}"
else
    echo -e "${RED}❌ Database failed to start${NC}"
    $DOCKER_COMPOSE logs postgres
    exit 1
fi

if $DOCKER_COMPOSE ps | grep -q "crm_imob_frontend"; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    $DOCKER_COMPOSE logs frontend
    exit 1
fi

echo ""
echo -e "${GREEN}✅ BrokerFlow CRM is ready!${NC}"
echo ""
echo -e "${YELLOW}📋 Services:${NC}"
echo -e "  🌐 Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  🔌 API:       ${GREEN}http://localhost:3001${NC}"
echo -e "  🗄️  Database:  ${GREEN}localhost:3306${NC}"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo -e "  View logs:        ${GREEN}$DOCKER_COMPOSE logs -f${NC}"
echo -e "  Stop services:    ${GREEN}$DOCKER_COMPOSE down${NC}"
echo -e "  View DB studio:   ${GREEN}$DOCKER_COMPOSE exec backend npx prisma studio${NC}"
echo ""
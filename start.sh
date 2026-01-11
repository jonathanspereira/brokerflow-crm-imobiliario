#!/bin/sh
# Script para rodar backend e frontend juntos

# Inicia backend
node ./crm_imob_backend/dist/index.js &
BACK_PID=$!

# Inicia frontend
cd ./crm_imob_frontend && npm start &
FRONT_PID=$!

# Espera ambos terminarem
wait $BACK_PID
wait $FRONT_PID
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
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "Populating Parts..."

# Function to create a part
create_part() {
    local titulo="$1"
    local secao="$2"
    local tempo="$3"
    
    echo "Creating part: $titulo ($secao)..."
    curl -s -X POST "$BASE_URL/parts" \
        -H "Content-Type: application/json" \
        -d "{
            \"titulo\": \"$titulo\",
            \"secao\": \"$secao\",
            \"tempoPadrao\": $tempo,
            \"requerAjudante\": false
        }"
    echo ""
}

# Create General Parts
create_part "Presidente" "geral" 5
create_part "Oração Inicial" "geral" 5
create_part "Oração Final" "geral" 5

echo "Done!"

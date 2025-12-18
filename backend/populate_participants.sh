#!/bin/bash

BASE_URL="http://localhost:3000/users"
CONTENT_TYPE="Content-Type: application/json"

# Counter for total users
count=0

get_availability() {
  # We want exactly 5 unavailable.
  # We can make the last 5 unavailable.
  if [ $count -ge 53 ]; then
    echo "false"
  else
    echo "true"
  fi
}

gen_phone() {
  # Random phone: (11) 9xxxx-xxxx
  echo "(11) 9$((RANDOM%10000+1000))-$((RANDOM%10000+1000))"
}

echo "Creating 8 Elders..."
for i in {1..8}; do
  count=$((count+1))
  avail=$(get_availability)
  phone=$(gen_phone)
  curl -s -X POST $BASE_URL -H "$CONTENT_TYPE" -d "{\"nome\": \"Anciao $i\", \"email\": \"anciao.$i@example.com\", \"privilegio\": \"ANCIAO\", \"podeDesignar\": $avail, \"telefone\": \"$phone\"}" > /dev/null
  echo -n "."
done
echo " Done."

echo "Creating 10 Ministerial Servants..."
for i in {1..10}; do
  count=$((count+1))
  avail=$(get_availability)
  phone=$(gen_phone)
  curl -s -X POST $BASE_URL -H "$CONTENT_TYPE" -d "{\"nome\": \"Servo $i\", \"email\": \"servo.$i@example.com\", \"privilegio\": \"SERVO\", \"podeDesignar\": $avail, \"telefone\": \"$phone\"}" > /dev/null
  echo -n "."
done
echo " Done."

echo "Creating 20 Male Publishers..."
for i in {1..20}; do
  count=$((count+1))
  avail=$(get_availability)
  phone=$(gen_phone)
  curl -s -X POST $BASE_URL -H "$CONTENT_TYPE" -d "{\"nome\": \"Publicador H $i\", \"email\": \"pub.h.$i@example.com\", \"privilegio\": \"PUB_HOMEM\", \"podeDesignar\": $avail, \"telefone\": \"$phone\"}" > /dev/null
  echo -n "."
done
echo " Done."

echo "Creating 20 Female Publishers..."
for i in {1..20}; do
  count=$((count+1))
  avail=$(get_availability)
  phone=$(gen_phone)
  curl -s -X POST $BASE_URL -H "$CONTENT_TYPE" -d "{\"nome\": \"Publicadora M $i\", \"email\": \"pub.m.$i@example.com\", \"privilegio\": \"PUB_MULHER\", \"podeDesignar\": $avail, \"telefone\": \"$phone\"}" > /dev/null
  echo -n "."
done
echo " Done."

echo "Population complete!"

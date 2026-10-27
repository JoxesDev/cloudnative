#!/bin/bash
set -e

mkdir -p /home/ec2-user/logs

echo "Deteniendo procesos java previos..."
pkill -f 'java -jar' || true
sleep 2

echo "Iniciando ms-vidasalud-appointments (8081)..."
SPRING_RABBITMQ_HOST=localhost \
SPRING_RABBITMQ_PORT=5672 \
SPRING_RABBITMQ_USERNAME=admin \
SPRING_RABBITMQ_PASSWORD=admin123 \
SERVER_PORT=8081 \
nohup /usr/lib/jvm/java-21-amazon-corretto/bin/java -Xms128m -Xmx256m -jar /home/ec2-user/app/ms-vidasalud-appointments/target/ms-vidasalud-appointments-0.0.1-SNAPSHOT.jar > /home/ec2-user/logs/appointments.log 2>&1 &

echo "Iniciando ms-vidasalud-admin (8083)..."
SPRING_RABBITMQ_HOST=localhost \
SPRING_RABBITMQ_PORT=5672 \
SPRING_RABBITMQ_USERNAME=admin \
SPRING_RABBITMQ_PASSWORD=admin123 \
SERVER_PORT=8083 \
nohup /usr/lib/jvm/java-21-amazon-corretto/bin/java -Xms128m -Xmx256m -jar /home/ec2-user/app/ms-vidasalud-admin/target/ms-vidasalud-admin-0.0.1-SNAPSHOT.jar > /home/ec2-user/logs/admin.log 2>&1 &

echo "Iniciando ms-vidasalud-bff (8082)..."
SERVER_PORT=8082 \
AZURE_TENANT_ID=9333d7eb-2af5-4631-835e-78e32d2ae6d1 \
AZURE_API_CLIENT_ID=471213b2-94cc-4f45-bc30-d084984ac045 \
APPOINTMENTS_URL=http://localhost:8081 \
ADMIN_URL=http://localhost:8083 \
nohup /usr/lib/jvm/java-21-amazon-corretto/bin/java -Xms128m -Xmx256m -jar /home/ec2-user/app/ms-vidasalud-bff/target/ms-vidasalud-bff-0.0.1-SNAPSHOT.jar > /home/ec2-user/logs/bff.log 2>&1 &

echo "Esperando inicio..."
sleep 15
ps aux | grep java

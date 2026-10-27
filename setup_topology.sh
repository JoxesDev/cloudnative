#!/bin/bash
set -e

echo "Declarando DLQs..."
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare queue name=vidasalud.notifications.dlq durable=true
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare queue name=vidasalud.tickets.dlq durable=true
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare queue name=vidasalud.audit.dlq durable=true

echo "Declarando Colas Principales con DLQ..."
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare queue name=vidasalud.notifications.queue durable=true arguments='{"x-dead-letter-exchange":"vidasalud.dlx.exchange","x-dead-letter-routing-key":"appointment.notification.dlq"}'
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare queue name=vidasalud.tickets.queue durable=true arguments='{"x-dead-letter-exchange":"vidasalud.dlx.exchange","x-dead-letter-routing-key":"appointment.ticket.dlq"}'
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare queue name=vidasalud.audit.queue durable=true arguments='{"x-dead-letter-exchange":"vidasalud.dlx.exchange","x-dead-letter-routing-key":"appointment.audit.dlq"}'

echo "Declarando Bindings de Colas Principales..."
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare binding source=vidasalud.direct.exchange destination=vidasalud.notifications.queue routing_key=appointment.notification
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare binding source=vidasalud.direct.exchange destination=vidasalud.tickets.queue routing_key=appointment.ticket
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare binding source=vidasalud.direct.exchange destination=vidasalud.audit.queue routing_key=appointment.audit

echo "Declarando Binding Topic Exchange..."
docker exec rabbit1 rabbitmqadmin -u admin -p admin123 declare binding source=vidasalud.topic.exchange destination=vidasalud.audit.queue routing_key="appointment.*"

echo "Topología configurada con éxito en RabbitMQ!"

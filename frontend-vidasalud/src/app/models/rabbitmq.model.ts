export interface QueueSummary {
  name: string;
  durable: boolean;
  exclusive: boolean;
  autoDelete: boolean;
  messageCount: number;
  consumerCount: number;
  dlq: boolean;
}

export interface ExchangeSummary {
  name: string;
  type: string;
  durable: boolean;
  autoDelete: boolean;
}

export interface BindingSummary {
  queueName: string;
  exchangeName: string;
  routingKey: string;
}

export interface CreateQueuePayload {
  name: string;
  durable: boolean;
  exclusive: boolean;
  autoDelete: boolean;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
}

export interface CreateExchangePayload {
  name: string;
  type: string;
  durable: boolean;
  autoDelete: boolean;
}

export interface CreateBindingPayload {
  queueName: string;
  exchangeName: string;
  routingKey: string;
}

export interface PublishTestPayload {
  exchange: string;
  routingKey: string;
  message?: string;
  appointmentId?: number;
  patientRut?: string;
  simulateError: boolean;
}

export interface ProcessedMessageLog {
  id: string;
  queue: string;
  appointmentId: number;
  patientRut: string;
  status: string;
  action: string;
  details: string;
  deliveryTag: number;
  timestamp: string;
}

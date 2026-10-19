import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RabbitmqService } from './rabbitmq.service';

describe('RabbitmqService', () => {
  let service: RabbitmqService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RabbitmqService
      ]
    });
    service = TestBed.inject(RabbitmqService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe instanciarse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener la lista de colas (getQueues)', () => {
    const mockQueues = [
      { name: 'vidasalud.notifications.queue', durable: true, exclusive: false, autoDelete: false, messageCount: 0, consumerCount: 1, dlq: false }
    ];

    service.getQueues().subscribe(queues => {
      expect(queues.length).toBe(1);
      expect(queues[0].name).toBe('vidasalud.notifications.queue');
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/api/admin/queues'));
    expect(req.request.method).toBe('GET');
    req.flush(mockQueues);
  });

  it('debe publicar mensaje de prueba para verificación DLQ (publishTestMessage)', () => {
    const payload = {
      exchange: 'vidasalud.direct.exchange',
      routingKey: 'appointment.notification',
      patientRut: '12345678-9',
      serviceId: 101,
      eventType: 'APPOINTMENT_SCHEDULED',
      simulateError: true
    };

    service.publishTestMessage(payload).subscribe(res => {
      expect(res.status).toBe('PUBLISHED');
      expect(res.simulateError).toBe(true);
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/api/admin/messages/publish'));
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'PUBLISHED', simulateError: true });
  });
});

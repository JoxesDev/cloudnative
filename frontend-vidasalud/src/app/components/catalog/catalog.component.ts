import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="catalog-page">
      <div class="catalog-header">
        <div>
          <span class="badge-protected">Ruta Protegida (Admin / Recepcionista)</span>
          <h1 class="title">Catálogo de Servicios y Boxes Clínicos</h1>
          <p class="desc">Este módulo requiere roles con privilegios administrativos o de recepción.</p>
        </div>
      </div>

      <div class="grid-sections">
        <div class="catalog-card">
          <h2 class="card-title">Servicios Médicos Disponibles</h2>
          <div class="item-list">
            <div class="item-row" *ngFor="let s of services">
              <div class="item-info">
                <span class="item-code">ID {{ s.id }}</span>
                <span class="item-name">{{ s.name }}</span>
              </div>
              <span class="item-price">\${{ s.price | number }}</span>
            </div>
          </div>
        </div>

        <div class="catalog-card">
          <h2 class="card-title">Boxes de Atención Clínica</h2>
          <div class="item-list">
            <div class="item-row" *ngFor="let b of boxes">
              <div class="item-info">
                <span class="item-code">ID {{ b.id }}</span>
                <span class="item-name">{{ b.code }}</span>
              </div>
              <span class="item-badge">Piso {{ b.floor }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .badge-protected {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }
    .title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .desc {
      color: #64748b;
      margin-top: 0.25rem;
      font-size: 0.95rem;
    }
    .grid-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .catalog-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1rem 0;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }
    .item-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .item-code {
      font-family: monospace;
      font-size: 0.8rem;
      color: #64748b;
      background: #e2e8f0;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .item-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #1e293b;
    }
    .item-price {
      font-weight: 700;
      color: #0284c7;
      font-size: 0.95rem;
    }
    .item-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
  `]
})
export class CatalogComponent {
  services = [
    { id: 101, name: 'Medicina General', price: 25000 },
    { id: 102, name: 'Cardiología', price: 45000 },
    { id: 103, name: 'Pediatría', price: 35000 },
    { id: 104, name: 'Kinesiología', price: 30000 }
  ];

  boxes = [
    { id: 1, code: 'BOX-101 (Consulta Adulto)', floor: 1 },
    { id: 2, code: 'BOX-102 (Procedimientos)', floor: 1 },
    { id: 3, code: 'BOX-201 (Pediatría)', floor: 2 }
  ];
}

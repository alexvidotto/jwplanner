import { Injectable, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockPrismaService implements OnModuleInit {
  async onModuleInit() {
    console.log('MockPrismaService initialized (In-Memory DB)');
    this.seed();
  }

  // In-memory stores
  public participante = {
    findMany: async (args: any) => {
      // Basic filtering support for the suggestion algo
      let results = [...this.store.participante];

      // Filter by habilidades/parteTemplateId if present
      const skillFilter = args?.where?.habilidades?.some?.parteTemplateId;
      if (skillFilter) {
        results = results.filter(p =>
          p.habilidades.some((h: any) => h.parteTemplateId === skillFilter)
        );
      }

      // Filter by podeDesignar
      if (args?.where?.podeDesignar === true) {
        results = results.filter(p => p.podeDesignar);
      }

      return results;
    },
    findUnique: async (args: any) => this.store.participante.find(p => p.id === args.where.id),
    create: async (args: any) => {
      const newItem = { id: uuidv4(), ...args.data, habilidades: [], designacoes: [], indisponibilidades: [] };
      this.store.participante.push(newItem);
      return newItem;
    },
    // Add other methods as needed
  };

  public semana = {
    findMany: async () => this.store.semana,
    findUnique: async (args: any) => this.store.semana.find(s => s.id === args.where.id),
    create: async (args: any) => {
      const newItem = { id: uuidv4(), ...args.data, designacoes: [] };
      this.store.semana.push(newItem);
      return newItem;
    }
  };

  public parteTemplate = {
    findMany: async () => this.store.parteTemplate,
    create: async (args: any) => {
      const newItem = { id: uuidv4(), ...args.data };
      this.store.parteTemplate.push(newItem);
      return newItem;
    }
  };

  public habilidade = {
    create: async (args: any) => {
      const newItem = { id: uuidv4(), ...args.data };
      this.store.habilidade.push(newItem);
      // Link to participante
      const p = this.store.participante.find(p => p.id === newItem.participanteId);
      if (p) p.habilidades.push(newItem);
      return newItem;
    }
  };

  public designacao = {
    create: async (args: any) => {
      const newItem = { id: uuidv4(), ...args.data };
      this.store.designacao.push(newItem);
      // Link to participante (titular)
      if (newItem.titularId) {
        const p = this.store.participante.find(p => p.id === newItem.titularId);
        if (p) {
          if (!p.designacoes) p.designacoes = [];
          p.designacoes.push(newItem);
        }
      }
      return newItem;
    }
  };

  // The simplified store
  private store: any = {
    participante: [],
    semana: [],
    parteTemplate: [],
    habilidade: [],
    designacao: [],
    indisponibilidade: []
  };

  private seed() {
    // Seed some initial data for testing
    const part1 = { id: 'temp-1', titulo: 'Leitura da Bíblia', secao: 'Tesouros', requerAjudante: false };
    this.store.parteTemplate.push(part1);

    const user1 = {
      id: 'user-1',
      nome: 'João Silva',
      email: 'joao@test.com',
      privilegio: 'PUB_HOMEM',
      podeDesignar: true,
      habilidades: [{ parteTemplateId: 'temp-1' }],
      designacoes: [],
      indisponibilidades: []
    };
    this.store.participante.push(user1);
  }
}

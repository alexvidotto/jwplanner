import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { MockPrismaService } from './mock-prisma.service';

const prismaProvider = {
  provide: PrismaService,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const useMock = config.get('USE_MOCK_DB');
    console.log('USE_MOCK_DB value:', useMock);
    return useMock === 'true'
      ? new MockPrismaService()
      : new PrismaService();
  }
};

@Global()
@Module({
  providers: [prismaProvider],
  exports: [PrismaService],
})
export class PrismaModule { }

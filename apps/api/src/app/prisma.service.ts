import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma';

// Declaration merging: PrismaService has all PrismaClient properties via Proxy
export interface PrismaService extends PrismaClient {}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly client: PrismaClient;

  constructor() {
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Prisma 6.x: Direct client without adapter
    this.client = new PrismaClient();

    // Proxy pattern: delegate all calls to this.client
    return new Proxy(this, {
      get: (target, prop) => {
        // If the property exists on PrismaService, return it
        if (prop in target) {
          return target[prop as keyof PrismaService];
        }
        // Otherwise, delegate to the Prisma client
        return (target.client as any)[prop];
      },
    }) as PrismaService;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
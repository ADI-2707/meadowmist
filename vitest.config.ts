import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'shared',
          include: [
            'packages/shared/src/**/*.test.ts',
            'packages/database/**/*.test.ts',
          ],
          environment: 'node',
          globals: true,
        },
        resolve: {
          alias: {
            '@meadowmist/shared': path.resolve(__dirname, 'packages/shared/src'),
            '@meadowmist/database': path.resolve(__dirname, 'packages/database/src'),
          },
        },
      },
      {
        test: {
          name: 'shared-ui',
          include: [
            'packages/shared/src/**/*.test.tsx',
          ],
          environment: 'jsdom',
          globals: true,
        },
        resolve: {
          alias: {
            '@meadowmist/shared': path.resolve(__dirname, 'packages/shared/src'),
          },
        },
      },
      {
        test: {
          name: 'storefront',
          include: [
            'apps/storefront/src/**/*.test.ts',
            'apps/storefront/src/**/*.test.tsx',
          ],
          environment: 'jsdom',
          globals: true,
        },
        resolve: {
          alias: {
            '@meadowmist/shared': path.resolve(__dirname, 'packages/shared/src'),
            '@meadowmist/database': path.resolve(__dirname, 'packages/database/src'),
            '@': path.resolve(__dirname, 'apps/storefront/src'),
          },
        },
      },
      {
        test: {
          name: 'seller',
          include: [
            'apps/seller/src/**/*.test.ts',
            'apps/seller/src/**/*.test.tsx',
          ],
          environment: 'jsdom',
          globals: true,
        },
        resolve: {
          alias: {
            '@meadowmist/shared': path.resolve(__dirname, 'packages/shared/src'),
            '@meadowmist/database': path.resolve(__dirname, 'packages/database/src'),
            '@': path.resolve(__dirname, 'apps/seller/src'),
          },
        },
      },
    ],
  },
});

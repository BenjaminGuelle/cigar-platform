import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: 'http://localhost:3000/api-json',
    },
    output: {
      target: 'shared/types/src/lib/generated-api.ts',
      client: 'angular',
      mode: 'tags-split',
      override: {
        mutator: {
          path: 'apps/web/src/app/core/api/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});


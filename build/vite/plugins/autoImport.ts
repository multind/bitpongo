/**
 * @name ConfigAutoImportPlugin
 * @description 按需加载，自动引入
 */

import AutoImport from 'unplugin-auto-import/vite';
import { VarletImportResolver } from '@varlet/import-resolver';
import { VantResolver } from '@vant/auto-import-resolver';

export const ConfigAutoImportPlugin = () => {
  return AutoImport({
    dts: 'types/auto-imports.d.ts',
    imports: [
      'vue',
      'pinia',
      'vue-router',
      {
        '@vueuse/core': [],
      },
    ],
    eslintrc: {
      enabled: true,
    },
    resolvers: [VarletImportResolver({ autoImport: true }), VantResolver()],
  });
};

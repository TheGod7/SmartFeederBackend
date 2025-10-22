// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Define el path a tu tsconfig.json. Asumiendo que está en la raíz.
const projectTsConfig = './tsconfig.json';

export default tseslint.config(
  {
    // Bloque de configuración base
    files: ['**/*.ts'], // Asegura que solo se aplique a archivos TS
    ignores: ['eslint.config.mjs', 'dist', 'node_modules'],
  },
  eslint.configs.recommended,
  // 1. Usa la configuración Type-Checked
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    // Opciones del lenguaje y parser
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module', // Usar 'module' en lugar de 'commonjs' es más común en NestJS moderno
      parserOptions: {
        // 🎯 CORRECCIÓN: Usar 'project' en lugar de 'projectService: true' para type-checking
        project: [projectTsConfig],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Reglas personalizadas
    rules: {
      // 2. Deshabilitar reglas problemáticas que causan falsos positivos con decoradores y Mongoose

      // ✅ Solución para los errores 'unsafe-call', 'unsafe-member-access', 'unsafe-assignment'
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // Mantenemos otras reglas ajustadas:
      '@typescript-eslint/no-explicit-any': 'off', // Permitir any para casos controlados
      '@typescript-eslint/no-floating-promises': 'warn', // Advertir sobre promesas sin await/catch
      '@typescript-eslint/no-unsafe-argument': 'off', // Ya lo tenías en 'off', lo respetamos

      // Configuración de Prettier
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // 3. Reglas TS adicionales para NestJS
      '@typescript-eslint/no-unused-vars': [
        // Ignorar variables que solo son usadas en decoradores
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
);

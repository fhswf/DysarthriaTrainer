import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  // Enhanced global ignores for modern Vue development
  {
    name: 'app/global-ignores',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/build/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.vite/**',
      '**/components.d.ts',
      '**/auto-imports.d.ts',
    ],
  },

  // Vue and TypeScript base configurations
  vueTsConfigs.recommended,

  // Vue essential rules (manually configured to avoid type conflicts)
  {
    name: 'app/vue-essential',
    files: ['**/*.vue'],
    languageOptions: {
      parser: pluginVue.configs['flat/essential'][0].languageOptions?.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      vue: pluginVue,
    },
    processor: 'vue/vue',
    rules: {
      ...pluginVue.configs['flat/essential'][0].rules,
    },
  },

  // Enhanced Vue 3 Composition API rules
  {
    name: 'app/vue-composition-api',
    files: ['**/*.vue'],
    rules: {
      // Enforce Composition API with <script setup>
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],

      // Vue 3 reactivity best practices
      'vue/no-setup-props-reactivity-loss': 'error',
      'vue/no-ref-object-reactivity-loss': 'error',
      'vue/prefer-import-from-vue': 'error',

      // Template best practices
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false,
          ignores: [
            'router-link',
            'router-view',
            'component',
            'teleport',
            'transition',
            'transition-group',
          ],
        },
      ],
      'vue/custom-event-name-casing': ['error', 'kebab-case'],
      'vue/html-button-has-type': 'error',
      'vue/v-for-delimiter-style': ['error', 'in'],

      // Code quality
      'vue/no-useless-mustaches': 'warn',
      'vue/no-useless-v-bind': 'warn',
      'vue/padding-line-between-blocks': 'error',
      'vue/prefer-true-attribute-shorthand': 'warn',

      // TypeScript in Vue files
      'vue/block-lang': [
        'error',
        {
          script: { lang: 'ts' },
        },
      ],
    },
  },

  // Enhanced TypeScript rules for Vue 3 ecosystem
  {
    name: 'app/typescript-enhanced',
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      // Unused variables (common in Vue development)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Type safety
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // Async patterns (important for API calls and composables)
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',

      // Turn off rules that conflict with Vue patterns
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Project architecture rules
  {
    name: 'app/project-architecture',
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // Import patterns
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Use @/ imports instead of relative imports for better maintainability',
            },
          ],
        },
      ],

      // Modern JavaScript/TypeScript
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Development vs Production
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
  },

  // Composables (Vue 3 patterns)
  {
    name: 'app/composables',
    files: ['src/composables/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // Pinia stores
  {
    name: 'app/stores',
    files: ['src/stores/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // Service layer (API calls, business logic)
  {
    name: 'app/services',
    files: ['src/services/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'require-await': 'error',
    },
  },

  // Vitest unit tests
  {
    name: 'app/vitest',
    files: [
      'src/**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    plugins: {
      vitest: pluginVitest,
    },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      'vitest/expect-expect': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/no-focused-tests': 'error',
    },
  },

  // Playwright e2e tests
  {
    name: 'app/playwright',
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    plugins: {
      playwright: pluginPlaywright,
    },
    rules: {
      'playwright/expect-expect': 'error',
      'playwright/no-focused-test': 'error',
    },
  },

  // Disable formatting rules to avoid conflicts with Prettier
  {
    name: 'app/skip-formatting',
    rules: {
      // Prettier handles these formatting concerns
      'prettier/prettier': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/quotes': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/comma-spacing': 'off',
      '@typescript-eslint/func-call-spacing': 'off',
      '@typescript-eslint/keyword-spacing': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/no-extra-parens': 'off',
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/object-curly-spacing': 'off',
      '@typescript-eslint/space-before-blocks': 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/space-infix-ops': 'off',
      '@typescript-eslint/type-annotation-spacing': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/html-indent': 'off',
      'vue/html-quotes': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/mustache-interpolation-spacing': 'off',
      'vue/no-multi-spaces': 'off',
      'vue/no-spaces-around-equal-signs-in-attribute': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  }
)

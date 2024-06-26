module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
	  ecmaFeatures: {
      jsx: true,
	  },
	  ecmaVersion: 2020,
	  sourceType: 'module',
	  project: './tsconfig.eslint.json',
  },
  settings: {
	  react: {
      version: 'detect',
	  },
	  'import/resolver': {
      node: {
		  extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
	  },
  },
  extends: [
	  'plugin:react/recommended',
	  'plugin:@typescript-eslint/recommended',
	  'plugin:import/typescript',
	  'prettier',
  ],
  plugins: [
	  'react',
	  'react-hooks',
	  '@typescript-eslint',
	  'simple-import-sort',
	  'import',
  ],
  rules: {
	  semi: ['error', 'never'],
	  indent: [2, 2, { MemberExpression: 0 }],
	  complexity: ['error', { max: 20 }],
	  curly: 'error',
	  quotes: ['error', 'single'],
	  'no-magic-numbers': 'off',
	  'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      {
		  blankLine: 'any',
		  prev: ['const', 'let', 'var'],
		  next: ['const', 'let', 'var'],
      },
	  ],
	  'array-bracket-spacing': ['error', 'never'],
	  'array-callback-return': 'error',
	  'max-statements': ['error', 50],
	  'max-len': ['error', { code: 120 }],
	  'max-lines-per-function': ['error', 1000],
	  'max-params': ['error', 15],
	  'newline-after-var': 'error',
	  'newline-before-return': 'error',
	  'prefer-arrow-callback': 'error',
	  'no-shadow': 'off',
	  'quote-props': ['error', 'as-needed'],
	  'space-in-parens': ['error', 'never'],
	  'prefer-const': 'error',
	  'callback-return': 'error',
	  'no-empty-function': 'error',
	  'space-infix-ops': 'error',
	  'object-curly-spacing': ['error', 'always'],
	  'simple-import-sort/imports': 'error',
	  'simple-import-sort/exports': 'error',
	  'import/first': 'error',
	  'import/newline-after-import': 'error',
	  'import/no-duplicates': 'error',
	  'keyword-spacing': ['error', { before: true, after: true }],
	  'space-before-blocks': 'error',
	  'comma-spacing': ['error', { before: false, after: true }],
	  'brace-style': 'error',
	  'no-multi-spaces': 'error',
	  'react/react-in-jsx-scope': 'off',
	  'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
	  {
      files: ['**/*.js', '**/*.ts', '**/*.tsx'],
      rules: {
		  'react/prop-types': 'off',
		  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
		  'simple-import-sort/imports': [
          'error',
          {
			  groups: [
              ['^react$', '^next', '^[a-z]'],
              ['^@'],
              ['^@/'],
              ['^~'],
              ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
              ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
              ['^.+\\.s?css$'],
              ['^\\u0000'],
			  ],
          },
		  ],
      },
	  },
	  {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      rules: { 'no-magic-numbers': 'off' },
	  },
	  {
      files: ['**/jest.config.js', '**/tailwind.config.js', '**/*.config.js'],
      rules: { '@typescript-eslint/no-var-requires': 'off' },
	  },
  ],
}

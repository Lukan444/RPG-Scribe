/**
 * Babel configuration for Jest and ESM modules
 * 
 * This configuration is specifically designed to handle ESM modules in Jest tests.
 * It's separate from any Babel configuration used by the build system.
 */

module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'commonjs' // Convert ESM to CommonJS for Jest
    }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    // Add any plugins needed for ESM modules
  ]
};

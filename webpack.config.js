const path = require('path');

module.exports = {
  entry: {
    bundle: './src/index.ts',
  },

  externals: {
    // Third party dependencies.
    lodash: 'lodash',
    react: ['vendor', 'React'],
    'react-dom': ['vendor', 'ReactDOM'],

    // WordPress dependencies.
    // Note: @wordpress/i18n and @wordpress/api-fetch are deliberately NOT
    // externalized here — see src/translate.ts and use-cpt-preview-pins.ts
    // for why we dropped both in favor of self-contained PHP-localized
    // data + plain fetch().
    '@wordpress/hooks': ['vendor', 'wp', 'hooks'],

    // Divi dependencies (provided by Divi Visual Builder).
    '@divi/icon-library': ['divi', 'iconLibrary'],
    '@divi/module-library': ['divi', 'moduleLibrary'],
    '@divi/module': ['divi', 'module'],
    '@divi/module-utils': ['divi', 'moduleUtils'],
    '@divi/types': ['divi', 'types'],
  },

  module: {
    rules: [
      // Handle `.tsx` and `.ts` files.
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.tsx', '.ts', '.json'],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'scripts'),
  },
  
  stats: {
    errorDetails: true,
  },
};

console.log("craco.config.js: File loaded."); // Log at the very top

const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      console.log("craco.config.js: webpack.configure function called."); // Log inside configure

      if (env === 'development') {
        // Replace deprecated webpack-dev-server options
        webpackConfig.devServer = {
          ...webpackConfig.devServer,
          setupMiddlewares: (middlewares, devServer) => {
            // This replaces both onBeforeSetupMiddleware and onAfterSetupMiddleware
            if (!devServer) {
              throw new Error('webpack-dev-server is not defined');
            }
            // Add any custom middleware here if needed
            return middlewares;
          },
        };
      }

      // Remove ESLint plugin to avoid issues
      const esLintPluginIndex = webpackConfig.plugins.findIndex(
        plugin => plugin.constructor.name === 'ESLintWebpackPlugin' || (plugin.constructor.name && plugin.constructor.name.includes('ESLint'))
      );

      if (esLintPluginIndex !== -1) {
        console.log(`Removing plugin at index ${esLintPluginIndex}: ${webpackConfig.plugins[esLintPluginIndex].constructor.name}`);
        webpackConfig.plugins.splice(esLintPluginIndex, 1);
      } else {
        console.log("ESLintWebpackPlugin not found by constructor name 'ESLintWebpackPlugin' or by inclusion of 'ESLint'.");
      }
      
      // Optimize chunk splitting for Mantine
      // webpackConfig.optimization = {
      //   ...webpackConfig.optimization,
      //   splitChunks: {
      //     chunks: 'all',
      //     name: false,
      //     cacheGroups: {
      //       vendor: {
      //         test: /[\\/]node_modules[\\/]/,
      //         name(module) {
      //           const match = module.context && module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
      //           if (!match || !match[1]) {
      //             // Fallback for modules not matching the expected node_modules pattern
      //             return 'vendor-misc';
      //           }
      //           const packageName = match[1];
      //
      //           // Mantine packages should be in their own chunk
      //           if (packageName.includes('@mantine')) {
      //             return `mantine-vendor`;
      //           }
      //
      //           // npm package names are URL-safe, but some servers don't like @ symbols
      //           return `vendor-${packageName.replace('@', '')}`;
      //         },
      //         priority: 20,
      //       },
      //       default: {
      //         minChunks: 2,
      //         priority: 10,
      //         reuseExistingChunk: true,
      //       },
      //     },
      //   },
      // };

      return webpackConfig;
    },
  },
  eslint: {
    enable: false, // Disable ESLint completely
  },
  style: {
    postcss: {
      loaderOptions: {
        implementation: require('postcss'),
      },
    },
  },
};
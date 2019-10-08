var path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
    mode: 'development',
    entry: {
        index: './website/src/index.js'
    },
    name: "website",
    output: {
        path: path.resolve(__dirname, 'website/dist'),
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                "targets": {
                                    "node": "10"
                                }
                            }
                        ]
                    ],
                    plugins: ["@babel/plugin-syntax-dynamic-import"]
                }
            }
        ]
    },
    resolve: {
        mainFields: ['browser', 'main']
    },
    stats: {
        colors: true
    },
    devtool: 'source-map',
    devServer: {
        contentBase: './website/dist'
    },
    optimization: {
        splitChunks: {
            name: (module, chunks) => {
              return chunks[0].name;
            }
        },
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
            }),
        ]
    },
    plugins: [
      new CopyPlugin([
        { from: './website/static', to: './' }
      ])
    ]
},
{
  mode: 'development',
  entry: {
      content: './crx/src/content.js',
      background: './crx/src/background.js',
      popup: './crx/src/popup.js'
  },
  output: {
      path: path.resolve(__dirname, 'crx/dist'),
      filename: '[name].bundle.js'
  },
  name: "crx",
  module: {
      rules: [
          {
              test: /\.js$/,
              loader: 'babel-loader',
              options: {
                  presets: [
                      [
                          "@babel/preset-env",
                          {
                              "targets": {
                                  "node": "10"
                              }
                          }
                      ]
                  ]
              }
          }
      ]
  },
  resolve: {
      mainFields: ['browser', 'main']
  },
  stats: {
      colors: true
  },
  devtool: 'source-map',
  devServer: {
      contentBase: './crx/dist',
      compress: true
  },
  plugins: [
    new CopyPlugin([
      { from: './crx/static', to: './' }
    ]),
  ]
}];
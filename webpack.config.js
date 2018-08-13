const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const externals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  mode: 'development',
  plugins: [
    new MonacoWebpackPlugin({
      languages: [
        'markdown',
        'css',
        'scss',
      ]
    })
  ],
  entry: {
    bundle: './src/index.tsx'
  },
  output: {
    path: path.resolve(__dirname, './lib'),
    publicPath: '../lib/',
    filename: '[name].js'
  },
  target: 'electron-renderer',
  externals: [
    externals({
      whitelist: ['react-monaco-editor', 'monaco-editor']
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};

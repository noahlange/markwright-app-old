const externals = require('webpack-node-externals');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
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
    editor: './src/entry/editor.tsx',
    preview: './src/entry/preview.tsx',
    highlight: './src/entry/highlight.ts'
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
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json']
  }
};

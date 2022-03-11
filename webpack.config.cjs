const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || '8080';

const env = process.env.NODE_ENV || 'development';

module.exports = {
  mode: env,
  entry: {
    index: path.resolve(__dirname, "src/index.js")
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "html-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
      // {
      //   test: /\.js$/i,
      //   exclude: /node_modules/,
      //   use: ["babel-loader"]
      // }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/index.html"),
      chunks: ['index'],
      filename: 'index.html'
    })
  ],
  devtool: 'inline-source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    hot: true,
    host: host,
    port: port
  }
};

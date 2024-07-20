import {CleanWebpackPlugin} from 'clean-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import webpack from 'webpack'
import WebpackBar from 'webpackbar'
import {getReactAppEnvironment} from './config/environment'
import indexMetadata from './config/indexMetadata.json'
import {calculateLocaleCompletion} from './config/locale'

import './config/loadDotenv'

/* eslint-disable @typescript-eslint/no-magic-numbers */

interface Environment {
	[key: string]: unknown
}

interface Arguments {
	mode?: 'production' | 'development'
	[key: string]: unknown
}

export default (env: Environment, {
	mode = 'development',
}: Arguments): webpack.Configuration => ({
	mode,
	entry: {index: './src/index'},
	output: {
		path: path.resolve(__dirname, 'build'),
		publicPath: '/',
		filename: mode === 'development'
			? 'assets/[name].js'
			: 'assets/[name].[contenthash:8].js',
	},
	target: 'browserslist',

	devtool: mode === 'development'
		? 'eval-cheap-module-source-map'
		: 'source-map',
	devServer: {
		host: 'localhost',
		port: 3000,
		historyApiFallback: true,
		liveReload: false,
		// `hot: true` implied by --hot cli arg
		proxy: {
			'/fflogs-events': {
				target: 'http://localhost:3001',
				changeOrigin: true,
			  }
		}
	},

	stats: 'errors-warnings',

	resolve: {
		extensions: [
			'.ts',
			'.tsx',
			'.js',
			'.jsx',
			'.json',
		],
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
	},

	optimization: {
		minimize: mode !== 'development',
		splitChunks: {
			chunks: 'all',
			maxInitialRequests: mode === 'development'
				? Infinity
				: 5,
		},
		runtimeChunk: 'single',
	},

	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
				PUBLIC_URL: JSON.stringify(''),
				LOCALE_COMPLETION: calculateLocaleCompletion(),
				...getReactAppEnvironment(),
			},
		}),

		new HtmlWebpackPlugin({
			// Cribbed template from neutrino
			template: './config/template.ejs',
			appMountId: 'root',
			filename: 'index.html',
			chunks: ['index'],
			// Doesn't even know what it supports smh
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			...(indexMetadata as any),
		}),
		new CopyWebpackPlugin({
			patterns: ['public'],
		}),
		mode !== 'development' && new MiniCssExtractPlugin({
			filename: 'assets/[name].[contenthash:8].css',
		}),
		new CleanWebpackPlugin(),

		new webpack.WatchIgnorePlugin({paths: [/module\.css\.d\.ts$/]}),

		new WebpackBar({}),
	].filter(Boolean),

	module: {
		rules: [
			// JS/TS (via babel)
			{
				test: /\.[tj]sx?$/,
				include: [
					path.resolve(__dirname, 'src'),
				],
				use: [
					{
						loader: 'babel-loader',
						options: {
							cacheDirectory: true,
							envName: mode,
						},
					},
				],
			},
			// CSS
			{
				test: /\.css$/,
				use: [
					mode !== 'development'
						? {loader: MiniCssExtractPlugin.loader, options: {esModule: true}}
						: {loader: 'style-loader'},
					{
						loader: '@teamsupercell/typings-for-css-modules-loader',
						options: {
							banner: '// This file is automatically generated. Do not edit.\n/* eslint-disable */',
							eol: '\n',
							disableLocalsExport: true,
							verifyOnly: mode !== 'development',
						},
					},
					{
						loader: 'css-loader',
						options: {
							importLoaders: 1,
							modules: {
								auto: true,
								// TODO: Switch this to `[hash:base64]` in prod?
								localIdentName: '[name]_[local]__[md5:hash:base64:5]',
								// TODO: camelCaseOnly?
								exportLocalsConvention: 'camelCase',
							},
						},
					},
					{loader: 'postcss-loader'},
				],
			},
			// Lingui message files
			{
				test: /locale.+\.json$/,
				type: 'javascript/auto',
				use: [
					{loader: '@lingui/loader'},
				],
			},
			// Fonts
			{
				test: /\.(eot|ttf|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: 'assets/[name].[hash:8].[ext]',
						},
					},
				],
			},
			// Images
			{
				test: /\.(ico|png|jpg|jpeg|gif|svg|webp)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 8192,
							name: 'assets/[name].[hash:8].[ext]',
							esModule: false,
						},
					},
				],
			},
		],
	},
})

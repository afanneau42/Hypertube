const path = require('path'),
	webpack = require('webpack'),
	ExtractTextPlugin = require('extract-text-webpack-plugin'),
	UglifyJSPlugin = require('uglifyjs-webpack-plugin');

let cssLoaders = [ 'style-loader', { loader: 'css-loader', options: { importLoaders: 1, minimize: true } } ];

cssLoaders.push({
	loader: 'postcss-loader',
	options: {
		plugins: (loader) => [
			require('autoprefixer')({
				browsers: [ 'chrome >= 46', 'firefox >= 41' ]
			})
		]
	}
});

let config = {
	entry: [ './src/client.js', './public/style.css', './public/scss/main.scss' ],
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'public')
	},
	resolve: {
		modules: [ path.resolve(__dirname, 'src'), 'node_modules' ]
	},
	devtool: false,
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: [ 'babel-loader' ]
			},
			{
				test: /\.css$/,
				use: [ 'style-loader', { loader: 'css-loader', options: { importLoaders: 1 } }, 'postcss-loader' ]
			},
			{
				test: /\.scss$/,
				use: [
					'style-loader',
					{
						loader: 'css-loader',
						options: { importLoaders: 2 }
					},
					'sass-loader',
					'postcss-loader'
				]
			}
		]
	},
	plugins: [
		new ExtractTextPlugin({
			filename: '[name].css',
			disable: false
		})
	]
};

config.plugins.push(
	new UglifyJSPlugin({
		sourceMap: false
	}),
	new webpack.DefinePlugin({
		'process.env': {
			NODE_ENV: JSON.stringify('production')
		}
	}),
	new webpack.optimize.UglifyJsPlugin()
);

module.exports = config;

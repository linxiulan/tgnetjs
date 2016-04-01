var webpack = require("webpack");
module.exports = {
    module: {
        loaders: [
            { test: /\.html$/, loader: 'html-loader' },
            { test: /\.css$/, loader: 'style-loader!css-loader' }
        ]
    },
    resolve: {
        extensions: ['', '.js'],
        alias: {
            'plugins': __dirname + '/plugins',
            'lib': __dirname + '/../lib'
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            DEBUG: false
        })
    ]
};
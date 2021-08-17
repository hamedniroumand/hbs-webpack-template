const path = require("path");
const webpack = require("webpack");
const glob = require("glob");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const {ESBuildMinifyPlugin} = require("esbuild-loader");
const PurgecssPlugin = require("purgecss-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MinifyPlugin = require("babel-minify-webpack-plugin");


const config = {
    devtool: "source-map",
    entry: {
        app: "./src/resources/js/app.js",
        home: "./src/resources/js/home-page.js",
        styles: "./src/resources/scss/main.scss",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src", "resources", "js"),
            "~": path.resolve(__dirname, "src"),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: "/node_modules/",
                use: [
                    {
                        loader: "babel-loader",
                        options: {presets: ["@babel/preset-env"]},
                    },
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            publicPath: "images",
                            outputPath: "images",
                            name: "[name].[ext]",
                            esModule: false,
                            useRelativePaths: true,
                        },
                    },
                ],
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-url-loader',
                        options: {
                            encoding: "base64",
                            iesafe: true,
                        },
                    }
                ]

            },
            {
                test: /\.(woff|ttf|eot|otf|woff2)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            publicPath: "fonts",
                            outputPath: "fonts",
                            name: "[name].[ext]",
                            esModule: false,
                        },
                    },
                ],
            },
            {
                test: /\.hbs$/,
                use: [
                    {
                        loader: "handlebars-loader",
                        options: {
                            partialDirs: [
                                __dirname + "/src/view/components",
                            ]
                        }
                    },
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "src", "public", "images"),
                    to: path.resolve(__dirname, "dist", "images"),
                },
            ],
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "view", "pages", "index.hbs"),
            filename: "index.html",
            chunks: ["styles", "app", "home", "vendors~app~home"],
            favicon: "./src/public/images/favicon.png",
            title: 'Adlyweb'
        }),
    ],
};


module.exports = (env, {mode}) => {
    let isDevelopment = mode === "development";

    if (isDevelopment) {
        config.output.filename = "[name].bundle.js";
        config.devServer = {
            contentBase: path.resolve(__dirname, "dist"),
            index: "index.html",
            port: 8888,
        };
    } else {
        config.output.filename = "[name].bundle.[contenthash].js";
        config.plugins.push(
            new MiniCssExtractPlugin({
                filename: "[name].bundle.[contenthash].css",
            }),
            new PurgecssPlugin({
                paths: glob.sync(`${path.join(__dirname, "src")}/**/*.hbs`, {
                    nodir: true,
                }),
                safelist: () => ({
                    standard: [],
                    deep: [],
                    greedy: [],
                }),
            }),
            new MinifyPlugin(),
        );
        config.optimization = {
            splitChunks: {
                chunks: "all",
            },
            minimize: process.env.NODE_ENV === "production",
            minimizer: [
                new ESBuildMinifyPlugin({
                    css: true,
                }),
            ],
        }
    }

    config.module.rules.push(
        ...[
            {
                test: /\.css$/,
                use: [
                    isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
                    "css-loader",
                    "postcss-loader"
                ],
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
                    "css-loader",
                    "resolve-url-loader",
                    "postcss-loader",
                    "sass-loader",
                ],
            },
        ]
    );

    return config;
};
require('./check-versions')();

const project_name = 'dss';

process.env.NODE_ENV = 'production';

var ora = require('ora');
var rm = require('rimraf');
var path = require('path');
var chalk = require('chalk');
var webpack = require('webpack');
var config = require('../config');
var webpackConfig = require('./webpack.prod.conf');

var fs = require('fs');
var archiver = require('archiver');

var slash = process.platform === 'win32' ? '\\' : '//'

var DistPath = path.join(config.build.assetsRoot, slash);

var HtmlPath = path.join(DistPath, 'index.html');
var StaticPath = path.join(DistPath, 'static');

var JSPath = path.join(StaticPath, slash, 'js', slash);
var CSSPath = path.join(StaticPath, slash, 'css', slash);

var client = require('scp2');

console.log(
	'\n' +
	'  ---------------------\n' +
	'< 开发多测试，上线少BUG >\n' +
	'  ---------------------\n' +
	'        \\   ^__^\n' +
	'         \\  (oo)\\_______\n' +
	'            (__)\\       )\\/\\\n' +
	'                ||---w-||\n' +
	'                ||     ||\n' +
	'\n'
)

var spinner = ora('building for production...');
spinner.start();

rm(path.join(config.build.assetsRoot, '*'), err => {
    if (err) throw err;
    webpack(webpackConfig, function(err, stats) {
        spinner.stop();
        if (err) throw err;
        process.stdout.write(
            stats.toString({ colors: true, modules: false, children: false, chunks: false, chunkModules: false }) + '\n\n'
        );
        task();
        console.log(chalk.cyan('  Build complete.\n'));
        // push();
        // console.log(chalk.yellow('  Tip: built files are meant to be served over an HTTP server.\n' + "  Opening index.html over file:// won't work.\n"));
    });
});

// push();

function push() {
    client.scp(DistPath + '/dss.zip', 'root:zxt123@10.148.16.53:/mnt/project/dss-server-gd/webapps/dss', function(err) {
        console.info(err);
    });
}

function task() {

    findAppFiles(JSPath, joinProjectName);
    findAppFiles(CSSPath, joinProjectName);

    findIndexHtml(HtmlPath, replaceIndexHtml);
    // findIndexHtml(HtmlPath, createIndexJsp);

    zip(DistPath);

    function joinProjectName(data) {
        return data.replace(/\/static/g, '/' + project_name + '/static');
    }

    function replaceIndexHtml(data) {
        data = data.replace(/\/static/g, '/' + project_name + '/static');
        fs.writeFileSync(HtmlPath, data);
    }

    function createIndexJsp(data) {
        var jsp = '<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>\n' +
            '<%\n' +
            '\tString basePath = request.getContextPath();\n' +
            '\tHttpSession s = request.getSession();\n' +
            '\tjava.util.Map user = (java.util.Map)s.getAttribute("user");\n' +
            '\tif(user == null || "".equals(user.get("name"))){\n' +
            '\t\tresponse.sendRedirect("login.jsp");\n' +
            '\t}\n' +
            '%>\n';
        fs.writeFileSync(DistPath + slash + 'index.jsp', jsp + '\n' + data);
    }
}

function findIndexHtml(path, func) {
    var data = fs.readFileSync(path, 'utf-8');
    if (!!func) func(data);
}

function findAppFiles(filePath, func) {
	var files = fs.readdirSync(filePath);
    var name = '';
    for (var file of files) {
        if (file.indexOf('app') !== -1) {
            name = file;
            break;
		}
    }
    var data = fs.readFileSync(filePath + name, 'utf-8');
    if (!!func) {
        data = func(data);
        fs.writeFileSync(filePath + name, data);
    }
}

function zip(path) {
	var output = fs.createWriteStream(path + '/dss.zip');
	var archive = archiver('zip', { zlib: { level: 9 } });
	archive.pipe(output);
	archive.file('dist/index.html', { name: 'index.html' });
	archive.file('dist/index.jsp', { name: 'index.jsp' });
	archive.directory('dist/static/', 'static/');
	archive.finalize();
}

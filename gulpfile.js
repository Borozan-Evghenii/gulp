const {src, dest, parallel, series, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass')); // Compilator Sass
const notify = require('gulp-notify'); //Error-Notify
const sourcemaps = require('gulp-sourcemaps'); //harta de sursă
const rename = require('gulp-rename'); // Redenumire File
const autoprefixer = require('gulp-autoprefixer'); //Autoprefixare
const cleanCSS = require('gulp-clean-css'); //minificare Css
const fileinclude  = require('gulp-file-include'); //Include componente de html în index.html
const SvgSprite  = require('gulp-svg-sprite'); //Crearea automată a spraiturilor
const browserSync = require('browser-sync').create(); // Livereload pentru Browser
const ttf2woff = require('gulp-ttf2woff'); // Convertor fonyuri ttf to woff
const ttf2woff2 = require('gulp-ttf2woff2'); // Convertor fonyuri ttf to woff2
const fs = require('fs'); // Work with File sYstem
const del = require('del'); // Delete fUNCTION
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const tinypng = require('gulp-tinypng-compress');
const util = require('gulp-util');
const ftp = require('vinyl-ftp');
const uglify = require('gulp-uglify-es').default;



const cb = () => {}
let srcFonts = './src/scss/_fonts.scss';
let appFonts = './app/fonts/';



const fonts = () =>{
    src('src/fonts/**.ttf')
    .pipe(ttf2woff())
    .pipe(dest('./app/fonts/'))
    return src('./src/fonts/**.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('./app/fonts/'))

}
const clean = () =>{
    return del('./app/*')
}
const fontsStyle = (done) => {
	let file_content = fs.readFileSync(srcFonts);

	fs.writeFile(srcFonts, '', cb);
	fs.readdir(appFonts, function (err, items) {
		if (items) {
			let c_fontname;
			for (var i = 0; i < items.length; i++) {
				let fontname = items[i].split('.');
				fontname = fontname[0];
				if (c_fontname != fontname) {
					fs.appendFile(srcFonts, '@include font-face("' + fontname + '", "' + fontname + '", 400);\r\n', cb);
				}
				c_fontname = fontname;
			}
		}
	})

	done();
}
const styles = () =>{
    return src('./src/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', notify.onError()))
    .pipe(autoprefixer({
        cascade: false,
    }))
    .pipe(cleanCSS({
        level: 2
    }))
    .pipe(rename({
        suffix:'.min',
    }))
    .pipe(sourcemaps.write())
    .pipe(dest('./app/css/'))
    .pipe(browserSync.stream())
}
const Include = () =>{
    return src(['./src/index.html'])
    .pipe(fileinclude({
        prefix: '@',
        basepath: '@file'
      }))
    .pipe(dest('./app'))
    .pipe(browserSync.stream())
}
const ImageToApp = () =>{
    return src(['./src/img/**.jpg', './src/img/**.png', './src/img/**.jpeg'])
    .pipe(dest('app/img'))
}
const svgSprite = () =>{
    return src('./src/img/**.svg')
    .pipe(SvgSprite({
        mode:{
            stack:{
                sprite: "../sprites.svg"
            }
        }
    }))
    .pipe(dest('./app/img'))
}
const resourceTo = () =>{
    return src('./src/resources/**.*')
    .pipe(dest('./app'))
}
const scripts = () =>{
    return src('./src/js/main.js')
    .pipe(webpackStream({
        output: {
            filename: 'main.js',
        },
        module: {
            rules: [
              {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: [
                      ['@babel/preset-env', { targets: "defaults" }]
                    ]
                  }
                }
              }
            ]
          }
    }))
    .pipe(sourcemaps.init())
    .pipe(uglify().on('error', notify.onError()))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/js'))

}
const watchFile = () =>{
    browserSync.init({
        server: {
            baseDir: "./app"
        }
    });
    watch('./src/scss/**/*.scss', styles);
    watch('./src/index.html', Include);
    watch('./src/img/**.jpg', ImageToApp);
    watch('./src/img/**.png', ImageToApp);
    watch('./src/img/**.jpeg', ImageToApp);
    watch('./src/img/**.svg', svgSprite);
    watch('./src/resources/**.*', resourceTo);
    watch('./src/fonts/**.ttf', fonts);
    watch('./src/fonts/**.ttf', fontsStyle);
    watch('./src/js/**/*.js', scripts);

}



exports.default = series( parallel( Include, fonts, ImageToApp, scripts, svgSprite, resourceTo ),fontsStyle, styles ,watchFile)

const scriptsBuild = () =>{
    return src('./src/js/main.js')
    .pipe(webpackStream({
        output: {
            filename: 'main.js',
        },
        module: {
            rules: [
              {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: [
                      ['@babel/preset-env', { targets: "defaults" }]
                    ]
                  }
                }
              }
            ]
          }
    }))
    .pipe(uglify().on('error', notify.onError()))
    .pipe(dest('./app/js'))

}
const stylesBuild = () =>{
    return src('./src/scss/**/*.scss')
    .pipe(sass().on('error', notify.onError()))
    .pipe(autoprefixer({
        cascade: false,
    }))
    .pipe(cleanCSS({
        level: 2
    }))
    .pipe(rename({
        suffix:'.min',
    }))
    .pipe(dest('./app/css/'))
}
const imageMin = () =>{
    return src('./src/img/**/*.*')
    .pipe(tinypng({
        key: 'yjqkvysBCn95SVxcgv52d8vjqLmS1NPB',
        log: true,
    }))
    .pipe(dest('./app/img'));
}



exports.build = series( clean, parallel( Include, fonts, ImageToApp, scriptsBuild, svgSprite, resourceTo ),fontsStyle, stylesBuild ,imageMin)

// deploy
const deploy = () => {
	let conn = ftp.create({
		host: '', //denumirea siteului
		user: '', // numele user
		password: '', //parola user
		parallel: 10,
		log: util.log
	});

	let globs = [
		'app/**',
	];

	return src(globs, {
			base: './app',
			buffer: false
		})
		.pipe(conn.newer('')) // only upload newer files /www/kangsroo.maxgraph.ru/
		.pipe(conn.dest(''));// /www/kangsroo.maxgraph.ru/
}

exports.deploy = deploy;
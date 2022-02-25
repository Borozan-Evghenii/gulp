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
};

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
    return src('./src/image/**.svg')
    .pipe(SvgSprite({
        mode:{
            stack:{
                sprite: "../sprite.svg"
            }
        }
    }))
    .pipe(dest('./app/img'))
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

};




exports.default = series( Include, styles, ImageToApp, svgSprite, watchFile)
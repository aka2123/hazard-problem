const { src, dest, series, parallel, watch } = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const autoprefixer = require('gulp-autoprefixer')
const cssnano = require('gulp-cssnano')
const kit = require('gulp-kit')
const clean = require('gulp-clean')
const rename = require('gulp-rename')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const webp = require('gulp-webp')
const sourcemaps = require('gulp-sourcemaps')
const browserSync = require('browser-sync').create()
const reload = browserSync.reload
// po wywołaniu taksa Ctrl + C , by pisać w terminalu

const paths = {
	html: './html/**/*.kit',
	sass: './src/sass/**/*.scss',
	cssDest: './dist/css',
	js: './src/js/**/*.js',
	dist: './dist',
	jsDest: './dist/js',
	img: './src/img/**/*',
	imgDest: './dist/img',
}

function sassCompaler(done) {
	src(paths.sass)
		.pipe(sourcemaps.init())	
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(cssnano())
		.pipe(
			rename({
				suffix: '.min',
			})
		)
		.pipe(sourcemaps.write())
		.pipe(dest(paths.cssDest))
	done()
}

function javaScript(done) {
	src(paths.js)
		.pipe(sourcemaps.init())
		.pipe(
			babel({
				presets: ['@babel/env'],
			})
		)
		.pipe(uglify())
		.pipe(
			rename({
				suffix: '.min',
			})
		)
		.pipe(sourcemaps.write())
		.pipe(dest(paths.jsDest))
	done()
}

function compressData(done) {
	src(paths.img)
		.pipe(webp())
		.pipe(
			rename({
				suffix: '.min',
			})
		)
		.pipe(dest(paths.imgDest))
	done()
}

function handleKits(done){
	src(paths.html)
	.pipe(kit())
	.pipe(dest('./'))
		done()
}

function cleanStuff(done){
	src(paths.dist, {read: false})
        .pipe(clean());
		done()
}

function syncBrowser(done) {
	browserSync.init({
		server: {
			baseDir: './',
		},
	})
	done()
}

function watchChanges(done) {
	watch('./*.html').on('change', reload)
	watch([paths.html, paths.sass, paths.js], parallel(handleKits ,sassCompaler, javaScript)).on('change', reload)
	watch(paths.img, compressData).on('change', reload)
	done()
}

const mainFunctions = parallel(handleKits, sassCompaler, javaScript, compressData)
exports.cleanStuff = cleanStuff
// wywołanie: gulp cleanStuff
exports.default = series(mainFunctions, syncBrowser, watchChanges)

const gulp = require('gulp');
const notify = require('gulp-notify');  // エラー通知
const plumber = require('gulp-plumber'); // エラー時のタスク停止防止
const debug = require('gulp-debug'); // ログ表示
//const filter = require('gulp-filter'); // ファイルフィルター

const pug = require('gulp-pug'); // Pug
const htmlbeautify = require('gulp-html-beautify'); // HTML整形

const browserSync = require('browser-sync');// ブラウザ

const autoprefixer = require('autoprefixer');
const babel = require('gulp-babel');
const clean = require('postcss-clean');
const postcss = require('gulp-postcss');
const flexBugsFixes = require('postcss-flexbugs-fixes');
const rename = require('gulp-rename');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');
const del = require('del');

const paths = {
  html: {
    src: './src/pug/',
    dest:  './html/'
  },
  styles: {
    src: './src/scss/**/*.scss',
    dest: './html/assets/css',
    map: './html/assets/css/maps',
  },
  scripts: {
    src: './src/js/**/*.js',
    dest: './html/assets/js',
    map: './html/assets/js/maps',
  },
  server: {
    baseDir: './html/',
    index: 'index.html'
  }
};

// pug
function pugCompile() {
  return gulp.src([paths.html.src + '**/*.pug', '!' + paths.html.src + '**/_*.pug'])
    .pipe(plumber({
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(pug())
    .pipe(htmlbeautify({
      "indent_size": 2,
      'indent_with_tabs': true,
      "indent_char": " ",
      "max_preserve_newlines": 0,
      "preserve_newlines": false,
      "extra_liners": [],
    }))
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(debug({title: 'pug dest:'}));
}


// Post CSS
const autoprefixerOption = {
  grid: true,
};
const postcssOption = [
  flexBugsFixes,
  autoprefixer(autoprefixerOption),
];

// Sassコンパイル(非圧縮)
function styles() {
  return gulp
    .src(paths.styles.src, { sourcemaps: true })
    .pipe(
      plumber({
        errorHandler: notify.onError('<%= error.message %>'),
      }),
    )
    .pipe(
      sass.sync({
        outputStyle: 'expanded',
      }),
    )
    .pipe(postcss(postcssOption))
    .pipe(gulp.dest(paths.styles.dest, { sourcemaps: './maps' }));
}

// Sassコンパイル（圧縮）
function sassCompress() {
  return gulp
    .src(paths.styles.src)
    .pipe(
      plumber({
        errorHandler: notify.onError('<%= error.message %>'),
      }),
    )
    .pipe(
      sass({
        outputStyle: 'compressed',
        //outputSytle: 'compact',
      }),
    )
    .pipe(postcss(postcssOption, [clean()]))
    .pipe(gulp.dest(paths.styles.dest));
}

// JSコンパイル
function scripts() {
  return gulp
    .src(paths.scripts.src, { sourcemaps: true })
    .pipe(
      babel({
        presets: ['@babel/env'],
      }),
    )
    .pipe(plumber())
    // .pipe(concat(paths.scripts.filename))
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min',
      }),
    )
    .pipe(gulp.dest(paths.scripts.dest, { sourcemaps: './maps' }));
}


// JSコンパイル（マップファイルなし）
function scripts_nomap() {
  return gulp
    .src(paths.scripts.src, { sourcemaps: false })
    .pipe(
      babel({
        presets: ['@babel/env'],
      }),
    )
    .pipe(plumber())
    // .pipe(concat(paths.scripts.filename))
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min',
      }),
    )
    .pipe(gulp.dest(paths.scripts.dest));
}

// マップファイル除去
function cleanMapFiles() {
  return del([paths.styles.map, paths.scripts.map]);
}


// ブラウザ更新&ウォッチタスク
const browserSyncOption = {
  port: 8888,
  server: {
    baseDir: paths.server.baseDir,
    index: paths.server.index,
  },
  reloadOnRestart: true,
};

function browsersync(done) {
  browserSync.init(browserSyncOption);
  done();
}

function watchFilesAndBrowserReload(done) {
  const browserReload = () => {
    browserSync.reload();
    done();
  };
  gulp.watch(paths.styles.src).on('change', gulp.series(styles, browserReload));
  gulp.watch(paths.scripts.src).on('change', gulp.series(scripts, browserReload));
  gulp.watch(paths.html.src).on('change', gulp.series(pugCompile, browserReload));
}

function watchFiles(done) {
  gulp.watch(paths.styles.src).on('change', styles);
  gulp.watch(paths.scripts.src).on('change', scripts);
  gulp.watch(paths.html.src).on('change', pugCompile);
}

gulp.task('clean', cleanMapFiles);
gulp.task('sass-compress', sassCompress);

gulp.task('default', gulp.series(browsersync, watchFilesAndBrowserReload));
gulp.task('watch', gulp.series(watchFiles));
gulp.task('build', gulp.series(pugCompile, scripts_nomap, 'sass-compress', 'clean'));

//exports.dev = gulp.parallel(pugCompile , watchFilesAndBrowserReload); // defaultタスク




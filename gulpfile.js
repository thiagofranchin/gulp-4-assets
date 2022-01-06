const moduleCurrent = {
  current: `module_example`
}

const basePaths = {
  modules: `modules/${moduleCurrent.current}`,
  destStyle: `../../modules/${moduleCurrent.current}/css`,
  destJs: `../../modules/${moduleCurrent.current}/js`
};

const { series, parallel, src, dest, watch } = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const { sync } = require('glob')
const { join, basename } = require('path')
const cleanCSS = require('gulp-clean-css')
const rename = require('gulp-rename')
const bable = require('gulp-babel')
const uglify = require('gulp-uglify')
const sourcemaps = require('gulp-sourcemaps')
require('colors')
sass.compiler = require('sass')

const path = join(__dirname, `${basePaths.modules}`)

const compileSCSS = () =>
  src(sync(join(path, 'scss', '**/*.scss')))
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(join(path, `${basePaths.destStyle}`)))

const compileJS = () =>
  src(sync(join(path, 'js', '**/*.es6.js')))
    .pipe(
      bable({
        presets: ['@babel/env']
      }
    ))
    .pipe(rename(({dirname, basename, extname}) => ({
      dirname,
      basename: `${basename}`.replace(`es6`, `compiled`),
      extname,
      })
    ))
    .pipe(dest(join(path, `${basePaths.destJs}`)))

const minifyCSS = () =>
  src(sync(join(path, 'css', '**/!(*.min).css')))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(rename(({dirname, basename, extname}) => ({
        dirname,
        basename: `${basename}.min`,
        extname,
      })
    ))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(join(path, 'css')))

const minifyJS = () =>
  src(sync(join(path, 'js', '**/*.compiled.js')))
  .pipe(uglify())
  .pipe(rename(({dirname, basename, extname}) => ({
    dirname,
    basename: `${basename}`.replace(`compiled`, `compile.min`),
    extname,
    })
  ))
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(sourcemaps.write('.'))
  .pipe(dest(join(path, 'js')))

const watchJsAndSCSS = (cb) => {
  const jsFiles = sync(join(path, 'js', '**/*.es6.js'))
  console.log(`🔥 Watching ${'JS'.yellow} files... 🔥`.bold)
  console.table(jsFiles.map(path => basename(path)))
  watch(jsFiles, series(compileJS, minifyJS))

  const scssFiles = sync(join(path, 'scss', '**/*.scss'))
  console.log(`🔥 Watching ${'SCSS'.blue} files... 🔥`.bold)
  console.table(scssFiles.map(path => basename(path)))
  watch(scssFiles, series(compileSCSS, minifyCSS))

  cb()
}

exports.default = series(
  parallel(compileJS, compileSCSS),
  parallel(minifyCSS, minifyJS),
  watchJsAndSCSS
)

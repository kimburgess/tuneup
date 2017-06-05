import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import merge from 'merge2';
import tsconfig from './tsconfig.json';
import npmconfig from './package.json';

const plugins = gulpLoadPlugins();

const tsProject = plugins.typescript.createProject('./tsconfig.json');

const paths = {
    dist: 'dist/'
}

/**
 * Pipe a set of streams out to our dist directory and merge the result.
 */
const pipeToDist = (streams) => {
    const toDist = stream => stream.pipe(gulp.dest(paths.dist));
    return merge(streams.map(toDist));
}

/**
 * Lint all typescript source.
 */
gulp.task('lint', () =>
    tsProject.src()
        .pipe(plugins.tslint({
            formatter: 'verbose'
        }))
        .pipe(plugins.tslint.report())
);

/**
 * Nuke any output from anything constructed by build actions.
 */
gulp.task('clean', () =>
    del([paths.dist])
);

/**
 * Transpile the Typescript project components into something Node friendly.
 */
gulp.task('build', ['clean', 'lint'], () => {
    const tsc = tsProject.src().pipe(tsProject());

    return pipeToDist([
        tsc.js,
        tsc.dts
    ]);
});

gulp.task('default', ['build']);

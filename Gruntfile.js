module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      css: {
        src: 'css/*.css',
        dest: 'tmp/style.css'
      }
    },
    cssmin: {
      css: {
        src: 'tmp/style.css',
        dest: 'style.css'
      }
    },
    clean: {
      main: [ 'tmp' ]
    },

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-css');

  grunt.registerTask('default', ['concat', 'cssmin', 'clean']);
}

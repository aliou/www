module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      css: {
        src: 'css/*.css',
        dest: 'style.css'
      }
    },
    cssmin: {
      css: {
        src: 'style.css',
        dest: 'style.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-css');

  grunt.registerTask('default', ['concat', 'cssmin']);
}

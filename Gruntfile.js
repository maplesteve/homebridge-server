/* eslint-env node */
module.exports = function(grunt) {

  grunt.initConfig({
      clean: {
          all: ['dist', 'site'],
          artefacts: ['dist']
      },

      concat: {
          mainHTML: {
              src: ['content/header.html', 'content/navbar.html', 'content/main.html', 'content/footer.html'],
              dest: 'dist/index.html',
          },
          showLogHTML: {
              src: ['content/header.html', 'content/navbar.html', 'content/showLog.html', 'content/footer.html'],
              dest: 'dist/showLog.html',
          },

          addPlatformHTML: {
              src: ['content/header.html', 'content/navbar.html', 'content/addPlatform.html', 'content/footer.html'],
              dest: 'dist/addPlatform.html',
          },

          addAccessoryHTML: {
              src: ['content/header.html', 'content/navbar.html', 'content/addAccessory.html', 'content/footer.html'],
              dest: 'dist/addAccessory.html',
          },

          pluginsHTML: {
              src: ['content/header.html', 'content/navbar.html', 'content/plugins.html', 'content/footer.html'],
              dest: 'dist/plugins.html',
          },
      },
      copy: {
          generated: {
              expand: true,
              cwd: 'dist',
              src: '*',
              dest: 'site/',
              flatten: true,
              filter: 'isFile',
          },
          static: {
              expand: true,
              cwd: 'content/js',
              src: '*',
              dest: 'site/js',
              flatten: true,
              filter: 'isFile',
          },
          css: {
              expand: true,
              cwd: 'content/',
              src: 'style.css',
              dest: 'site/',
              flatten: true,
              filter: 'isFile',
          }
      },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['clean:all', 'concat', 'copy', 'clean:artefacts']);
};

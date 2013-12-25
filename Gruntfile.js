'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    express: {
      options: {
        port: process.env.PORT || 9000
      },
      dev: {
        options: {
          script: 'server.js'
        }
      }
    },

    open: {
      server: {
        url: 'http://localhost:<%= express.options.port %>'
      }
    },

    watch: {
      express: {
        files: [
          'server.js',
          'lib/**/*.js'
        ],
        tasks: ['jshint:server', 'express:dev'],
        options: {
          livereload: true,
          nospawn: true
        }
      },
      styles: {
        files: ['app/styles/**/*.less'],
        tasks: ['less:dev']
      },
      scripts: {
        files: ['app/scripts/**/*.js'],
        tasks: ['jshint:client']
      },
      livereload: {
        files: [
          'app/views/**/*.html',
          '{.tmp,app}/styles/**/*.{css,less}',
          '{.tmp,app}/scripts/**/*.js'
        ],
        options: {
          livereload: true
        }
      }
    },

    jshint: {
      options: {
        reporter: require('jshint-stylish')
      },
      server: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: [
          'Gruntfile.js',
          'server.js',
          'lib/**/*.js'
        ]
      },
      client: {
        options: {
          jshintrc: 'app/.jshintrc'
        },
        src: [
          'app/scripts/**/*.js'
        ]
      }
    },

    less: {
      dev: {
        options: {
          paths: ['app/styles'],
          cleancss: false
        },
        files: {
          '.tmp/styles/main.css': 'app/styles/main.less'
        }
      }
    },

    clean: {
      server: '.tmp'
    }
  });

  grunt.registerTask('express-keepalive', 'Keep grunt running', function () {
    this.async();
  });

  grunt.registerTask('serve', function () {
    grunt.task.run([
      'jshint',
      'clean:server',
      'less:dev',
      'express:dev',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('default', ['serve']);
};

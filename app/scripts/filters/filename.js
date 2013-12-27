(function () {
  'use strict';

  var app = angular.module('powerPlotApp');

  app.filter('filename', function () {
    return function (input) {
      if (input && input.length > 0) {
        return input[0].name;
      }

      return 'Choose a file...';
    };
  });
})();

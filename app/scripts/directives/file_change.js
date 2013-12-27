(function () {
  'use strict';

  var app = angular.module('powerPlotApp');

  app.directive('fileChange', function () {
    return {
      link: function (scope, element, attributes) {
        element.on('change', function () {
          scope.$apply(function () {
            scope[attributes.fileChange](element[0].files);
          });
        });
      }
    };
  });
})();

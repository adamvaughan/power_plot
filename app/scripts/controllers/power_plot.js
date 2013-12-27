(function () {
  'use strict';

  var app = angular.module('powerPlotApp');

  app.controller('PowerPlotCtrl', ['$scope', '$timeout', '$window', 'FileUploader', 'Graph',
    function ($scope, $timeout, $window, FileUploader, Graph) {
      var uploadComplete = function (data) {
        $scope.uploadPercentComplete = 100;

        $timeout(function () {
          $scope.uploading = false;
          $scope.files = null;
        }, 2000);

        $scope.data = data;
        $scope.session = $scope.data[0];
        $scope.lap = $scope.session.laps[0];
      };

      var uploadFailed = function (error) {
        $scope.error = {
          message: 'Failed to upload file!',
          details: error
        };
      };

      var uploadProgress = function (data) {
        $scope.uploadPercentComplete = Math.floor(data);
      };

      $scope.plotData = $window.localStorage.getItem('plotData');

      if ($scope.plotData) {
        $scope.plotData = JSON.parse($scope.plotData);
        Graph.graph($scope.plotData);
      } else {
        $scope.plotData = [];
      }

      var caclulateFunctionalThresholdPower = function (records) {
        var averagePower = _.reduce(records, function (sum, record) {
          return sum + record.power;
        }, 0) / records.length;

        return averagePower * 0.95;
      };

      $scope.setFiles = function (files) {
        $scope.files = files;
      };

      $scope.uploadFile = function () {
        $scope.uploading = true;
        $scope.error = null;

        FileUploader.upload('/upload', $scope.files[0])
          .then(uploadComplete, uploadFailed, uploadProgress);
      };

      $scope.addData = function () {
        var startTime = Date.parse($scope.lap.records[0].timestamp);

        $scope.plotData.push({
          label: $scope.label,
          ftp: caclulateFunctionalThresholdPower($scope.lap.records),
          records: _.map($scope.lap.records, function (record) {
            record.elapsedTime = Date.parse(record.timestamp) - startTime;
            return record;
          })
        });

        $window.localStorage.setItem('plotData', JSON.stringify($scope.plotData));

        $scope.session = $scope.data[0];
        $scope.lap = $scope.session.laps[0];
        $scope.label = null;

        Graph.graph($scope.plotData);
      };

      $scope.discardData = function () {
        $scope.data = null;
      };

      $scope.discardPlotData = function () {
        $scope.plotData = [];
        $window.localStorage.removeItem('plotData');
      };
    }]);
})();

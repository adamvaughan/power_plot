(function () {
  'use strict';

  var app = angular.module('powerPlotApp', []);

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

  app.filter('filename', function () {
    return function (input) {
      if (input && input.length > 0) {
        return input[0].name;
      }

      return 'Choose a file...';
    };
  });

  app.service('FileUploader', ['$q',
    function ($q) {
      return {
        upload: function (url, file) {
          var deferred = $q.defer();
          var formData = new FormData();
          var xhr = new XMLHttpRequest();

          var readyStateChanged = function () {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                deferred.resolve(angular.fromJson(xhr.responseText));
              } else {
                deferred.reject('Upload failed: (' + xhr.status + ' ' + xhr.statusText + ') ' + xhr.responseText);
              }
            }
          };

          var updateProgress = function (event) {
            if (event.lengthComputable) {
              deferred.notify((event.loaded / event.total) * 100);
            }
          };

          formData.append('file', file);

          xhr.addEventListener('readystatechange', readyStateChanged, false);
          xhr.upload.addEventListener('progress', updateProgress, false);

          xhr.open('POST', url);
          xhr.send(formData);

          return deferred.promise;
        }
      };
    }]);

  app.service('Graph', function () {
    var margin = { top: 20, right: 80, bottom: 30, left: 50 };
    var width = 960 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .tickFormat(function (value) {
        value = value.getTime();

        if (value === 0) {
          return '';
        }

        return value / 60000;
      });

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');

    var line = d3.svg.line()
      .interpolate('basis')
      .x(function (record) {
        return x(record.elapsedTime);
      })
      .y(function (record) {
        return y(record.power);
      });

    var ftpLine = d3.svg.line()
      .x(function (d) {
        return x(d[0]);
      })
      .y(function (d) {
        return y(d[1]);
      });

    var svg = d3.select('.graph')
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xMax;

    var calculateXMax = function (data) {
      xMax = d3.max(data, function (ride) {
        return d3.max(ride.records, function (record) {
          return record.elapsedTime;
        });
      });
    };

    var updateXDomain = function () {
      x.domain([0, xMax]);
    };

    var updateYDomain = function (data) {
      y.domain([
        d3.min(data, function (ride) {
          return d3.min(ride.records, function (record) {
            return record.power;
          });
        }),
        d3.max(data, function (ride) {
          return d3.max(ride.records, function (record) {
            return record.power;
          });
        })
      ]).nice();
    };

    var drawXAxis = function (transition) {
      if (svg.selectAll('.x.axis').empty()) {
        // x-axis and label
        svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis)
          .append('text')
          .attr('class', 'label')
          .attr('x', width - 10)
          .attr('y', -6)
          .attr('dx', '.71em')
          .style('text-anchor', 'end')
          .text('Elapsed Time (min)');
      } else {
        transition.selectAll('.x.axis').call(xAxis);
      }
    };

    var drawYAxis = function (transition) {
      if (svg.selectAll('.y.axis').empty()) {
        // y-axis and label
        svg.append('g')
          .attr('class', 'y axis')
          .call(yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('transform', 'rotate(-90)')
          .attr('y', 6)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text('Power (W)');
      } else {
        transition.selectAll('.y.axis').call(yAxis);
      }
    };

    var drawPowerLines = function (data, transition) {
      var lines = svg.selectAll('.line.power')
        .data(data);
      var enter = lines.enter();
      var exit = lines.exit();

      enter.append('path')
        .attr('class', 'line power')
        .style('stroke', function (ride) {
          return color(ride.label);
        });

      exit.remove();

      transition.selectAll('.line.power').attr('d', function (ride) {
        return line(ride.records);
      });
    };

    var drawPowerLabels = function (data, transition, style) {
      if (style) {
        style = style + '-';
      } else {
        style = '';
      }

      var labels = svg.selectAll('.' + style + 'label.power')
        .data(data);
      var enter = labels.enter();
      var exit = labels.exit();

      enter.append('text')
        .attr('class', style + 'label power')
        .attr('x', 3)
        .attr('dy', '.35em')
        .style('fill', function (ride) {
          return color(ride.label);
        })
        .text(function (ride) {
          return ride.label;
        });

      exit.remove();

      transition.selectAll('.' + style + 'label.power').attr('transform', function (ride) {
        var lastRecord = _.last(ride.records);
        return 'translate(' + x(lastRecord.elapsedTime) + ',' + y(lastRecord.power) + ')';
      });
    };

    var drawFtpLines = function (data, transition) {
      var lines = svg.selectAll('.line.ftp')
        .data(data);
      var enter = lines.enter();
      var exit = lines.exit();

      enter.append('path')
        .attr('class', 'line ftp')
        .style('stroke', function (ride) {
          return color(ride.label);
        });

      exit.remove();

      transition.selectAll('.line.ftp').attr('d', function (ride) {
        return ftpLine([[0, ride.ftp], [xMax, ride.ftp]]);
      });
    };

    var drawFtpLabels = function (data, transition) {
      var labels = svg.selectAll('.label.ftp')
        .data(data);
      var enter = labels.enter();
      var exit = labels.exit();

      enter.append('text')
        .attr('class', 'label ftp')
        .attr('x', 3)
        .attr('dy', '.35em')
        .style('fill', function (ride) {
          return color(ride.label);
        })
        .text(function (ride) {
          return Math.round(ride.ftp) + 'W';
        });

      exit.remove();

      transition.selectAll('.label.ftp').attr('transform', function (ride) {
        return 'translate(' + x(xMax) + ',' + y(ride.ftp) + ')';
      });
    };

    return {
      graph: function (data) {
        color.domain(_.pluck(data, 'label'));

        calculateXMax(data);
        updateXDomain();
        updateYDomain(data);

        var transition = svg.transition().duration(500);

        drawXAxis(transition);
        drawYAxis(transition);

        drawPowerLines(data, transition);
        drawPowerLabels(data, transition, 'outline');
        drawPowerLabels(data, transition);
        drawFtpLines(data, transition);
        drawFtpLabels(data, transition);
      }
    };
  });
})();

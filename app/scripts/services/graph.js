(function () {
  'use strict';

  var app = angular.module('powerPlotApp');

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

    var calculateXMax = function (data) {
      return d3.max(data, function (ride) {
        return d3.max(ride.records, function (record) {
          return record.elapsedTime;
        });
      });
    };

    var updateXDomain = function (xMax) {
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

    var drawFtpLines = function (data, xMax, transition) {
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

    var drawFtpLabels = function (data, xMax, transition) {
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
        var xMax = calculateXMax(data);

        color.domain(_.pluck(data, 'label'));

        updateXDomain(xMax);
        updateYDomain(data);

        var transition = svg.transition().duration(500);

        drawXAxis(transition);
        drawYAxis(transition);

        drawPowerLines(data, transition);
        drawPowerLabels(data, transition, 'outline');
        drawPowerLabels(data, transition);
        drawFtpLines(data, xMax, transition);
        drawFtpLabels(data, xMax, transition);
      }
    };
  });
})();

'use strict';

var _ = require('lodash');
var fs = require('fs');
var fit = require('fit');
var when = require('when');

var readFile = function (file) {
  var deferred = when.defer();

  fs.readFile(file, function (error, data) {
    if (error) {
      return deferred.reject(error);
    }

    deferred.resolve(data);
  });

  return deferred.promise;
};

var parseData = function (data) {
  var deferred = when.defer();

  fit.parse(data, function (error, data) {
    if (error) {
      return deferred.reject(error);
    }

    deferred.resolve(data);
  });

  return deferred.promise;
};

var calculatePower = function (record) {
  var speed = record.speed * 2.23694;
  return (5.244820 * speed) + (0.019168 * Math.pow(speed, 3));
};

var gatherLapData = function (lap, data) {
  var startTime = Date.parse(lap.startTime);
  var stopTime = startTime + (lap.totalElapsedTime * 1000);

  var records = _.select(data.records, function (record) {
    var timestamp = Date.parse(record.timestamp);
    return timestamp >= startTime && timestamp <= stopTime;
  });

  return _.map(records, function (record) {
    record.power = calculatePower(record);
    return record;
  });
};

var gatherLaps = function (session, data) {
  var index = 0;

  return _.map(session.laps, function (lap) {
    index += 1;

    return {
      index: index,
      records: gatherLapData(lap, data)
    };
  });
};

var gatherSessions = function (data) {
  var index = 0;

  return _.map(data.sessions, function (session) {
    index += 1;

    return {
      index: index,
      laps: gatherLaps(session, data)
    };
  });
};

exports.parse = function (file) {
  return readFile(file)
    .then(parseData)
    .then(gatherSessions);
};

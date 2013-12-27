(function () {
  'use strict';

  var app = angular.module('powerPlotApp');

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
})();

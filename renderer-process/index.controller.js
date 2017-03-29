const ipc = require('electron').ipcRenderer;

angular
  .module('excelencia')
  .controller('IndexController', IndexController);

function IndexController($scope) {
  var vm = this;
  vm.directoryToDownload = '';

  vm.selectDirectoryClick = function() {
    ipc.send('select-directory');
  }

  vm.downloadFiles = function() {
    ipc.send('download-files', vm.directoryToDownload);
  }

  ipc.on('selected-directory', function(event, path) {
    $scope.$apply(function() {
      vm.directoryToDownload = path[0];
    });
  });

  ipc.on('download-progress', function(event, perc) {
    $scope.$apply(function() {
      vm.statusDownload = `Download ${perc}% concluido.`;
    });
  });

  ipc.on('download-finish', function(event, file) {
    $scope.$apply(function() {
      vm.statusDownload = 'Download concluido.';
    });
  });
}

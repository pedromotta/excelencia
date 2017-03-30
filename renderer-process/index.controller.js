const ipc = require('electron').ipcRenderer;

angular
  .module('excelencia')
  .controller('IndexController', IndexController);

function IndexController($scope) {
  var vm = this;
  vm.downloading = false;
  vm.statusDownloadRegion = {};
  vm.statusDownload = '';
  vm.directoryToDownload = '';
  vm.regions = [1, 2, 3, 4, 5, 6];

  function setStatusDownload(message) {
    vm.statusDownload = message;
  }

  vm.selectDirectoryClick = function() {
    ipc.send('select-directory');
    vm.downloading = true;
  }

  vm.downloadFiles = function() {
    vm.downloading = true;
    setStatusDownload('Fazendo download...');
    ipc.send('download-files', vm.regions);
  }

  ipc.on('selected-directory', function(event, path) {
    $scope.$apply(function() {
      vm.directoryToDownload = path[0];
    });
  });

  ipc.on('download-progress', function(event, progressObj) {
    $scope.$apply(function() {
      vm.statusDownloadRegion[progressObj.regionNumber] = progressObj.perc.toFixed(2);
    });
  });

  ipc.on('download-finish', function(event, file) {
    $scope.$apply(function() {
      vm.downloading = false;
      setStatusDownload('Download concluido com sucesso!');
    });
  });

  ipc.on('download-error', function(event, error) {
    $scope.$apply(function() {
      vm.downloading = false;
      setStatusDownload('Download interormpido');
    });
    alert(error);
  });
}

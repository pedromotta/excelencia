const ipc = require('electron').ipcRenderer;

angular
  .module('excelencia')
  .controller('IndexController', IndexController);

function IndexController($scope) {
  var vm = this;
  vm.downloading = false;
  vm.checking = true;
  vm.statusDownloadRegion = {};
  vm.statusDownload = '';
  vm.directoryToDownload = '';
  vm.isAllRegions = true;
  vm.regions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  vm.statusLink = []
  vm.selectedRegions = vm.regions.map((region) => {
    return {numRegion: region, selected: true}
  });

  ipc.send('get-date-of-publications');
  ipc.send('check-links', vm.regions);

  function getSelectionRegion() {
    return vm.selectedRegions
      .filter((region) => {
        return region.selected;
      }).map((region) => {
        return region.numRegion;
      })
  }
  function setStatusDownload(message) {
    vm.statusDownload = message;
  }

  vm.selectAllRegions = function() {
    vm.selectedRegions.forEach((region) => region.selected = vm.isAllRegions);
  }

  vm.regionToggled = function() {
    vm.isAllRegions = vm.selectedRegions.every((region) => region.selected);
  }

  vm.selectDirectoryClick = function() {
    ipc.send('select-directory');
    vm.downloading = true;
  }

  vm.downloadFiles = function() {
    vm.downloading = true;
    setStatusDownload('Fazendo download...');
    ipc.send('download-files', getSelectionRegion());
  }

  vm.cancelDownload = function() {
    ipc.send('cancel-download');
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

  ipc.on('date-of-publications', function(event, date) {
    $scope.$apply(function() {
      setStatusDownload(`Publicações do dia ${date}`);
    });
  });

  ipc.on('links-checked', function(event, statusLink) {
    vm.checking = false;
    $scope.$apply(function() {
      vm.statusLink = statusLink;
    });
  });
}

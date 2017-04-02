const electron = require('electron');
const ipc = electron.ipcRenderer;

angular
    .module('excelencia')
    .controller('IndexController', IndexController);

function IndexController($scope, indexService, loggerService) {
    const logger = loggerService.getLogger(this);
    const vm = this;

    vm.isDownloading = false;
    vm.isCheckingLinks = true;
    vm.isAllRegions = true;
    vm.statusDownloadRegion = {};
    vm.messageStatus = '';
    vm.folderToDownload = '';
    vm.regions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    vm.statusLink = [];
    vm.selectedRegions = vm.regions.map((region) => {
        return {numRegion: region, selected: true}
    });
    vm.availableFiles = {};

    function updateView(functionToUpdate) {
        return $scope.$apply(functionToUpdate);
    }

    function selectedRegions() {
        return vm.selectedRegions
            .filter((region) => {
                return region.selected;
            }).map((region) => {
                return region.numRegion;
            });
    }

    function updateFooterMessage(message) {
        vm.messageStatus = message;
    }

    const updateStatusDownload = (err, data) => {
        updateView(() => vm.statusDownloadRegion[data.region] = data.perc.toFixed(2));
    };

    const downloadCompleted = (err) => {
        updateView(() => {
            vm.isDownloading = false;
            updateFooterMessage(err ? 'Ocorreu um erro ao fazer o download.' : 'Download concluido com sucesso!');
        });
    }

    indexService.verifyLinks(vm.regions, (err, links) => {
        vm.isCheckingLinks = false;

        updateView(() => vm.statusLink = links);
    });

    indexService.dateOfPublications((err, date) => {
        updateView(() => updateFooterMessage(`Publicações do dia ${date}`));
    });

    vm.onClickSelectFolder = () => {
        indexService.selectFolder(vm.regions, (err, data) => {
            updateView(() => {
                vm.folderToDownload = data.path;
                vm.availableFiles = data.availableFiles;
            });
        });
    };

    vm.onSelectAllRegions = () => {
        vm.selectedRegions.forEach((region) => region.selected = vm.isAllRegions);
    };

    vm.onToggleRegionToDownload = () => {
        vm.isAllRegions = vm.selectedRegions.every((region) => region.selected);
    };

    vm.download = () => {
        if (!vm.folderToDownload) {
            alert('Selecione um pasta para fazer o download das publicações');
            return;
        }
        vm.isDownloading = true;
        updateFooterMessage('Fazendo download...');

        indexService.download(selectedRegions(), updateStatusDownload, downloadCompleted);
    };

    vm.openPublication = (region) => {
        indexService.openPublication(region);
    }
}

const electron = require('electron');
const ipc = electron.ipcRenderer;

angular
    .module('excelencia')
    .service('indexService', indexService);

function indexService(loggerService) {
    const logger = loggerService.getLogger(this);

    const selectFolderEvent = (regions, response) => {
        ipc.on('select-folder', (event, err, data) => {
            logger.debug('select-folder', err, data);
            response(err, data);
        });

        ipc.send('select-folder', regions);
    };

    const dateOfPublicationsEvent = (response) => {
        ipc.on('date-publications', (event, err, date) => {
            logger.debug('date-publications', err, date);
            response(err, date);
        });

        ipc.send('date-publications');
    };

    const verifyLinksEvent = (regions, response) => {
        ipc.on('verify-links', (event, err, regions) => {
            logger.debug('verify-links', err, regions);
            response(err, regions);
        });

        ipc.send('verify-links', regions);
    };

    const downloadEvent = (regions, onProgress, response) => {
        ipc.on('download-publications', (event, err) => response(err));

        ipc.on('download-progress-publications', (event, progress) => onProgress(null, progress));

        ipc.send('download-publications', regions);
    };

    const openPublicationEvent = (region) => {
        ipc.send('open-publication', region);
    };

    this.selectFolder = (regions, response) => selectFolderEvent(regions, response);
    this.dateOfPublications = (response) => dateOfPublicationsEvent(response);
    this.verifyLinks = (regions, response) => verifyLinksEvent(regions, response);
    this.download = (regions, onProgress, response) => downloadEvent(regions, onProgress, response);
    this.openPublication = (region) => openPublicationEvent(region);
}



const electron = require('electron');
const dialog = electron.dialog;
const shell = electron.shell;
const ipc = electron.ipcMain;
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

let targetPath = '';

const getProgress = (received, total) => {
    return (received * 100) / total;
};

const onReceiveData = (event) => {
    return function (data) {
        event.sender.send('download-progress-publications', data);
    }
};

const getFileNameByRegionNumber = (regionNumber) => {
    let regionNumberString = ('0' + regionNumber).slice(-2);
    return `Diario_J_${regionNumberString}.pdf`;
};

const downloadDiarioOficial = (region, onData) => {
    console.log(`Download ${region} started`);
    return new Promise((resolve, reject) => {
        let received_bytes = 0;
        let total_bytes = 0;
        const fileName = getFileNameByRegionNumber(region);

        const req = request({
            method: 'GET',
            uri: `https://aplicacao.jt.jus.br/${fileName}`
        });

        const out = fs.createWriteStream(`${targetPath}/${fileName}`);

        out.on('error', (err) => {
            console.error('Error ao criar arquivo.', err);
            reject('Error ao criar arquivo.', err);
        });

        out.on('open', () => {
            req.pipe(out);

            req.on('response', (data) => {
                total_bytes = parseInt(data.headers['content-length']);
            });

            req.on('data', (chunk) => {
                received_bytes += chunk.length;
                onData({
                    region: region,
                    perc: getProgress(received_bytes, total_bytes)
                });
            });

            req.on('end', resolve);
        });
    });
};

const readDateFromPageHTML = (html) => {
    let $ = cheerio.load(html);
    return $("#tituloPagina").children().last().text();
};

const checkLink = (region) => {
    let publicationFileName = getFileNameByRegionNumber(region);

    return new Promise((resolve, reject) => {
        request({
            method: 'HEAD',
            uri: `https://aplicacao.jt.jus.br/${publicationFileName}`
        }, function (err, response) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    region: region,
                    status: response.statusCode === 200
                });
            }
        });
    });
};

ipc.on('select-folder', (event, regions) => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, function (path) {
        if (path) {
            targetPath = path;
            let availableFile = {};

            regions.forEach((region) => {
                availableFile[region] = existFile(path, region);
            });

            event.sender.send('select-folder', null, {
                path: path[0],
                availableFiles: availableFile
            });
        }
    });
});

function existFile(path, region) {
    return shell.showItemInFolder(`${path}/${getFileNameByRegionNumber(region)}`);
}

ipc.on('date-publications', (event) => {
    request({
        uri: "https://aplicacao.jt.jus.br/dejt.html",
    }, function (error, response, body) {
        let date = readDateFromPageHTML(body);
        event.sender.send('date-publications', error, date);
    });
});

ipc.on('verify-links', (event, regions) => {
    let linksToVerify = regions.map((region) => checkLink(region));

    Promise
        .all(linksToVerify)
        .then((values) => {
            event.sender.send('verify-links', null, values);
        })
        .catch((error) => {
            console.log(error);
            event.sender.send('verify-links', error);
        });
});

ipc.on('download-publications', (event, regions) => {
    let downloads = regions.map((region) => {
        return downloadDiarioOficial(region, onReceiveData(event));
    });

    Promise
        .all(downloads)
        .then(() => {
            console.log('Download done.');
            event.sender.send('download-publications');
        })
        .catch((err) => {
            console.error('Download error', err);
            event.sender.send('download-publications', err);
        });
});


ipc.on('open-publication', (event, region) => {
    const fileName = getFileNameByRegionNumber(region);
    const fullPath = `${targetPath}/${fileName}`;
    console.log('open publication', region, fullPath);
    shell.openExternal(`file://${fullPath}`);
});

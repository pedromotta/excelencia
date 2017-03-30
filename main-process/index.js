const dialog = require('electron').dialog;
const fs = require('fs');
const ipc = require('electron').ipcMain;
const request = require('request');

let targetPath = '';

let getProgress = (received, total) => {
  var percentage = (received * 100) / total;
  return percentage;
}

let onReceiveData = (event) => {
  return function (data) {
    event.sender.send('download-progress', data);
  }
}

let downloadDiarioOficial = (regionNumber, onData) => {
  console.log(`Download ${regionNumber} started`);
  return new Promise((resolve, reject) => {
    let received_bytes = 0;
    let total_bytes = 0;
    let regionNumberString = ('0' + regionNumber).slice(-2);
    let fileName = `Diario_J_${regionNumberString}.pdf`;

    let req = request({
      method: 'GET',
      uri: `https://aplicacao.jt.jus.br/${fileName}`
    });

    let out = fs.createWriteStream(`${targetPath}/${fileName}`);

    out.on('error', (err) => {
      console.error('Error ao criar arquivo.', err);
      reject(err);
    })

    req.pipe(out);

    req.on('response', (data) => {
      // Change the total bytes value to get progress later.
      total_bytes = parseInt(data.headers['content-length']);
    });

    req.on('data', (chunk) => {
      // Update the received bytes
      received_bytes += chunk.length;
      let perc = getProgress(received_bytes, total_bytes);
      onData({
        regionNumber: regionNumber,
        perc: perc
      });
    });

    req.on('end', resolve);
  });
}

ipc.on('select-directory', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function(path) {
    if (path) {
      targetPath = path;
      event.sender.send('selected-directory', path);
    }
  });
});

ipc.on('download-files', (event, regions) => {
  let downloads = regions.map((region) => {
    return downloadDiarioOficial(region, onReceiveData(event));
  })

  Promise.all(downloads)
    .then(() => {
      console.log('Download done.');
      event.sender.send('download-finish');
    })
    .catch((err) => {
      console.error('Download error', err);
      event.sender.send('download-error', err);
    })
});

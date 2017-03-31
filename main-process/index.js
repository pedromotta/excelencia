const dialog = require('electron').dialog;
const fs = require('fs');
const ipc = require('electron').ipcMain;
const request = require('request');
const cheerio = require('cheerio');

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

let getFileNameByRegionNumber = (regionNumber) => {
  let regionNumberString = ('0' + regionNumber).slice(-2);
  return `Diario_J_${regionNumberString}.pdf`;
}

let downloadDiarioOficial = (regionNumber, onData) => {
  console.log(`Download ${regionNumber} started`);
  return new Promise((resolve, reject) => {
    let received_bytes = 0;
    let total_bytes = 0;
    let fileName = getFileNameByRegionNumber(regionNumber);

    let req = request({
      method: 'GET',
      uri: `https://aplicacao.jt.jus.br/${fileName}`
    });

    let out = fs.createWriteStream(`${targetPath}/${fileName}`);

    out.on('error', (err) => {
      console.error('Error ao criar arquivo.', err);
      reject('Error ao criar arquivo.', err);
    })

    out.on('open', () => {
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
  });
}

let checkLink = (regionNumber) => {
  let fileName = getFileNameByRegionNumber(regionNumber);

  return new Promise((resolve, reject) => {
    let req = request({
      method: 'HEAD',
      uri: `https://aplicacao.jt.jus.br/${fileName}`
    }, function(err, response, body) {
      if (err) {
        reject(err);
      } else {
        console.log(response.headers['content-length']);
        resolve({
          regionNumber: regionNumber,
          status: response.statusCode === 200
        });
      }
    });
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

ipc.on('get-date-of-publications', (event) => {
    request({
      uri: "https://aplicacao.jt.jus.br/dejt.html",
    }, function(error, response, body) {
      let $ = cheerio.load(body);
      let date = $("#tituloPagina").children().last().text();
      event.sender.send('date-of-publications', date);
    });
});

ipc.on('check-links', (event, regions) => {
  let linksToCheck = regions.map((region) => {
    return checkLink(region);
  })
  Promise.all(linksToCheck)
    .then((values) => {
      event.sender.send('links-checked', values);
    })
});

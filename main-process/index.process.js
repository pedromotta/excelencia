const request = require('request');
const fs = require('fs');
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;

ipc.on('select-directory', function (event) {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function (path) {
    if (path) {
      event.sender.send('selected-directory', path);
    }
  });
});

ipc.on('download-files', function (event, targetPath) {
    // Save variable to know progress
    var received_bytes = 0;
    var total_bytes = 0;
    var req = request({
        method: 'GET',
        uri: 'https://aplicacao.jt.jus.br/Diario_J_01.pdf'
    });

    var out = fs.createWriteStream(`${targetPath}/Diario_J_01.pdf`);

    out.on('error', (err) => {
      console.log(err);
    })

    req.pipe(out);

    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
    });

    req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;

        let perc = showProgress(received_bytes, total_bytes);
        event.sender.send('download-progress', perc);
    });

    req.on('end', function() {
        event.sender.send('download-finish');
    });
});

function showProgress(received,total){
    var percentage = (received * 100) / total;
    console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
    return percentage;
}

const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, './functions');
const exportedModules = {};

function loadModules(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) { loadModules(fullPath); }
    else if (file.endsWith('.js')) {
      try {
        const moduleName = path.parse(file).name;
        const modulePath = path.join(dir, file);
        exportedModules[moduleName] = require(modulePath)[moduleName];
        console.log(`Loaded Module: ${moduleName}`);
      }
      catch (error) { console.error(`Failed to load module ${file}: ${error.message}`); }
    }
  });
}

//loadModules(folderPath); // disabled

module.exports = exportedModules;
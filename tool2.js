const { on } = require('events');
var klaw = require('klaw');
var fs = require('fs');

var os = require('os');
var path = require('path');

function readConfig(fConfig) {
    console.log("Reading config file: " + fConfig);
    let buffer = fs.readFileSync(fConfig, { encoding: 'utf8', flag: 'r' });
    let lines = buffer.split('\n');
    let map = {};
    lines.forEach(element => {
        let tokens = element.split(':');
        if (tokens.length === 2) {
            map[tokens[0].trim()] = tokens[1].trim();
        }
    });
    return map;
}

function readInput(fInput) {
    console.log("Reading input file: " + fInput);

    let buffer = fs.readFileSync(fInput, { encoding: 'utf8', flag: 'r' });
    let lines = buffer.split('\n');
    return lines;
}

function writeJson(json) {
    console.log("Writing to ./output.txt");
    fs.writeFileSync('./output.txt', JSON.stringify(json, null, 1));
}

function main() {
    if (process.argv.length < 4) {
        console.error("Please provide Config and Input directory");
        return;
    }

    let config = readConfig(process.argv[2]);
    let inputDir = process.argv[3];
    let items = [];
    klaw(inputDir)
        .on('data', item => items.push(item.path))
        .on('end', () => {
            for (let index = 0; index < items.length; index++) {
                const element = items[index];
                let stats = fs.statSync(element);
                if (!stats.isFile())
                    continue;
                // console.log(`Is File: ${stats.isFile()}`);
                // console.log(`Is Directory: ${stats.isDirectory()}`);

                const newName = element.replace(/master/g, config['Target'])
                console.log(`${element} to ${newName}`)
            }
        }); // => [ ... array of files]
}


main();
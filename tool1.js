var fs = require('fs');
var os = require('os');
var path = require('path');
var rimraf = require('rimraf');
const { on } = require('events');
var klaw = require('klaw');
var argv = require('yargs/yargs')(process.argv.slice(2))
    .demandOption(['c', 'i', 'f'])
    .alias('c', 'config')
    .alias('f', 'function')
    .default('f', 1)
    .alias('i', 'input').argv;

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

function doReplace(input, target) {
    let items = [];
    let startdir = input.replace(/master/g, target);
    klaw(startdir)
        .on('data', item => items.push(item.path))
        .on('end', () => {
            for (let index = 0; index < items.length; index++) {
                const element = items[index];
                fs.stat(element, (err, stat) => {
                    if (!stat.isFile() || element.includes('.git')) {
                        return;
                    }
                    fs.readFile(element, 'utf8', (err, data) => {
                        if (err) {
                            console.error("Err", err);
                            return;
                        }
                        let result = data.replace(/master/g, target);
                        fs.writeFile(element, result, err => { if (err) console.log("Err", err); });
                    })
                });
            }

        });
}

function main() {

    let config = readConfig(argv.c);

    if (argv.f === 1) {
        let input = readInput(argv.i);
        let output = {};
        input.forEach(element => {
            let line = element.trim('\r');
            output[config['Key'] + line] = {
                'target': {
                    'object': config['Object'] + line,
                    'schema': config['Schema'] + line
                }
            };
        });
        writeJson(output);
    }


    if (argv.f === 2) {
        let items = [];
        klaw(argv.i)
            .on('data', item => items.push(item.path))
            .on('end', () => {
                console.log(items[0]);
                for (let index = 0; index < items.length; index++) {
                    const element = items[index];
                    if (element.includes('.git'))
                        continue;
                    let stats = fs.stat(element, (err, stats) => {
                        if (!stats.isFile())
                            return;
                        // console.log(`Is File: ${stats.isFile()}`);
                        // console.log(`Is Directory: ${stats.isDirectory()}`);

                        const newName = element.replace(/master/g, config['Target']);
                        if (!fs.existsSync(path.dirname(newName)))
                            fs.mkdirSync(path.dirname(newName), { recursive: true });

                        fs.copyFile(element, newName, err => {
                            if (err) console.log("Err", err);
                        });
                    });
                }

                rimraf(argv.input, err => {
                    if (err) {
                        console.error("Err", err);
                    }
                });
                doReplace(argv.i, config['Target']);
            }); // => [ ... array of files]
    }

    if (argv.f === 3) {
        doReplace(argv.i, config['Target']);
    }

    if (argv.f === 4) {

    }
}


main();
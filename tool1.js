var fs = require('fs');
var os = require('os');
var path = require('path');
var rimraf = require('rimraf');
var { on } = require('events');
var { spawn, spawnSync, exec } = require('child_process');
var klaw = require('klaw');
var argv = require('yargs/yargs')(process.argv.slice(2))
    .alias('c', 'config')
    .default('c', 'Config.txt')
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

    console.log(map);
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
    console.log("[Function 3] Replacing file contents");
    let items = [];
    // let startdir = input.replace(/master/g, target);
    let startdir = input;
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

function xcopy(src, dst) {
    let folderName = path.basename(src);
    let finalDest = path.join(dst, folderName);
    if (!fs.existsSync(finalDest)) {
        fs.mkdirSync(finalDest);
    }
    console.log(`[Function 4] Xcopying ${src} -> ${dst}`);
    exec(`xcopy \"${src}\" \"${finalDest}\" /Y`, err => {
        if (err) {
            console.log(err);
            return;
        }
    });
}

function main() {

    let config = readConfig(argv.config);

    if (argv.f === 1) {
        console.log("[Function 1] Generating output.txt")
        let input = readInput(argv.input);
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
        console.log("[Function 2] Renaming folder...");
        klaw(argv.input)
            .on('data', item => items.push(item.path))
            .on('end', () => {
                for (let index = 0; index < items.length; index++) {
                    const element = items[index];
                    if (element.includes('.git'))
                        continue;
                    let stats = fs.statSync(element);
                    if (!stats.isFile()) {
                        continue;
                    }

                    const newName = element.replace(/master/g, config['Target']);
                    if (!fs.existsSync(path.dirname(newName)))
                        fs.mkdirSync(path.dirname(newName), { recursive: true });

                    fs.copyFileSync(element, newName);
                }
                console.log("[Function 2] Removing old folder...")
                rimraf(argv.input, err => {
                    if (err) {
                        console.error("Err", err);
                        return;
                    }

                    // let target = config['Target'];
                    // doReplace(argv.input.replace(/master/g, target), target);
                    // let dest = path.join(argv.i.replace(/master/g, config['Target']), `tool_${config['Target']}`, 'resources');
                    // xcopy(config['Resources'], dest);
                });
            });
    }

    if (argv.f === 3) {
        doReplace(argv.input, config['Target']);
    }

    if (argv.f === 4) {
        let dest = path.join(argv.input, `tool_${config['Target']}`, 'resources');
        xcopy(config['Resources'], dest);
    }
}




main();
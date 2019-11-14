#!/usr/bin/env node

// An outside script will pull the latest file from the board and convert it to a .csv file
// This script will search the columns for the specified query and will print those columns

// form:
//  https://stackoverflow.com/questions/1880198/how-to-execute-shell-command-in-javascript
var execSync = require('child_process').execSync;

var program = require('commander'); // npm install --save commander
program
   .option('-s, --search <columns to search for>', 'A query for which columns to report')
   .option('-f, --file <file>', 'File to parse')
   .option('-u, --update', 'Update the latest.csv file')
   .parse(process.argv);

if (program.update) {
    console.log('Pulling over latest DLog...')
    execSync('~/bin/grabLatest.sh', { encoding: 'utf-8'}); // the default is 'buffer'
}

var target = `/home/tamausb/bin/dlog/latest.csv`
if (program.file) {
    target = program.file;
}

const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream(target);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

var lines = [];
var columnHeaders = [];
var columnNumbs = [];
rl.on('line', (line) => {
    lines.push( line );
}).on('close', () => {
    columnHeaders = lines[0].split(',');
    var i,j,k;
    console.log(`Searching for ${program.search}`)
    // console.log("")
    // console.log("Printing found term with its column number")
    // Collect column numbers
    for (i=0; i<columnHeaders.length; i++) {
        if (columnHeaders[i].search(new RegExp(program.search, "i")) != -1) {
            columnNumbs.push(i);
            // console.log(`${columnHeaders[i]} at ${i}`);
        }
    }

    console.log("")
    console.log("Printing Column header followed by the line number for the entry and its value")
    // print out the contents of the columnHeaders
    for (i=0; i<columnNumbs.length; i++) {
        var col = columnNumbs[i];
        console.log("-------------------------------------");
        console.log(`${columnHeaders[col]}`)

        for (j=3; j<lines.length; j++) {
            var colData = lines[j].split(',');
            if (colData[col]) {
                process.stdout.write(`${j}|${colData[col]} \t`);
            }
        }

        console.log("")
        console.log("")
    }
});
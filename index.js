#!/usr/bin/env node

// An outside script will pull the latest file from the board and convert it to a .csv file
// This script will search the columns for the specified query and will print those columns

// form:
//  https://stackoverflow.com/questions/1880198/how-to-execute-shell-command-in-javascript
var execSync = require('child_process').execSync;

var program = require('commander'); // npm install --save commander
program
   .arguments('<search>') // <> - required, [] - optional
   .option('-f, --file <file>', 'File to parse, default is ~/bin/dlog/latest.csv')
   .option('-u, --update', 'Update the latest.csv file')
   .option('-o, --out-file <file>', 'prints to a file')
   .option('-q, --quiet', 'suppress output')
   .action(function (search) {
        query = search;
   }).on('--help', function (){
        console.log('');
        console.log('Example usage:');
        console.log('  filterPeriodicData "commandedRpm"');
        console.log('');
        console.log('  Will find all the columns refering to commandedRpm, (S|C|CMD):DrawPump and ACPump, etc.');
        console.log('  And will print out all the values in those columns in the format of [line number]|[value].');
        console.log('');
        console.log('Example out from: filterPeriodicData cmd:drawpump.commandrpm');
        console.log('  CMD:DrawPump.commandedRpm');
        console.log('  7462|0');
   }).parse(process.argv);

if (typeof query === 'undefined') {
    console.log('Nothing given to search for!');
    process.exit(1);
}

if (program.update) {
    console.log('Pulling over latest DLog...')
    execSync('~/bin/grabLatest.sh', { encoding: 'utf-8'}); // the default is 'buffer'
}

var target = `/home/tamausb/bin/dlog/latest.csv`
if (program.file) {
    target = program.file;
}

const fs = require('fs');

const fileStream = fs.createReadStream(target);
const readline = require('readline');
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

var lines = [];
var columnHeaders = [];
var columnNumbs = [];
var gotHeaders = false;
rl.on('line', (line) => {

    if (gotHeaders == false) {
        gotHeaders = true;

        // Collect column numbers
        var i;
        columnHeaders = line.split(',');
        for (i=0; i<columnHeaders.length; i++) {
            if (columnHeaders[i].search(new RegExp(query, "i")) != -1) {
                columnNumbs.push(i);
            }
        }

    } else if (line.search(new RegExp("---PERIODIC LOG-----")) != -1) {
        // Only go through the lines with the kind of data we are looking for
        lines.push( line );
    }

}).on('close', () => {
    var i,j;
    var output = '';
    output += `Searching for ${query}\n`;
    output += '\n';
    output += 'Printing Column header followed by the line number for the entry and its value\n';

    // Don't need this because things are already in order.
    // sortLines();

    var data = {};
    for (i=0; i<columnNumbs.length; i++) {
        var col = columnNumbs[i];
        if (typeof program.quiet === 'undefined') {
            output += '-------------------------------------\n';
            output += `${columnHeaders[col]}\n`;
        }

       // Output to the terminal
        for (j=0; j<lines.length; j++) {
            var colData = lines[j].split(',');
            if (colData[col]) {
                if (typeof program.quiet === 'undefined') {
                   // 0 - count
                   // 1 - time
                    output += `${colData[0]}|${colData[1]}|${colData[col]}\t`; // `lines` WILL have a different count between the 2 scripts
                }

                // for outputing to a file
                if (!(j in data)) {
                    data[j] = [];
                }
                data[j].push( col );
            }
        }

        output += '\n';
        output += '\n';
    }

    if ( typeof program.quiet === 'undefined') {
        console.log(output);
    }

    if (program.outFile) {
        output = '';
        output = "Count,Time,";
        for (i=0; i<columnNumbs.length; i++) {
            var col = columnNumbs[i];
            output += columnHeaders[col] + ",";
        }
        output += "\n";

        for (const [row, values] of Object.entries(data)) {
            var colData = lines[row].split(',');
            output += colData[0] + "," + colData[1] + ",";

            for (i=0; i<columnNumbs.length; i++) {
                var col = columnNumbs[i];
                if (values.includes(col)) {
                    output += colData[col];
                }
                output += ",";
            }
            output += "\n";
        }

        fs.writeFileSync(program.outFile, output);
    }
});

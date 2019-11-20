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
   .option('-o, --out-file <file>', 'prints to a file !! not yet implemented !!')
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
rl.on('line', (line) => {
    lines.push( line );
}).on('close', () => {
    columnHeaders = lines[0].split(',');
    var i,j,k;
    if (typeof program.quiet === 'undefined') {
        console.log(`Searching for ${query}`)
    }

    // Collect column numbers
    for (i=0; i<columnHeaders.length; i++) {
        if (columnHeaders[i].search(new RegExp(query, "i")) != -1) {
            columnNumbs.push(i);
            // console.log(`${columnHeaders[i]} at ${i}`);
        }
    }

    if (typeof program.quiet === 'undefined') {
        console.log("")
        console.log("Printing Column header followed by the line number for the entry and its value")
    }

    var data = {};
    for (i=0; i<columnNumbs.length; i++) {
        var col = columnNumbs[i];
        if (typeof program.quiet === 'undefined') {
            console.log("-------------------------------------");
            console.log(`${columnHeaders[col]}`)
        }

        if ( i == 0 ) {
            data[0] = [columnHeaders[col]];
        } else {
            data[0].push(columnHeaders[col]);
        }

        for (j=3; j<lines.length; j++) {

            // Cells with JSON entries can contain comma's and will corrupt the expected format
            //  Just skip these lines in an attempt to avoid the problem.
            if (lines[j].search(new RegExp("json", "i")) != -1) {
                continue;
            }
            var colData = lines[j].split(',');

            if (colData[col]) {
                if (typeof program.quiet === 'undefined') {
                    // use .write to suppress the use of newlines
                    process.stdout.write(`${j}|${colData[col]} \t`);
                }
                if (!(j in data)) {
                    data[j] = [];
                }
                data[j].push( col );
            }
        }

        if (typeof program.quiet === 'undefined') {
            console.log("")
            console.log("")
        }
    }

    if (program.outFile) {
        var output = "Count,Time,";
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
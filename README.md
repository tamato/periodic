# Rquired packages
- commander, install with `npm install --save commander`

# To install on your system, so that the command name in the 'bin' section of the package.json can be used anywhere
sudo npm install -g

## set up a soft link to your local files so that the system always uses your latest changes
sudo npm link

# Assumptions
The directory ~/bin/dlog exists; for storing latest.csv used by this script and grabLatest.sh
The script ~/bin/grabLatest.sh exists

## Contents of grabLatest.sh
```
#!/usr/bin/env bash

board=root@<ip>

# get the name of latest dlog
dlog=$(ssh ${board} "ls -t /data/log | head -1")

# copy it over
scp ${board}:/data/log/${dlog} ~/logs

# convert
dlogparser ~/logs/${dlog} ~/logs

# make a copy for easy access
cp -f ~/logs/${dlog}.csv ~/bin/dlog/latest.csv
echo "Latest DLog file: ${dlog}"
```

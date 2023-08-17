#!/usr/bin/bash


## source for ENV
source /local/htdocs/materialsmatter/Materials-Matter-App/.env

## DEBUG
### echo $googleClientId

## Start the node server
cd  /local/htdocs/materialsmatter/Materials-Matter-App
nohup /bin/node dist/server.js &

exit;

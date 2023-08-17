#!/bin/bash

ps -ef | egrep node | egrep -v grep
sleep 1
ps -ef | egrep node | egrep -v grep | awk '{print "kill -9 "$2}'
ps -ef | egrep node | egrep -v grep | awk '{print "kill -9 "$2}' |sh
sleep 5
ps -ef | egrep node | egrep -v grep
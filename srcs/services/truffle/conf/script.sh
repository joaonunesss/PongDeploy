#!/bin/bash

ping_ganache()
{
	nc -zv ganache 8545
	return $?
}

start_time=$(date +%s)
end_time=$((start_time + 20))

while [ $(date +%s) -lt $end_time ]; do
	ping_ganache
	if [ $? -eq 0 ]; then
		echo "Exit code from NETCAT $?";
		echo "ganache is running"
		break;
	else
		echo "Exit code from NETCAT $?";
		echo "waiting for ganache to start"
		sleep 2
	fi
done

if [ $(date +%s) -ge $end_time ]; then
	echo "ganache is not responding"
	exit 1
fi

#truffle migrate --reset --network development

if [ ! -f /app/blockchain_volume/.migrated ]; then
  truffle migrate --network development
  touch /app/blockchain_volume/.migrated
fi

if [ $? -ne 0 ]; then
	echo "Migration failed"
	exit 1
fi

cp build/contracts/TournamentScore.json /app/blockchain_volume/TournamentScore.json

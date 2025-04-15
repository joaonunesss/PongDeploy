#!/bin/bash

#sleep 5

ping_db()
{
	nc -zv db 5432
	return $?
}

start_time=$(date +%s)
end_time=$((start_time + 20))

while [ $(date +%s) -lt $end_time ]; do
	ping_db
	if [ $? -eq 0 ]; then
		echo "Exit code from NETCAT $?";
		echo "db is running"
		break;
	else
		echo "Exit code from NETCAT $?";
		echo "waiting for db to start";
		sleep 2
	fi
done

if [ $(date +%s) -ge $end_time ]; then
	echo "db is not responding"
	exit 1
fi

service redis-server start

python3 manage.py makemigrations

python3 manage.py migrate --no-input

python3 manage.py shell -c "
from django.contrib.auth.models import User;
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'dontneed@example.com', '1234');
    print('Created superuser: login->admin pass->1234')"


exec python3 manage.py runserver 0.0.0.0:8000

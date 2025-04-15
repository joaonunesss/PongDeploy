FROM debian:11


RUN apt-get update && apt-get install -y --no-install-recommends \
	python3 \
	python3-pip \
	python3-venv \
    redis-server \
	build-essential \
	libpq-dev \
	curl \
	netcat \
	&& apt-get clean && rm -rf /var/lib/apt/lists/*

# FOR BLOCKCHAIN
RUN pip install web3

WORKDIR /app

COPY ./conf/requirements.txt /app/

RUN pip3 install --no-cache-dir -r requirements.txt

#COPY ./conf/ponggame /app/

EXPOSE 8000

COPY ./conf/setup.sh /setup.sh

RUN chmod +x /setup.sh

# Create necessary log directory
# RUN mkdir -p /var/log/my_app
# RUN mkdir -p /app/logs/

#CMD service redis-server start && python3 manage.py runserver 0.0.0.0:8000
ENTRYPOINT [ "/setup.sh" ]


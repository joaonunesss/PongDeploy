FROM debian:11

RUN apt-get update && \
	apt-get install -y --no-install-recommends nginx openssl && \
	apt-get clean && rm -rf /var/lib/apt/lists/*

#RUN apt-get upgrade

#RUN apt-get clean

#RUN apt-get install -y --no-install-recommends nginx openssl

#RUN apt-get clean

RUN mkdir -p /etc/nginx/ssl && \
	openssl req -x509 -nodes \
		-newkey rsa:2048 \
		-keyout /etc/nginx/ssl/transcendence.key \
		-out /etc/nginx/ssl/transcendence.crt \
		-days 365 \
		-subj "/C=${COUNTRY}/ST=${STATE}/L=${LOCALITY}/O=${ORGANIZATION}/OU=${ORGANIZATION}/UID=${NAME}"


#RUN openssl req -x509 -nodes -out /etc/nginx/ssl/transcendence.crt \
#		-keyout /etc/nginx/ssl/transcendence.key \
#		-subj "/C=${COUNTRY}/ST=${STATE}/L=${LOCALITY}/O=${ORGANIZATION}/OU=${ORGANIZATION}/UID=${NAME}"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]

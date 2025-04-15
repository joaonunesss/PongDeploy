#FROM debian:11
FROM node:18-bullseye

RUN apt-get update && apt-get install -y curl netcat \
	#&& curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
	#&& apt-get install -y nodejs \
	&& npm install -g truffle web3 \
	&& mkdir -p /etc/truffle \
	&& apt-get clean && rm -rf /var/lib/apt/lists/*

#RUN npm install -g truffle web3

#RUN mkdir -p /etc/truffle

WORKDIR /etc/truffle

RUN truffle init

COPY ./conf/truffle-config.js /etc/truffle/truffle-config.js

COPY ./conf/2_deploy_contracts.js /etc/truffle/migrations/2_deploy_contracts.js

COPY ./conf/smartcontract.sol /etc/truffle/contracts/smartcontract.sol

COPY ./conf/script.sh /script.sh

RUN chmod +x /script.sh

RUN truffle compile

ENTRYPOINT [ "/script.sh" ]

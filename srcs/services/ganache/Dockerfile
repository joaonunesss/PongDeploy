#FROM debian:11
FROM node:18-bullseye

RUN apt-get update && apt-get install -y curl \
	#&& curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
	#&& apt-get install -y nodejs \
	&& npm install -g ganache \
	&& mkdir -p /etc/truffle \
	&& chmod 755 /etc/truffle \
	&& apt-get clean && rm -rf /var/lib/apt/lists/*

#RUN npm install -g ganache

#RUN mkdir -p /etc/truffle

#RUN chmod 755 /etc/truffle

EXPOSE 8545

WORKDIR /app

#CMD ["ganache", "--host", "0.0.0.0", "--port", "8545", "--networkId", "5777"]
CMD ["ganache", "--host", "0.0.0.0", "--port", "8545", "--networkId", "5777",\
"--chain.chainId", "5777", "--database.dbPath", "/ganache_data", "--wallet.mnemonic", "ft_transcendence"]

# 	Here we install the NodeSource Node.js on the system.

# 	We use the curl to download the data from the repo.

# -f: Fail silently if the HTTP request fails
# -s: Silent mode, suppresses progress output
# -S: Shows error messages if the request fails.
# -L: Fillows HTTP redirects

# 	The URL https://deb.nodesource.com/setup_16.x add the
# Node.js 16.x repo in the system. The output of the
# link is a script that is passed to bash to execute it.

# 	This script detects the OS, add the NodeSource to the
# system's package manager and imports NodeSource GPG key
# for package verification.

# 	Then we install nodejs, because GANACHE is a Node.js
# application, without Node.js you cannot run or use GANACHE.

# 	After that we use Node.js package manager NPM to
# install GANACHE.

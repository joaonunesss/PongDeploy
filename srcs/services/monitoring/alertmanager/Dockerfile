FROM alpine:3.17

# Install required packages: wget, tar, gettext (for envsubst)
RUN apk add --no-cache wget tar gettext

# Set the Alertmanager version (adjust as needed)
ENV ALERTMANAGER_VERSION=0.24.0

# Download and install Alertmanager
RUN wget https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz \
    && tar -xzf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz \
    && mv alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager /bin/alertmanager \
    && chmod +x /bin/alertmanager \
    && rm -rf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64*

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["envsubst < /tmp/alertmanager.yml.template > /etc/alertmanager.yml && /bin/alertmanager --config.file=/etc/alertmanager.yml"]

FROM debian:buster

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl wget nano less ncat dnsutils procps \
    build-essential \
    openjdk-11-jre \
    ruby ruby-dev \
    python2.7

#gem update --system && \
RUN gem install compass

# Adds nodejs 10 repository
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get update && apt-get install -y --no-install-recommends \
      nodejs

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY .docker/entrypoint.sh /

EXPOSE 8443
ENTRYPOINT ["/entrypoint.sh"]

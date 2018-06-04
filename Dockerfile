FROM grafana/grafana:5.0.3

RUN apt-get update \
    && apt-get upgrade -y \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get install -y nodejs

# Bundle app source
COPY . /tmp/grafana-amlight-app-sdnlg

# Change WORKDIR to install the NPM dependencies
WORKDIR /tmp/grafana-amlight-app-sdnlg

# Install all the dependencies
RUN npm install

# Install the grunt client
RUN npm install -g grunt-cli

# Compile the javascript
RUN grunt

# Prepare the directory to receive the plug
ENV GF_PATHS_PLUGINS=/data/grafana/plugins
RUN mkdir -p $GF_PATHS_PLUGINS && chown -R grafana:grafana $GF_PATHS_PLUGINS

RUN mkdir -p /data/grafana/plugins/grafana-amlight-app-sdnlg/dist
RUN cp -a /tmp/grafana-amlight-app-sdnlg/dist/* /data/grafana/plugins/grafana-amlight-app-sdnlg/dist


# Run this docker images with the command:
# docker run -d -p 3000:3000 amlight/grafana_app:test -e "GF_PATHS_PLUGINS=/data/grafana/plugins"


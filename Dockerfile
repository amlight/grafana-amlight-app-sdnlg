FROM grafana/grafana:5.2.0

USER root
RUN apt-get update \
    && apt-get install -y gnupg \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get install -y nodejs

RUN npm i npm@latest -g

# Install the grunt client
RUN npm install -g grunt-cli

# Bundle app source
COPY . /tmp/grafana-amlight-app-sdnlg

# Change WORKDIR to install the NPM dependencies
WORKDIR /tmp/grafana-amlight-app-sdnlg

# Install all the dependencies
RUN npm install

# Compile the javascript
RUN grunt

# Prepare the directory to receive the plug
ENV GF_PATHS_PLUGINS=/data/grafana/plugins
RUN mkdir -p $GF_PATHS_PLUGINS && chown -R grafana:grafana $GF_PATHS_PLUGINS

RUN mkdir -p /data/grafana/plugins/grafana-amlight-app-sdnlg/dist
RUN cp -a /tmp/grafana-amlight-app-sdnlg/dist/* /data/grafana/plugins/grafana-amlight-app-sdnlg/dist


# Start your container binding the external port 3000.
#   docker run -d -p 3000:3000 amlight/grafana_app:test -e "GF_PATHS_PLUGINS=/data/grafana/plugins"
#
# Try it out, default admin user is admin/admin.


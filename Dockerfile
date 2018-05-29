FROM grafana/grafana:5.0.3

# TODO fix..
RUN apt-get update && apt-get install -y nodejs
RUN mkdir -p /var/lib/grafana/plugins/grafana-amlight-app-sdnlg/dist
COPY .grafana-amlight-app-sdnlg /var/lib/grafana/plugins/grafana-amlight-app-sdnlg

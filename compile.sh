#!/bin/bash
set -x

clear
echo "Running grunt..."
grunt
echo "...End grunt"
echo " "

echo "Copying files to /var/lib/grafana/ ..."
sudo rm -rf /var/lib/grafana/plugins/grafana-amlight-app-sdnlg/dist/
sudo cp -a dist/ /var/lib/grafana/plugins/grafana-amlight-app-sdnlg/
echo "...End copying"
echo " "

echo "Restarting grafana-server service..."
sudo service grafana-server stop
sudo service grafana-server start
echo "...End restart"


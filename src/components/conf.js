var SDNLG_CONF = {
    header_logo_img_src: '/static/img/amlight.png',
    version: 0.2,
    dict: {

    },
    about_roadmap: "<h4>Roadmap</h4>"+
                   "<li>New Features...</li>",

    // kytos server
    rest_server: "http://127.0.0.1:8181",
    trace_server: "http://127.0.0.1:8181",

    sniffer_dashboard: "http://190.103.186.42:3000/dashboard/snapshot/pXxCEE6Drk96CFg25vCMgSQI63h08LN3"
}

SDNLG_CONF.api_stats = SDNLG_CONF.rest_server + "/api/kytos/of_stats/v1/";
SDNLG_CONF.api_topology = SDNLG_CONF.rest_server + "/api/kytos/topology/v3";

SDNLG_CONF.api_trace = SDNLG_CONF.trace_server + "/api/amlight/sdntrace/trace";
SDNLG_CONF.api_trace_cp = SDNLG_CONF.trace_server + "/api/amlight/sdntrace_cp/trace";


export {
  SDNLG_CONF as SDNLG_CONF
};

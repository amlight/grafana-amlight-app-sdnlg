/**
 * SDN LG Grafana API configuration.
  */
class SDNLG_CONF {
    constructor() {
        this.rest_server = "http://localhost:1234";

        this.header_logo_img_src = '/static/img/amlight.png';
        this.version = 0.2;
        this.dict = {};
    }

    /** To be used with Kytos and grafana */
    setKytosServer(server) {
        this.rest_server = server;
    }

    getKytosServer() {
        return this.rest_server;
    }

    api_stats(){
        return this.rest_server + "/api/kytos/of_stats/v1/"
    }

    api_topology(){
        return this.rest_server + "/api/kytos/topology/v3"
    }

    api_trace(){
        return this.rest_server + "/api/amlight/sdntrace/trace"
    }

    api_trace_cp(){
        return this.rest_server + "/api/amlight/sdntrace_cp/trace"
    }

    // kytos server
//    this.api_stats = getKytosServer() + "/api/kytos/of_stats/v1/";
//    this.api_topology = getKytosServer() + "/api/kytos/topology/v3";
//
//    this.api_trace = getKytosServer() + "/api/amlight/sdntrace/trace";
//    this.api_trace_cp = getKytosServer() + "/api/amlight/sdntrace_cp/trace";

}

const _SDNLG_CONF = new SDNLG_CONF();

export {
  _SDNLG_CONF as SDNLG_CONF
};

const SDNLG_CONF = function() {
    var _self = this;
    this.rest_server = "http://localhost:1234";

    this.header_logo_img_src = '/static/img/amlight.png';
    this.version = 0.2;
    this.dict = {};

    /** To be used with Kytos and grafana */
    this.setKytosServer = function(server) {
        _self.rest_server = server;
    }
    this.getKytosServer = function() {
        return _self.rest_server;
    }

    this.api_stats = function(){ return _self.rest_server + "/api/kytos/of_stats/v1/" };
    this.api_topology = function(){ return _self.rest_server + "/api/kytos/topology/v3" };

    this.api_trace = function(){ return _self.rest_server + "/api/amlight/sdntrace/trace" };
    this.api_trace_cp = function(){ return _self.rest_server + "/api/amlight/sdntrace_cp/trace" };


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

import {SDNLG_CONF} from "./conf";
import {removeEmptyJsonValues} from "./util";
import {sdntopology, sdncolor, forcegraph, d3lib} from "./main";

/* global forcegraph, MOCK, SDNLG_CONF, d3lib */

/** @constant */
const REST_TRACE_TYPE = {'STARTING':'starting', 'LAST':'last', 'TRACE':'trace', 'INTERTRACE':'intertrace'};
/** @constant */
const REST_TRACE_REASON = {'ERROR':'error', 'DONE':'done', 'LOOP':'loop'};

var SDNTraceForm = function() {
    var _self = this;
    var _elem = null;

    /**
    Initialize form binds.
    Parameter: parent element
    */
    this._init = function(elem) {
        _elem = elem;

        _elem.find('#sdn_trace_form_btn_new').on("click", function() {
          _self.show();
          _self.hideInfo();
          $('#sdn_trace_form_btn_close').show();
          $('#sdn_trace_form_btn_new').hide();
        });

        _elem.find('#sdn_trace_form_btn_close').on("click", function() {
          _self.hide();
          $('#sdn_trace_form_btn_close').hide();
          $('#sdn_trace_form_btn_new').show();
        });
    };

    this.clear = function() {
    };

    this.show = function() {
        $('#sdn_trace_form_include_form').show();
        $('#sdn_trace_form_btn_close').show();
        $('#sdn_trace_form_btn_new').hide();

        // Stopping any ongoing trace.
        sdntrace.traceStop();
        sdntrace.traceReset();
        // Hide trace info
        _self.hideInfo();
    };
    this.hide = function() {
        $('#sdn_trace_form_include_form').hide();
        $('#sdn_trace_form_btn_close').hide();
        $('#sdn_trace_form_btn_new').show();
    };

    this.showInfo = function() {
        $('#sdn_trace_form_include_info').show();
        _self.hide();
    };
    this.hideInfo = function() {
        $('#sdn_trace_form_include_info').hide();
    };

    this.showIconTimer = function() {
        console.log('showIconTimer');
        $('#sdn_trace_panel .loading-icon-div').show();
    };
    this.hideIconTimer = function() {
        console.log('hideIconTimer');
        $('#sdn_trace_panel .loading-icon-div').hide();
    };



}


var SDNTraceUtil = function() {
    this.tracePanelHtml = function(jsonObj) {
        /**
        * Render trace result html info.
        */
        var htmlContent = "";
        htmlContent += "<div class='gf-form'>";
        htmlContent += "<div class='gf-form-label width-25'>";
        htmlContent += "<strong>Start from:</strong>";
        if(jsonObj.result) {
            // FIXME workaround for multiple starting type
            var _flag_multiple_starting_counter = 0;
            for (var i = 0, len = jsonObj.result.length; i < len; i++) {
                if (jsonObj.result[i].type === REST_TRACE_TYPE.STARTING && (_flag_multiple_starting_counter === 0)) {
                    htmlContent += "<span> <strong>DPID:</strong> ";
                    htmlContent += jsonObj.result[i].dpid;
                    htmlContent += "</span><span> <strong>Port:</strong>";
                    htmlContent += jsonObj.result[i].port;
                    htmlContent += "</span>";

                    _flag_multiple_starting_counter++;
                }
            }
        } else {
            htmlContent += " <span>---</span>";
        }

        htmlContent += "</div>";
        htmlContent += "</div>";

        htmlContent += "<div class='gf-form'><div class='gf-form-label width-25'>";
        htmlContent += "<strong>Start time: </strong>" + (jsonObj.start_time || "---");
        htmlContent += "</div></div>";

        htmlContent += "<div class='gf-form'><div class='gf-form-label width-25'>";
        htmlContent += "<strong>Total time: </strong>" + (jsonObj.total_time || "---");
        htmlContent += "</div></div>";
        if(jsonObj.result) {
            htmlContent += "<hr>";
            htmlContent += "<div class='col-sm-12'>";
            htmlContent += "<table class='table grafana-options-table'>";
            htmlContent += "<thead><tr><th></th><th>Switch/DPID</th><th>Incoming Port</th><th>Time</th></tr></thead>";
            htmlContent += "<tbody>";

            var _flag_multiple_starting_counter = 0;
            for (var i = 0, len = jsonObj.result.length; i < len; i++) {

                // FIXME: workaround for multiple starting type
                if (jsonObj.result[i].type !== REST_TRACE_TYPE.STARTING || (jsonObj.result[i].type === REST_TRACE_TYPE.STARTING && _flag_multiple_starting_counter > 0)) {
                    htmlContent += "<tr data-type="+ jsonObj.result[i].type +">";
                    htmlContent += "<td>" + (i) + "</td>";
                }

                // FIXME: workaround for multiple starting type
                if (jsonObj.result[i].type === REST_TRACE_TYPE.STARTING && (_flag_multiple_starting_counter === 0)) {
                    _flag_multiple_starting_counter = _flag_multiple_starting_counter + 1;
                // FIXME: workaround for multiple starting type
                } else if ((jsonObj.result[i].type === REST_TRACE_TYPE.STARTING && _flag_multiple_starting_counter > 0) || jsonObj.result[i].type === REST_TRACE_TYPE.TRACE) {
                    htmlContent += "<td>" + jsonObj.result[i].dpid + "</td>";
                    htmlContent += "<td>" + jsonObj.result[i].port + "</td>";
                    htmlContent += "<td>" + jsonObj.result[i].time + "</td>";
                } else if (jsonObj.result[i].type === REST_TRACE_TYPE.INTERTRACE) {
                    htmlContent += "<td colspan='3'><strong>Interdomain: " + jsonObj.result[i].domain + "</strong></td>";
                } else if (jsonObj.result[i].type === REST_TRACE_TYPE.LAST) {
                    htmlContent += "<td colspan='3'>";
                    if (jsonObj.result[i].reason === REST_TRACE_REASON.ERROR) {
                        htmlContent += "<span class='trace_result_item_error'>Error: ";
                        htmlContent += jsonObj.result[i].msg || "";
                        htmlContent += "</span>";
                    } else if (jsonObj.result[i].reason === REST_TRACE_REASON.DONE) {
                        htmlContent += "<span class='trace_result_item_done'>Trace completed. ";
                        if (jsonObj.result[i].msg !== 'none') {
                            htmlContent += jsonObj.result[i].msg || "";
                        }
                        htmlContent += "</span>";
                    } else if (jsonObj.result[i].reason === REST_TRACE_REASON.LOOP) {
                        htmlContent += "<span class='trace_result_item_loop'>Trace completed with loop. ";
                        htmlContent += jsonObj.result[i].msg || "";
                        htmlContent += "</span>";
                    }
                    htmlContent += "</td>";
                } else if (jsonObj.result[i].type === REST_TRACE_TYPE.ERROR) {
                    htmlContent += "<td colspan='3'>" + jsonObj.result[i].message + "</td>";
                }
                htmlContent += "</tr>";
            }

            htmlContent += "</tbody></table></div>";
        }
        htmlContent += "</div>";

        return htmlContent;
    };
};


var SDNTrace = function() {

    var _self = this;

    // last trace id executing
    this.lastTraceID = "";


    this.clearTraceInterface = function() {
        /**
        * Clear trace forms, result, result pannel, dialog modal, graph highlight, graph trace
        */
        $('#trace-result-content').html('');
        sdntraceform.hideInfo();

        // clear d3 graph highlight nodes, links
        forcegraph.endHighlight();

        // clear d3 graph trace classes
        $("path").removeClass("node-trace-active");
        $("line").removeClass("link-trace-active");
        $("line").removeClass("link-trace-cp");
        $("path").each(function() {
            if ($(this).attr("data-nodeid")) {
            }
        });

        // close trace form
        sdntraceform.hide();
        sdntraceform.hideInfo();
    };

    this.highlightPath = function(selector) {
        /**
        * Highlight path. Receive selector var.
        */
        $(selector).addClass("new-link link-trace-active");
    };

    this.callTraceRequestId = function(json_data) {
        /**
         * Call ajax to trace.
         * Param:
         *    json_data: Data in json String format to send as PUT method.
         */

        _self.clearTraceInterface();

        sdntraceform.showInfo();
        sdntraceform.showIconTimer();


        var ajaxDone = function(json) {
            // Stopping any ongoing trace.
            _self.traceStop();
            _self.traceReset();

            // Trigger AJAX to retrieve the trace result
            _self.triggerTraceListener(json.result.trace_id);
        };

        // AJAX call
        $.ajax({
            url: SDNLG_CONF.api_trace,
            type: 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: json_data
        })
        .done(function(json) {
            ajaxDone(json);
        })
        .fail(function(responseObj) {
            if (responseObj.responseJSON) {
                $('#trace-result-content').html("<div class='bg-danger'>"+responseObj.responseJSON.error+"</div>");
            } else {
                $('#trace-result-content').html("<div class='bg-danger'>Trace error.</div>");
            }
            _self.traceStop();
            console.warn("call_trace_request_id ajax error" );
        })
        .always(function() {
            $('#trace_panel_info').show();
        });
    };

    this.renderHtmlTraceFormSelectedSwitch = function(p_dpid, p_label) {
        $('#sdn_trace_form__switch-content > select').val(p_dpid);
        $('#sdn_trace_form__switch-content > select').trigger('change');

        $('#sdn_trace_form__switch-hidden').val(p_dpid);
    };

    this.renderHtmlTraceFormPorts = function(dpid, port_data) {
        /**
        Callback to be used with the AJAX that retrieve switch ports.
        */
    };

    /**
     * Build json string from form fields to send to trace layer 2 ajax.
     */
    this.buildTraceLayer2JSON = function() {
        var layer2 = new Object();
        layer2.trace = {};

        let _switch = {};
        _switch.dpid = $('#sdn_trace_form__switch-hidden').val();
        _switch.in_port = $('#sdn_trace_form__switch-port-hidden').val();
        if (_switch.in_port) {
            _switch.in_port = parseInt(_switch.in_port, 10);
        }
        layer2.trace.switch = _switch;

        let _eth = {};
        _eth.dl_src = $('#l2_dl_src').val();
        _eth.dl_dst = $('#l2_dl_dst').val();
        _eth.dl_vlan = $('#l2_dl_vlan').val();
        if (_eth.dl_vlan) {
            _eth.dl_vlan = parseInt(_eth.dl_vlan, 10);
        }
        _eth.dl_type = $('#l2_dl_type').val();
        if (_eth.dl_type) {
            _eth.dl_type = parseInt(_eth.dl_type, 10);
        }
        layer2.trace.eth = _eth;

        layer2 = removeEmptyJsonValues(layer2);
        var layer2String = JSON.stringify(layer2);

        return layer2String;
    };

    /**
     * Build json string from form fields to send to trace layer 3 ajax.
     */
    this._build_trace_layer3_json = function() {
        var layer3 = new Object();
        layer3.trace = {};

        let _switch = {};
        _switch.dpid = $('#sdn_trace_form__switch-hidden').val();
        _switch.in_port = $('#sdn_trace_form__switch-port-hidden').val();
        if (_switch.in_port) {
            _switch.in_port = parseInt(_switch.in_port, 10);
        }
        layer3.trace.switch = _switch;
        

        let _eth = {};
        _eth.dl_vlan = $('#l3_dl_vlan').val();
        if (_eth.dl_vlan) {
            _eth.dl_vlan = parseInt(_eth.dl_vlan, 10);
        }
        layer3.trace.eth = _eth;

        let _ip = {};
        _ip.nw_src = $('#l3_nw_src').val();
        _ip.nw_dst = $('#l3_nw_dst').val();
        _ip.nw_tos = $('#l3_nw_tos').val();
        if (_ip.nw_tos) {
            _ip.nw_tos = parseInt(_ip.nw_tos, 10);
        }
        layer3.trace.ip = _ip;

        let _tp = {};
        _tp.tp_src = $('#l3_tp_src').val();
        _tp.tp_dst = $('#l3_tp_dst').val();
        if (_tp.tp_dst) {
            _tp.tp_dst = parseInt(_tp.tp_dst, 10);
        }
        layer3.trace.tp = _tp;

        console.log(layer3);
        
        layer3 = removeEmptyJsonValues(layer3);
        var layer3String = JSON.stringify(layer3);

        return layer3String;
    };

    /**
     * Build json string from form fields to send to full trace ajax.
     */
    this._build_trace_layerfull_json = function() {
        var layerfull = new Object();
        layerfull.trace = {};

        let _switch = {};
        _switch.dpid = $('#sdn_trace_form__switch-hidden').val();
        _switch.in_port = $('#sdn_trace_form__switch-port-hidden').val();
        if (_switch.in_port) {
            _switch.in_port = parseInt(_switch.in_port, 10);
        }
        layerfull.trace.switch = _switch;

        let _eth = {};
        _eth.dl_src = $('#lf_dl_src').val();
        _eth.dl_dst = $('#lf_dl_dst').val();
        _eth.dl_vlan = $('#lf_dl_vlan').val();
        if (_eth.dl_vlan) {
            _eth.dl_vlan = parseInt(_eth.dl_vlan, 10);
        }
        _eth.dl_type = $('#lf_dl_type').val();
        if (_eth.dl_type) {
            _eth.dl_type = parseInt(_eth.dl_type, 10);
        }
        layerfull.trace.eth = _eth;

        let _ip = {};
        _ip.nw_src = $('#lf_nw_src').val();
        _ip.nw_dst = $('#lf_nw_dst').val();
        _ip.nw_tos = $('#lf_nw_tos').val();
        if (_ip.nw_tos) {
            _ip.nw_tos = parseInt(_ip.nw_tos, 10);
        }
        layerfull.trace.ip = _ip;
        
        let _tp = {};
        _tp.tp_src = $('#lf_tp_src').val();
        _tp.tp_dst = $('#lf_tp_dst').val();
        if (_tp.tp_dst) {
            _tp.tp_dst = parseInt(_tp.tp_dst, 10);
        }
        layerfull.trace.tp = _tp;

        layerfull = removeEmptyJsonValues(layerfull);
        var layerfullString = JSON.stringify(layerfull);

        return layerfullString;
    };
    

    var _flagCallTraceListenerAgain = true;
    // Timeout flag to stop the trace listener
    var _threadTraceListener = "";
    // Time to trigger the next call in ms
    var _traceTimerTriggerCall = 1000;
    // Total time to trigger the call. After that trigger timeout method.
    var _traceTimerMax = 30000;

    var _traceTimerCounter = 0;

    this.triggerTraceListener = function(traceId) {
        _self.lastTraceID = traceId;

        // Clearing the trace panel
        $('#trace-result-content').html("");

        sdntraceform.showInfo();
        sdntraceform.showIconTimer();


        // Call to AJAX to retrieve the trace result
        _self.callTraceListener(traceId);
    };

    // Reset all variables to start the trace
    this.traceReset = function() {
        clearTimeout(_threadTraceListener);
        _threadTraceListener = "";
        _traceTimerCounter = 0;
        _flagCallTraceListenerAgain = true;

    };
    
    // Stop trace thread and block all variables.
    this.traceStop = function() {

        clearTimeout(_threadTraceListener);

        _threadTraceListener = "";
        _traceTimerCounter = 100000;
        _flagCallTraceListenerAgain = false;

        // hide loading icon
        sdntraceform.hideIconTimer();
    };


    this.callTraceListener = function(traceId) {
        var htmlRender = function(jsonObj) {
            /**
            * Render trace result html info.
            */
            var htmlContent = "";
            htmlContent += sdntraceutil.tracePanelHtml(jsonObj);

            $('#trace-result-content').html(htmlContent);
            sdntraceform.hide();
        };

        var _addNewHtmlNode = function(_id) {
            /**
            Add html data selector after add a new node
            */
            var html_selector = "#node-" + _id;
            $(html_selector).addClass("new-node node-trace-active");
            $(html_selector).attr("data-nodeid", _id);
        };

        var _addNewHtmlLink = function(_idFrom, _idTo) {
            /**
            Add html data selector after add a new link
            */
            var html_selector = "#link-" + _idFrom +"-"+ _idTo;
            _self.highlightPath(html_selector);

            $(html_selector).attr("data-linkid", _idFrom +"-"+ _idTo);
        };

        var ajaxDone = function(jsonObj) {
            if (jsonObj && jsonObj === "0") {
                return;
            }

            try {
                if (jsonObj.result && jsonObj.result.length > 0) {
                    var flag_has_domain = false;
                    // temporary var to last node
                    var last_node_id = null;
                    // temporary var to last interdomain
                    var last_domain_id = null;

                    for (var i = 0, len = jsonObj.result.length; i < len; i++) {
                        var result_item = jsonObj.result[i];
                        var _id = null;

//                        if (result_item.hasOwnProperty("domain")) {
//                            // Add new domain node
//                            _label = result_item.domain;
//                            // add node data do d3
//                            var node_domain = d3lib.addNewNodeDomain(result_item.domain, _label);
//                            _id = node_domain.id;
//                            // add html data
//                            _addNewHtmlNode(_id);
//
//                            // Add new link
//                            d3lib.addNewLink(last_node_id, _id);
//                            _addNewHtmlLink(last_node_id, _id);
//
//                            flag_has_domain = true;
//                            last_domain_id = _id;
//                        }
//                        if (result_item.hasOwnProperty("dpid")) {
//                            _id = result_item.dpid;
//                            if (flag_has_domain) {
//                                // Add new switch node related to new domain
//                                d3lib.addNewNode(_id, "", last_domain_id);
//                                _addNewHtmlNode(_id);
//
//                                // Add new link
//                                d3lib.addNewLink(last_node_id, _id);
//                                _addNewHtmlLink(last_node_id, _id);
//                            }
//                            $(document.getElementById("node-" + _id)).addClass("node-trace-active");
//                        }

                        if (i > 0 && jsonObj.result[i-1].hasOwnProperty("dpid") && jsonObj.result[i].hasOwnProperty("dpid")) {
                            // Add new link between nodes
                            var css_selector = document.getElementById("link-" + jsonObj.result[i-1].dpid +"-"+ jsonObj.result[i].dpid);
                            _self.highlightPath(css_selector);

                            // Activate the return link too

                            css_selector = document.getElementById("link-" + jsonObj.result[i].dpid +"-"+ jsonObj.result[i-1].dpid);
                            _self.highlightPath(css_selector);
                        }

                        last_node_id = _id;
                    }

                    var last_result_item = jsonObj.result[jsonObj.result.length - 1];
                    if (last_result_item.type === REST_TRACE_TYPE.LAST) {
                        // FLAG to stop the trigger loop
                        if (_self._flagCallTraceListenerAgainCounter < 12) {
                            _self._flagCallTraceListenerAgainCounter = _self._flagCallTraceListenerAgainCounter + 1;
                        } else {
                            console.log('type last');
                            // stop the interval loop
                            _self.traceStop();
                        }
                    } else if (last_result_item.type === REST_TRACE_TYPE.ERROR) {
                        console.log('type error');
                        // stop the interval loop
                        _self.traceStop();
                    }
                }
                htmlRender(jsonObj);
            } catch(err) {
                _self.traceStop();
                console.error(err);
                throw err;
            }
        };

        // counting the trace time elapsed
        _traceTimerCounter = _traceTimerCounter + _traceTimerTriggerCall;

        // Timeout. Stopping the trace.
        if(_traceTimerCounter > _traceTimerMax) {
            _self.traceStop();
        }

        // AJAX call
        $.ajax({
            url: SDNLG_CONF.api_trace + "/" + traceId + "?q=" + Math.random(),
            type: 'GET',
            dataType: 'json',
            crossdomain:true
        })
        .done(function(json) {
            ajaxDone(json);
            console.log('call_trace_listener  ajax done');
        })
        .fail(function() {
            console.warn("call_trace_listener ajax error" );
            // Stop trace
            _self.traceStop();
        })
        .always(function() {
            console.log( "call_trace_listener ajax complete" );
        });

        if (_flagCallTraceListenerAgain) {
            _threadTraceListener = setTimeout(_self.callTraceListener, _traceTimerTriggerCall, traceId);
        }
    };
 }; // SDNTrace


var SDNTraceCP = function() {
    var _self = this;


    this.highlightPath = function(selector) {
        /**
        * Highlight path. Receive selector var.
        */
        $(selector).addClass("new-link link-trace-cp");
    };


    this.callTraceRequestId = function(json_data) {
        /**
         * Call ajax to trace.
         * Param:
         *    json_data: Data in json String format to send as PUT method.
         */

        var ajaxDone = function(json) {

            // Stopping any ongoing trace.
            _self.traceStop();
            _self.traceReset();

            // Trigger AJAX to retrieve the trace result
            _self.triggerTraceListener(json.result.trace_id);
        };

        // show loading icon
        sdntraceform.hide();
        sdntraceform.showIconTimer();

        // AJAX call
        $.ajax({
            //url: "/api/amlight/sdntrace_cp/trace",
            url: SDNLG_CONF.api_trace_cp,
            type: 'PUT',
            contentType: 'application/json',
            data: json_data
        })
        .done(function(json) {
            ajaxDone(json);
        })
        .fail(function(responseObj) {
            if (responseObj.responseJSON) {
                $('#trace-result-content').html("<div class='bg-danger'>"+responseObj.responseJSON.error+"</div>");
            } else {
                $('#trace-result-content').html("<div class='bg-danger'>Trace error.</div>");
            }
            console.warn("call_trace_request_id ajax error" );
        })
        .always(function() {
            $('#trace_panel_info').show();
        });
    };



    // Timeout flag to stop the trace listener
    var _threadTraceListener = "";
    // Time to trigger the next call in ms
    var _traceTimerTriggerCall = 1000;
    // Total time to trigger the call. After that trigger timeout method.
    var _traceTimerMax = 30000;

    var _traceTimerCounter = 0;


    // Reset all variables to start the trace
    this.traceReset = function() {
        clearTimeout(_threadTraceListener);
        _threadTraceListener = "";
        _traceTimerCounter = 0;
        _flagCallTraceListenerAgain = true;
    };

    // Stop trace thread and block all variables.
    this.traceStop = function() {

        clearTimeout(_threadTraceListener);

        _threadTraceListener = "";
        _traceTimerCounter = 100000;
        _flagCallTraceListenerAgain = false;

        // hide loading icon
        sdntraceform.hideIconTimer();
    };

    var _flagCallTraceListenerAgain = true;


    this.triggerTraceListener = function(traceId) {
        // show load icon
        $('#trace_cp_panel_info').show();
        $('#sdn_trace_panel .loading-icon-div').show();

        // Clearing the trace panel
        $('#trace-result-content').html("");
//        $('#trace_cp_panel_info_collapse').collapse("hide");

        // Call to AJAX to retrieve the trace result
        _self.callTraceListener(traceId);
    };


    var _flagCallTraceListenerAgain = true;

    this.callTraceListener = function(traceId) {
        var htmlRender = function(jsonObj) {
            /**
            * Render trace result html info.
            */
            var htmlContent = "";
            htmlContent += "<div class='row'>";
            htmlContent += "</div>";
            htmlContent += sdntraceutil.tracePanelHtml(jsonObj);

            $('#trace-cp-result-content').html(htmlContent);
            $('#trace_cp_panel_info_collapse').collapse("show");
        };

        var _addNewHtmlNode = function(_id) {
            /**
            Add html data selector after add a new node
            */
            var html_selector = "#node-" + _id;
            $(html_selector).addClass("new-node node-trace-active");
            $(html_selector).attr("data-nodeid", _id);
        };

        var _addNewHtmlLink = function(_idFrom, _idTo) {
            /**
            Add html data selector after add a new link
            */
            var html_selector = "#link-CP" + _idFrom +"-"+ _idTo;
            _self.highlightPath(html_selector);
            $(html_selector).attr("data-linkid", _idFrom +"-"+ _idTo);
        };

        var ajaxDone = function(jsonObj) {
            if (jsonObj && jsonObj === "0") {
                return;
            }

            try {
                if (jsonObj.result && jsonObj.result.length > 0) {
                    var flag_has_domain = false;
                    // temporary var to last node
                    var last_node_id = null;
                    // temporary var to last interdomain
                    var last_domain_id = null;

                    for (var i = 0, len = jsonObj.result.length; i < len; i++) {
                        var result_item = jsonObj.result[i];
                        var _id = null;

                        if (result_item.hasOwnProperty("domain")) {
                            // Add new domain node
                            _label = result_item.domain;
                            // add node data do d3
                            var node_domain = d3lib.addNewNodeDomain(result_item.domain, _label);
                            _id = node_domain.id;
                            // add html data
                            _addNewHtmlNode(_id);

                            // Add new link
                            d3lib.addNewLink(last_node_id, _id);
                            _addNewHtmlLink(last_node_id, _id);

                            flag_has_domain = true;
                            last_domain_id = _id;
                        }
                        if (result_item.hasOwnProperty("dpid")) {
                            _id = result_item.dpid;

                            if (last_node_id == null) {
                                last_node_id = _id;
                            } else {
//                            if (flag_has_domain) {
//                                // Add new switch node related to new domain
//                                d3lib.addNewNode(_id, "", last_domain_id);
//                                _addNewHtmlNode(_id);

                                // Add new link
                                d3lib.addNewLink(last_node_id, _id, "CP");
                                _addNewHtmlLink(last_node_id, _id, "CP");
//                            }
                                $(document.getElementById("node-" + _id)).addClass("node-trace-active");
                            }
                        }


                        if (i > 0 && jsonObj.result[i-1].hasOwnProperty("dpid") && jsonObj.result[i].hasOwnProperty("dpid")) {
                            // Add new link between nodes
                            var css_selector = document.getElementById("link-CP" + jsonObj.result[i-1].dpid +"-"+ jsonObj.result[i].dpid);
                            _self.highlightPath(css_selector);
                            // Activate the return link too

                            css_selector = document.getElementById("link-CP" + jsonObj.result[i].dpid +"-"+ jsonObj.result[i-1].dpid);
                            _self.highlightPath(css_selector);
                        }

                        last_node_id = _id;

                        var last_result_item = jsonObj.result[jsonObj.result.length - 1];
                        if (last_result_item.type === REST_TRACE_TYPE.LAST) {
                            // FLAG to stop the trigger loop
                            if (_self._flagCallTraceListenerAgainCounter < 12) {
                                _self._flagCallTraceListenerAgainCounter = _self._flagCallTraceListenerAgainCounter + 1;
                            } else {
                                console.log('type last');
                                // stop the interval loop
                                _self.traceStop();
                            }
                        } else if (last_result_item.type === REST_TRACE_TYPE.ERROR) {
                            console.log('type error');
                            // stop the interval loop
                            _self.traceStop();
                        }

                    }

                }
                htmlRender(jsonObj);
            } catch(err) {
                console.error(err);
                _self.traceStop();
                throw err;
            }
        };


        // counting the trace time elapsed
        _traceTimerCounter = _traceTimerCounter + _traceTimerTriggerCall;

        // Timeout. Stopping the trace.
        if(_traceTimerCounter > _traceTimerMax) {
            _self.traceStop();
        }


        // AJAX call
        $.ajax({
            url: SDNLG_CONF.api_trace_cp + "/" + traceId + "?t=CP&q=" + Math.random(),
            type: 'GET',
            dataType: 'json',
            crossdomain:true
        })
        .done(function(json) {
            ajaxDone(json);
            console.log('SDNTrace Control plane call_trace_listener  ajax done');
        })
        .fail(function() {
            console.warn("SDNTrace Control plane call_trace_listener ajax error" );
            _self.traceStop();
        })
        .always(function() {
            console.log( "SDNTrace Control plane call_trace_listener ajax complete" );

            $('#sdn_trace_panel .loading-icon-div').hide();
        });

        if (_flagCallTraceListenerAgain) {
            _threadTraceListener = setTimeout(_self.callTraceListener, _traceTimerTriggerCall, traceId);
        }
    };
 }; // SDNTrace Control plane



const sdntraceutil = new SDNTraceUtil();
const sdntrace = new SDNTrace();
const sdntracecp = new SDNTraceCP();
const sdntraceform = new SDNTraceForm();

// reference to the trace form dialog
var sdn_trace_form_dialog = '';


export {
  sdntraceutil as sdntraceutil,
  sdntrace as sdntrace,
  sdntracecp as sdntracecp,
  sdntraceform as sdntraceform
};

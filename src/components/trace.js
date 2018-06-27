import {SDNLG_CONF} from "./conf";
import {removeEmptyJsonValues, injectStyles} from "./util";
import {forcegraph, d3lib, sdncolor} from "./main";

/* global forcegraph, MOCK, SDNLG_CONF, d3lib */

/** @constant */
const REST_TRACE_TYPE = {'STARTING':'starting', 'LAST':'last', 'TRACE':'trace', 'INTERTRACE':'intertrace'};
/** @constant */
const REST_TRACE_REASON = {'ERROR':'error', 'DONE':'done', 'LOOP':'loop'};

let SDNTraceForm = function() {
    let _self = this;
    let _elem = null;

    /**
    Initialize form binds.
    Parameter: parent element
    */
    this._init = function(elem) {
        _elem = elem;

        _elem.find('#sdn_trace_form_btn_new').on("click", function() {
            sdntrace.clearTraceInterface();
            _self.showForm();
            $('#sdn_trace_form_btn_close').show();
            $('#sdn_trace_form_btn_new').hide();
        });

        _elem.find('#sdn_trace_form_btn_close').on("click", function() {
            _self.hideForm();
            $('#sdn_trace_form_btn_close').hide();
            $('#sdn_trace_form_btn_new').show();
        });
    };

    this.clear = function() {
    };

    /**
     * Show trace form.
     * It also cleans and hides all the informations in the panel to display propperly the form.
     */
    this.showForm = function() {
        $('#sdn_trace_form_btn_new').hide();

        // Hide trace info
        _self.hideInfo();

        $('#sdn_trace_form_include_form').show();
        $('#sdn_trace_form_btn_close').show();
    };

    /**
     * Hide trace form.
     */
    this.hideForm = function() {
        $('#sdn_trace_form_include_form').hide();
        $('#sdn_trace_form_btn_close').hide();
        $('#sdn_trace_form_btn_new').show();
    };

    this.showInfo = function() {
        $('#sdn_trace_form_include_info').show();
        _self.hideForm();
    };
    this.hideInfo = function() {
        $('#sdn_trace_form_include_info').hide();
    };

    this.showIconTimer = function() {
        $('#trace_panel_info__header .loading-icon-div').show();
    };
    this.hideIconTimer = function() {
        $('#trace_panel_info__header .loading-icon-div').hide();
    };
};


let SDNTrace = function() {

    let _self = this;

    this.configureColors = function(p_color) {
        let _color =  typeof p_color !== 'undefined' ? p_color : sdncolor.TRACE_COLOR_ACTIVE;

        injectStyles("style_trace_active", " .node-trace-active-color {stroke: " + _color + " !important;}" +
                     " .link-trace-active-color {stroke: " + _color + " !important;}");
    };

    this.clearTraceInterface = function() {
        /**
        * Clear trace forms, result, result pannel, dialog modal, graph highlight, graph trace
        */
        $("#trace_panel_info__dpid").html("");
        $("#trace_panel_info__port").html("");
        $("#trace_panel_info__start_time").html("");
        $("#trace_panel_info__total_time").html("");
        $("#trace_panel_info__result").html("");
        $("#tracecp_panel_info__msg").html("");

        // clear d3 graph highlight nodes, links
        if (forcegraph) {
            forcegraph.endHighlight();
        }

        // clear d3 graph trace classes
        if (d3lib) {
            d3lib.clearActivate();
        }

        // close trace form
        if (sdntraceform) {
            sdntraceform.hideForm();
            sdntraceform.hideInfo();
        }
    };

    /**
     * Call ajax to trace.
     * Param:
     *    json_data: Data in json String format to send as PUT method.
     */
    this.callTraceRequestId = function(json_data) {

        _self.clearTraceInterface();

        sdntraceform.showIconTimer();

        let ajaxDone = function(json) {
            // Stopping any ongoing trace.
            _self.traceStop();
            _self.traceReset();

            // Trigger AJAX to retrieve the trace result
            _self.triggerTraceListener(json.result.trace_id);
        };

        // AJAX call
        $.ajax({
            url: SDNLG_CONF.api_trace(),
            type: 'PUT',
            contentType: 'application/json; charset=utf-8',
            data: json_data
        })
        .done(function(json) {
            ajaxDone(json);
        })
        .fail(function(responseObj) {
            if (responseObj.responseJSON) {
//                $('#trace-result-content').html("<div class='bg-danger'>"+responseObj.responseJSON.error+"</div>");
            } else {
//                $('#trace-result-content').html("<div class='bg-danger'>Trace error.</div>");
            }
            _self.traceStop();
            console.warn("call_trace_request_id ajax error" );
        })
        .always(function() {
            sdntraceform.showInfo();
        });
    };

    this.renderHtmlTraceFormSelectedSwitch = function(p_dpid, p_label) {
        $('#sdn_trace_form__switch-content > select').val(p_dpid)
                                                     .trigger('change');

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
        let layer2 = {};
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

        return JSON.stringify(layer2);
    };

    /**
     * Build json string from form fields to send to trace layer 3 ajax.
     */
    this._build_trace_layer3_json = function() {
        let layer3 = {};
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
        
        layer3 = removeEmptyJsonValues(layer3);

        return JSON.stringify(layer3);
    };

    /**
     * Build json string from form fields to send to full trace ajax.
     */
    this._build_trace_layerfull_json = function() {
        let layerfull = {};
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

        return JSON.stringify(layerfull);
    };

    let _flagCallTraceListenerAgain = true;
    // Timeout flag to stop the trace listener
    let _threadTraceListener = "";
    // Time to trigger the next call in ms
    let _traceTimerTriggerCall = 1000;
    // Total time to trigger the call. After that trigger timeout method.
    let _traceTimerMax = 30000;

    let _traceTimerCounter = 0;

    this.triggerTraceListener = function(traceId) {
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


    /**
     * Call trace REST service to retrieve a trace result.
     * User must keep calling this service until the result retuns a SUCCESS or FAIL.
     *
     * @param traceId Trace ID number
     */
    this.callTraceListener = function(traceId) {
        let colorRender = function() {
            $("#trace_panel_info__result tr").each(function(index){
              let _switchA = $(this).find(".dataCol:eq(0)");
              let _portA = $(this).find(".dataCol:eq(1)");

              let _switchB = $("#tracecp_panel_info__result tr:nth-child(" + index + ")").find(".dataCol:eq(0)");
              let _portB = $("#tracecp_panel_info__result tr:nth-child(" + index + ")").find(".dataCol:eq(1)");

              if (_switchA.text() === _switchB.text()) {
                _switchA.css("color","greenyellow");
                _switchB.css("color","greenyellow");
              } else {
                _switchA.css("color","red");
                _switchB.css("color","red");
              }

              if (_portA.text() === _portB.text()) {
                _portA.css("color","greenyellow");
                _portB.css("color","greenyellow");
              } else {
                _portA.css("color","red");
                _portB.css("color","red");
              }
            });
        };

        /**
         * Render trace result html info.
         * @param jsonObj json received from REST trace service.
         */
        let htmlRender = function(jsonObj) {
            if(jsonObj.result) {
                // FIXME workaround for multiple starting type
                let _flag_multiple_starting_counter = 0;
                for (let obj of jsonObj.result) {
                    if (obj.type === REST_TRACE_TYPE.STARTING && (_flag_multiple_starting_counter === 0)) {
                        $("#trace_panel_info__dpid").html(obj.dpid);
                        $("#trace_panel_info__port").html(obj.port);
                        _flag_multiple_starting_counter++;
                    }
                }
            } else {
                $("#trace_panel_info__dpid").html("***");
                $("#trace_panel_info__port").html("***");
            }

            $("#trace_panel_info__start_time").html((jsonObj.start_time || "---"));
            $("#trace_panel_info__total_time").html((jsonObj.total_time || "---"));


            let htmlContent = "";
            if(jsonObj.result) {
                htmlContent += "<table id='trace_panel_info__result' class='table grafana-options-table'>";
                htmlContent += "<thead><tr><th>DPID</th><th>In. Port</th><th>Time</th></tr></thead>";
                htmlContent += "<tbody>";

                let _flag_multiple_starting_counter = 0;
                for (let obj of jsonObj.result) {
                    // FIXME: workaround for multiple starting type
                    if (obj.type === REST_TRACE_TYPE.STARTING && (_flag_multiple_starting_counter === 0)) {
                        _flag_multiple_starting_counter = _flag_multiple_starting_counter + 1;
                    // FIXME: workaround for multiple starting type
                    } else if ((obj.type === REST_TRACE_TYPE.STARTING && _flag_multiple_starting_counter > 0) || obj.type === REST_TRACE_TYPE.TRACE) {
                        htmlContent += "<tr data-type="+ obj.type +">";
                        htmlContent += "<td class='dataCol'>" + obj.dpid + "</td>";
                        htmlContent += "<td class='dataCol'>" + obj.port + "</td>";
                        htmlContent += "<td>" + obj.time + "</td>";
                        htmlContent += "</tr>";
                    } else if (obj.type === REST_TRACE_TYPE.INTERTRACE) {
                        htmlContent += "<tr data-type="+ obj.type +">";
                        htmlContent += "<td colspan='3'><strong>Interdomain: " + obj.domain + "</strong></td>";
                        htmlContent += "</tr>";
                    } else if (obj.type === REST_TRACE_TYPE.LAST) {
                        if (obj.reason === REST_TRACE_REASON.ERROR) {
                            let pspan = $("<span></span>");
                            pspan.addClass('trace_result_item_error');
                            pspan.html("Error: " + (obj.msg || ""));
                            $("#tracecp_panel_info__msg").append(pspan);
                        } else if (obj.reason === REST_TRACE_REASON.DONE) {
                            let pspan = $("<span></span>");
                            pspan.addClass('trace_result_item_done');
                            let pmsg = "Trace completed. ";
                            if (obj.msg !== 'none') {
                                pmsg += obj.msg ? obj.msg : "";
                            }
                            pspan.html(pmsg);
                            $("#tracecp_panel_info__msg").append(pspan);
                        } else if (obj.reason === REST_TRACE_REASON.LOOP) {
                            let pspan = $("<span></span>");
                            pspan.addClass('trace_result_item_loop');
                            pspan.html("Trace completed with loop. " + (obj.msg ? obj.msg : ""));
                            $("#tracecp_panel_info__msg").append(pspan);
                        }

                    } else if (obj.type === REST_TRACE_TYPE.ERROR) {
                        let pspan = $("<span></span>");
                        pspan.html(obj.message);
                        $("#tracecp_panel_info__msg").append(pspan);
                    }

                }
                htmlContent += "</tbody></table>";
            }
            // Result items
            $("#trace_panel_info__result").html(htmlContent);

            sdntraceform.hideForm();
            colorRender();
        };

        let _addNewHtmlNode = function(_id) {
            /**
            Add html data selector after add a new node
            */
            let html_selector = "#node-" + _id;
            $(html_selector).addClass("new-node node-trace-active");
            $(html_selector).attr("data-nodeid", _id);
        };

        let _addNewHtmlLink = function(_idFrom, _idTo) {
            /**
            Add html data selector after add a new link
            */
            let html_selector = "#link-" + _idFrom +"-"+ _idTo;
            d3lib.startPathActivate(_idFrom, _idTo);

            $(html_selector).attr("data-linkid", _idFrom +"-"+ _idTo);
        };

        let ajaxDone = function(jsonObj) {
            if (jsonObj && jsonObj === "0") {
                return;
            }

            try {
                if (jsonObj.result && jsonObj.result.length > 0) {
                    let flag_has_domain = false;
                    // temporary var to last node
                    let last_node_id = null;
                    // temporary var to last interdomain
                    let last_domain_id = null;

                    for (let i = 0, len = jsonObj.result.length; i < len; i++) {
                        let result_item = jsonObj.result[i];
                        let _id = null;

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
                            d3lib.startPathActivate(jsonObj.result[i-1].dpid, jsonObj.result[i].dpid)
                        }

                        last_node_id = _id;
                    }

                    let last_result_item = jsonObj.result[jsonObj.result.length - 1];
                    if (last_result_item.type === REST_TRACE_TYPE.LAST) {
                        // FLAG to stop the trigger loop
                        if (_self._flagCallTraceListenerAgainCounter < 12) {
                            _self._flagCallTraceListenerAgainCounter = _self._flagCallTraceListenerAgainCounter + 1;
                        } else {
                            // stop the interval loop
                            _self.traceStop();
                        }
                    } else if (last_result_item.type === REST_TRACE_TYPE.ERROR) {
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
            url: SDNLG_CONF.api_trace() + "/" + traceId + "?q=" + Math.random(),
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


let SDNTraceCP = function() {
    let _self = this;

    this.configureColors = function(p_color) {
        let _color =  typeof p_color !== 'undefined' ? p_color : sdncolor.TRACECP_COLOR_ACTIVE;
        injectStyles("style_tracecp_active", " .link-tracecp-active-color {stroke: " + _color + " !important;}");
    };

    /**
     * Build json string from form fields to send to trace layer 2 ajax.
     */
    this.buildTraceLayer2JSON = function() {
        let layer2 = {};
        layer2.trace = {};

        let _switch = {};
        _switch.dpid = $('#sdn_trace_form__switch-hidden').val();
        _switch.in_port = $('#sdn_trace_form__switch-port-hidden').val();
        if (_switch.in_port) {
            _switch.in_port = parseInt(_switch.in_port, 10);
        }
        layer2.trace.switch = _switch;

        let _eth = {};
        _eth.dl_src = $('#cp_l2_dl_src').val();
        _eth.dl_dst = $('#cp_l2_dl_dst').val();
        _eth.dl_vlan = $('#cp_l2_dl_vlan').val();
        if (_eth.dl_vlan) {
            _eth.dl_vlan = parseInt(_eth.dl_vlan, 10);
        }
        _eth.dl_type = $('#cp_l2_dl_type').val();
        if (_eth.dl_type) {
            _eth.dl_type = parseInt(_eth.dl_type, 10);
        }
        layer2.trace.eth = _eth;

        layer2 = removeEmptyJsonValues(layer2);

        return JSON.stringify(layer2);
    };

    /**
     * Build json string from form fields to send to trace layer 3 ajax.
     */
    this._build_trace_layer3_json = function() {
        let layer3 = {};
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

        layer3 = removeEmptyJsonValues(layer3);
        return JSON.stringify(layer3);
    };

    /**
     * Build json string from form fields to send to full trace ajax.
     */
    this._build_trace_layerfull_json = function() {
        let layerfull = {};
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

        return JSON.stringify(layerfull);
    };



    this.callTraceRequestId = function(json_data) {
        /**
         * Call ajax to trace.
         * Param:
         *    json_data: Data in json String format to send as PUT method.
         */


        let htmlRender = function(jsonObj) {
            /**
            * Render trace result html info.
            */

            let htmlContent = "";

            if(jsonObj.result) {
                htmlContent += "<table class='table grafana-options-table'>";
                htmlContent += "<thead><tr><th></th><th>DPID</th><th>In. Port</th></tr></thead>";
                htmlContent += "<tbody>";

                let _flag_multiple_starting_counter = 0;
                let i = 0;
                for (let obj of jsonObj.result) {
                    i = i + 1;

                    // FIXME: workaround for multiple starting type
                    if (obj.type !== REST_TRACE_TYPE.STARTING || (obj.type === REST_TRACE_TYPE.STARTING && _flag_multiple_starting_counter > 0)) {
                        htmlContent += "<tr data-type="+ obj.type +">";
                        htmlContent += "<td>" + (i) + "</td>";
                    }

                    // FIXME: workaround for multiple starting type
                    if (obj.type === REST_TRACE_TYPE.STARTING && (_flag_multiple_starting_counter === 0)) {
                        _flag_multiple_starting_counter = _flag_multiple_starting_counter + 1;
                    // FIXME: workaround for multiple starting type
                    } else if ((obj.type === REST_TRACE_TYPE.STARTING && _flag_multiple_starting_counter > 0) || obj.type === REST_TRACE_TYPE.TRACE) {
                        htmlContent += "<td class='dataCol'>" + obj.dpid + "</td>";
                        htmlContent += "<td class='dataCol'>" + obj.port + "</td>";
                    } else if (obj.type === REST_TRACE_TYPE.INTERTRACE) {
                        htmlContent += "<td colspan='3'><strong>Interdomain: " + obj.domain + "</strong></td>";
                    } else if (obj.type === REST_TRACE_TYPE.LAST) {
                        htmlContent += "<td colspan='3'>";
                        if (obj.reason === REST_TRACE_REASON.ERROR) {
                            htmlContent += "<span class='trace_result_item_error'>Error: ";
                            htmlContent += obj['msg'] ? obj['msg'] : "";
                            htmlContent += "</span>";
                        } else if (obj.reason === REST_TRACE_REASON.DONE) {
                            htmlContent += "<span class='trace_result_item_done'>Trace completed. ";
                            if (obj['msg'] !== 'none') {
                                htmlContent += obj['msg'] ? obj['msg'] : "";
                            }
                            htmlContent += "</span>";
                        } else if (obj.reason === REST_TRACE_REASON.LOOP) {
                            htmlContent += "<span class='trace_result_item_loop'>Trace completed with loop. ";
                            htmlContent += obj['msg'] ? obj['msg'] : "";
                            htmlContent += "</span>";
                        }
                        htmlContent += "</td>";
                    } else if (obj.type === REST_TRACE_TYPE.ERROR) {
                        htmlContent += "<td colspan='3'>" + obj.message + "</td>";
                    }
                    htmlContent += "</tr>";
                }

                htmlContent += "</tbody></table>";
            }


            $('#tracecp_panel_info__result').html(htmlContent);
        };

        let _addNewHtmlNode = function(_id) {
            /**
            Add html data selector after add a new node
            */
            let html_selector = "#node-" + _id;
            $(html_selector).addClass("new-node node-trace-active");
            $(html_selector).attr("data-nodeid", _id);
        };

        let _addNewHtmlLink = function(_idFrom, _idTo) {
            /**
            Add html data selector after add a new link
            */
            let html_selector = "#link-CP" + _idFrom +"-"+ _idTo;
            d3lib.startPathCPActivate(_idFrom, _idTo);
            $(html_selector).attr("data-linkid", _idFrom +"-"+ _idTo);
        };

        let ajaxDone = function(jsonObj) {
            if (jsonObj && jsonObj === "0") {
                return;
            }

            try {
                if (jsonObj.result && jsonObj.result.length > 0) {
                    let flag_has_domain = false;
                    // temporary var to last node
                    let last_node_id = null;

                    for (let i = 0, len = jsonObj.result.length; i < len; i++) {
                        let result_item = jsonObj.result[i];
                        let _id = null;

                        if (result_item.hasOwnProperty("dpid")) {
                            _id = result_item.dpid;

                            if (last_node_id == null) {
                                last_node_id = _id;
                            } else {
                                // Add new link
                                d3lib.addNewLink(last_node_id, _id, "CP");
                                _addNewHtmlLink(last_node_id, _id, "CP");
                            }
                            d3lib.startNodeActivate(_id);
                        }

                        if (i > 0 && jsonObj.result[i-1].hasOwnProperty("dpid") && jsonObj.result[i].hasOwnProperty("dpid")) {
                            // Add new link between nodes
                            let css_selector = document.getElementById("link-CP" + jsonObj.result[i-1].dpid +"-"+ jsonObj.result[i].dpid);
                            d3lib.startPathCPActivate(jsonObj.result[i-1].dpid, jsonObj.result[i].dpid);
                        }

                        last_node_id = _id;
                        let last_result_item = jsonObj.result[jsonObj.result.length - 1];
                    }
                }
                htmlRender(jsonObj);
            } catch(err) {
                console.error(err);
                throw err;
            }
        };

        // AJAX call
        $.ajax({
            //url: "/api/amlight/sdntrace_cp/trace",
            url: SDNLG_CONF.api_trace_cp(),
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
        });
    };


 }; // SDNTrace Control plane


const sdntrace = new SDNTrace();
const sdntracecp = new SDNTraceCP();
const sdntraceform = new SDNTraceForm();


export {
  sdntrace as sdntrace,
  sdntracecp as sdntracecp,
  sdntraceform as sdntraceform
};

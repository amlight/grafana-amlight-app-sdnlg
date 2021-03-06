import {SDNLG_CONF} from "./conf"
import * as util from "./util"
import {Switch, Link, Port} from "./domain"
import {d3lib} from "./main"
import {sdntrace, sdntraceform} from "./trace";


class SDNTopology {
    constructor() {
        // switches list. It is used to help render the topology nodes.
        this.switches = [];
        // topology link list
        this.topologies = [];
        // topology domains

        this.domains = [];
        // Map to optimize the topology connections verification by index.
        this._linkedByIndex = new Map();
    }

    /**
     * Add two nodes as connections to the verification Map.
     * @param {type} nodeA Source node
     * @param {type} nodeB Target node
     * @param {type} prefix_id Prefix string to add to the connection ID
     */
    _addTopologyConnection(nodeA, nodeB, prefix_id="") {
        this._linkedByIndex.set((prefix_id||"") + nodeA.id + "-" + nodeB.id, true);
    }
    
    /**
     * Verify if node A and node B are connected.
     * @param {type} nodeA
     * @param {type} nodeB
     * @param {type} prefix_id Prefix string to add to the connection ID
     * @returns {Boolean}
     */
    _isTopologyConnected(nodeA, nodeB, prefix_id="") {
        return this._linkedByIndex.has((prefix_id||"") + nodeA.id + "-" + nodeB.id) ||
               this._linkedByIndex.has((prefix_id||"") + nodeB.id + "-" + nodeA.id) ||
               nodeA.id === nodeB.id;
    }

    sdntraceGetSwitches(jsonObj) {
        // Clear topology temporary list of switches.
        this.switches = [];

        //for (var x = 0; x < jsonObj.devices.length; x++) {
        for (let k in jsonObj.switches){
            let json_node = jsonObj.switches[k];

            if (json_node.type === "switch") {

                // Trying to retrieve and use old switch object.
                let switch_obj = this.get_node_by_id(json_node.dpid);
                if (typeof switch_obj === "undefined") {
                    switch_obj = new Switch(json_node.dpid);
                }
                this.switches.push(switch_obj);

                // storing switch values
                this.sdntraceGetSwitchInfo(jsonObj, json_node);
            }

            if (json_node.type === "host") {
//                // storing switch values
//                var switch_obj = new Switch(json_node.id);
//                this.switches.push(switch_obj);

                //this.sdntraceGetSwitchInfo(jsonObj, json_node.id);

                //this.callSdntraceGetSwitchFlows(jsonObj[x]);
            }
        }

        // sort
        this.switches = this.switches.sort();
        // deduplication
//        this.switches = util.arrayRemoveDuplicates(this.switches);
    };

    sdntraceGetSwitchInfo(jsonObj, jsonNode) {
        let switch_obj = this.get_node_by_id(jsonNode.dpid);
        switch_obj.name = jsonNode.name;
//        switch_obj.switch_color = jsonObj.switch_color;
        switch_obj.ip_address = jsonNode.connection;
        switch_obj.openflow_version = jsonNode.ofp_version;
        switch_obj.switch_vendor = jsonNode.manufacturer;
        switch_obj.hardware = jsonNode.hardware;
        switch_obj.software = jsonNode.software;

        if(jsonNode.connection && jsonNode.connection.length > 0) {
            let patt = new RegExp("(.*){1}:([0-9]*$)");
            let res = patt.exec(jsonNode.connection);
            switch_obj.ip_address = res[1];
            switch_obj.tcp_port = res[2];
            //switch_obj.number_flows = jsonObj.number_flows;
        }

        this.sdntraceGetSwitchPorts(jsonNode, jsonNode.dpid);
    };
    
    callSdntraceGetSwitchFlows(jsonObj, p_dpid, callback=null) {
        let _self = this;
        let ajax_done = function(jsonObj, p_callback) {
            let switch_obj = _self.get_node_by_id(p_dpid);

            switch_obj.number_flows = jsonObj.data.length || 0;

            switch_obj.flow_stat = {};
            switch_obj.flow_stat.dpid = p_dpid;
            switch_obj.flow_stat.flows = [];

            for(let x in jsonObj.data) {
                let jsonFlow = jsonObj.data[x];

                let flowObj = {};
                flowObj.idle_timeout = jsonFlow.idle_timeout;
                flowObj.cookie = jsonFlow.cookie;
                flowObj.priority = jsonFlow.priority;
                flowObj.hard_timeout = jsonFlow.hard_timeout;
                flowObj.byte_count = jsonFlow.stats.Bps;
                flowObj.packet_count= jsonFlow.stats.pps;
//                flowObj.duration_nsec = jsonFlow.duration_nsec;
//                flowObj.duration_sec = jsonFlow.duration_sec;
                flowObj.table_id = jsonFlow.table_id;

                flowObj.actions = [];
                for(let y in jsonFlow.actions) {
                    let jsonAction = jsonFlow.actions[y];

                    let flowActionObj = {};
                    flowActionObj.max_len = jsonAction.max_len;
                    flowActionObj.type = jsonAction.action_type;
                    flowActionObj.port = jsonAction.port;
                    flowActionObj.vlan_vid = jsonAction.vlan_vid;
                    flowObj.actions.push(flowActionObj);
                }

                flowObj.match = {};
//                flowObj.match.wildcards = jsonFlow.match.wildcards;
                flowObj.match.in_port = jsonFlow.match.in_port;
                flowObj.match.dl_vlan = jsonFlow.match.dl_vlan;
                flowObj.match.dl_src = jsonFlow.match.dl_src;
                flowObj.match.dl_dst = jsonFlow.match.dl_dst;
                flowObj.match.dl_type = jsonFlow.match.dl_type;

//                flowObj.match.in_port = jsonFlow.in_port;
//                flowObj.match.dl_vlan = jsonFlow.dl_vlan;
//                flowObj.match.dl_src = jsonFlow.dl_src;
//                flowObj.match.dl_dst = jsonFlow.dl_dst;
//                flowObj.match.dl_type = jsonFlow.dl_type;

                switch_obj.flow_stat.flows.push(flowObj);
            }

            switch_obj.flow_pivot = [];


            for(let x in jsonObj.data) {
                let jsonFlow = jsonObj.data[x];

                let pivot = {};
                pivot.dpid = p_dpid;

                pivot.idle_timeout = jsonFlow.idle_timeout;
                pivot.cookie = jsonFlow.cookie;
                pivot.priority = jsonFlow.priority;
                pivot.hard_timeout = jsonFlow.hard_timeout;
                pivot.byte_count = jsonFlow.stats.Bps;
                //pivot.duration_nsec = jsonFlow.duration_nsec;
                pivot.packet_count= jsonFlow.stats.pps;
                pivot.duration_sec = jsonFlow.duration_sec + (jsonFlow.duration_nsec / 1000000000.0);

                pivot.table_id = jsonFlow.table_id || '';
//                pivot.match__wildcards = jsonFlow.match.wildcards || '';
                pivot.match__in_port = jsonFlow.match.in_port || ' ';
                pivot.match__dl_vlan = jsonFlow.match.dl_vlan || '';
                pivot.match__dl_src = jsonFlow.match.dl_src || '';
                pivot.match__dl_dst = jsonFlow.match.dl_dst || '';
                pivot.match__dl_type = jsonFlow.match.dl_type || '';

                if (jsonFlow.actions) {
                    for(let y in jsonFlow.actions) {
                        let jsonAction = jsonFlow.actions[y];

                        if(y > 0) {
                            pivot.action__max_len = pivot.action__max_len +"<br>"+ (jsonAction.max_len || '--');
                            pivot.action__type = pivot.action__type +"<br>"+ (jsonAction.type || '--');
                            pivot.action__port = pivot.action__port +"<br>"+ (jsonAction.port || '--');
                            pivot.action__vlan_vid = pivot.action__vlan_vid +"<br>"+ (jsonAction.vlan_vid || '--');
                        } else {
                            pivot.action__max_len = (jsonAction.max_len || '--');
                            pivot.action__type = (jsonAction.type || '--');
                            pivot.action__port = (jsonAction.port || '--');
                            pivot.action__vlan_vid = (jsonAction.vlan_vid || '--');
                        }
                    }
                }
                switch_obj.flow_pivot.push(pivot);
            }

            if (p_callback !== null) {
                console.log('callSdntraceGetSwitchFlows callback');
                try {
                    callback();
                } catch(err) {
                    console.log("Error callback function: " + callback);
                    throw err;
                }
            }
        };

        // AJAX call
        $.ajax({
            url: SDNLG_CONF.api_stats() + p_dpid + "/flows",
            dataType: 'json',
            crossdomain:true
        })
        .done(function(json) {
            ajax_done(json, callback);
        })
        .fail(function() {
            console.log( "callSdntraceGetSwitchFlows ajax error" );
        })
        .always(function() {
            console.log( "callSdntraceGetSwitchFlows ajax complete" );
        });
    }

    /**
     * Get node by id.
     * Returns Switch, Domain or Host
     * @param {type} p_id Node id
     * @returns {Node}
     */
    get_node_by_id(p_id) {
        // add to topology list to render the html
        for (let key in this.switches) {
            if (this.switches.hasOwnProperty(key) && this.switches[key].id === p_id) {
                return this.switches[key];
            }
        }

        for (let key in this.domains) {
            if (this.domains.hasOwnProperty(key) && this.domains[key].id === p_id) {
                return this.domains[key];
            }
        }
    }

   /**
    * Use this function instead of access the topology attribute.
    * @param {Link} link Link object
    */
    add_topology(link) {
        if (this._isTopologyConnected(link.node1, link.node2, link.prefix_id) === false) {
            this._addTopologyConnection(link.node1, link.node2, link.prefix_id);
            // add to topology list to render the html
            this.topologies.push(link);
        }
    }

   /**
    * Use this function to get the topology link object.
    * Nodes parameters can be in any order.
    * 
    * @param {Node} node1 Node object
    * @param {Node} node2 Node object
    * @returns {Link} Link object
    */
    get_topology_link(node1, node2, prefix) {
        if (this._isTopologyConnected(node1, node2, prefix)) {
            for (let _topology of this.topologies) {
                if ((_topology.node1.id === node1.id && _topology.node2.id === node2.id) ||
                   (_topology.node1.id === node2.id && _topology.node2.id === node1.id)) {

                    return _topology;
                }
            }
        }
        return null;
    }

    sdntraceGetLinks(jsonObj) {
        for (let k in jsonObj.links){
            let json_link = jsonObj.links[k];

            // Check if the node is a HOST
            if (util.isMacAddress(json_link.endpoint_a.id) || util.isMacAddress(json_link.endpoint_b.id)) {
                json_link.type = "host";
            }

            //if (json_link.type === "link") {
            if (typeof json_link.type === "undefined") {
                let dpid1 = '';
                let port1 = '';
                let dpid2 = '';
                let port2 = '';

                if (util.isMacAddress(json_link.endpoint_a.id)) {
                    dpid1 = json_link.endpoint_a.id;
                //} else if (json_link.endpoint_a.length > 23) {
                } else if (json_link.endpoint_a.id.length > 23) {
                    dpid1 = json_link.endpoint_a.switch;
                    port1 = json_link.endpoint_a.port_number;
                } else {
                    dpid1 = json_link.endpoint_a.id;
                }

                if (util.isMacAddress(json_link.endpoint_b.id)) {
                    dpid2 = json_link.endpoint_b.id;
                } else {
                    dpid2 = json_link.endpoint_b.switch;
                    port2 = json_link.endpoint_b.port_number;
                }

                let linkObj = new Link();

                // creating switch
                let _switch1 = this.get_node_by_id(dpid1);
                let _switch2 = this.get_node_by_id(dpid2);

                let switch1 = Switch.clone_obj(_switch1);
                let switch2 = Switch.clone_obj(_switch2);

                if(this._isTopologyConnected(switch1, switch2)) {
                    //linkObj = this.get_topology_link(switch1, switch2);
                    linkObj = null;
                } else {
                    linkObj.node1 = switch1;
                    linkObj.node2 = switch2;

                    linkObj.node1.ports = [];
                    linkObj.node2.ports = [];

                    // creating switch ports from node1
                    let node1_port = _switch1.get_port_by_id(port1);

                    if (node1_port === null) {
                        node1_port = new Port(dpid1, port1, port1, port1);
                        linkObj.node1.ports.push(node1_port);
                        switch1.ports.push(node1_port);
                    } else {
                        linkObj.node1.ports.push(node1_port);
                    }
                    linkObj.label1 = node1_port.label;

                    // creating switch ports from node2
                    let node2_port = _switch2.get_port_by_id(port2);
                    if (node2_port === null) {
                        node2_port = new Port(dpid2, port2, port2, port2);
                        linkObj.node2.ports.push(node2_port);
                        switch2.ports.push(node2_port);
                    } else {
                        linkObj.node2.ports.push(node2_port);
                    }
                    linkObj.label2 = node2_port.label;

                    // link speed
                    if(node1_port && node1_port.speed) {
                        linkObj.speed = node1_port.speed;
                    } else if(node2_port && node2_port.speed) {
                        linkObj.speed = node2_port.speed;
                    }
                }
                // Add the node the the topology
                if (linkObj) {
                    this.add_topology(linkObj);
                }
            } else if (json_link.type === "host") {
                // Add new host node
                let _host_label = "";

                let dpid1 = '';
                let port1 = '';
                let dpid2 = '';
                let port2 = '';

                if (util.isMacAddress(json_link.a)) {
                    _host_label = json_link.a;
                } else if (json_link.a.length > 23) {
                    let patt = new RegExp("(.*){1}:([0-9]*$)");
                    let res = patt.exec(json_link.a);
                    dpid1 = res[1];
                    port1 = res[2];
                } else {
                    dpid1 = json_link.a;
                }
                if (util.isMacAddress(json_link.b)) {
                    _host_label = json_link.b;
                } else {
                    res = patt.exec(json_link.b);
                    dpid2 = res[1];
                    port2 = res[2];
                }

                let linkObj = new Link();

                // add node data do d3
                let _switch1 = this.get_node_by_id(dpid1);
                linkObj.node1 = Switch.clone_obj(_switch1);
                linkObj.node1.ports = [];

                // creating switch ports from node1
                let node1_port = _switch1.get_port_by_id(port1);
                if (node1_port === null) {
                    node1_port = new Port(dpid1, port1, port1, port1);
                    linkObj.node1.ports.push(node1_port);
                } else {
                    linkObj.node1.ports.push(node1_port);
                }
                linkObj.label1 = node1_port.label;

                let host_obj = d3lib.addNewNodeHost(dpid1, port1, _host_label);

                linkObj.node2 = host_obj;

                // creating host ports
                let node2_port = new Port(host_obj.id +'_'+ port2, port2, "");

                linkObj.node2.ports = [node2_port];
                linkObj.label_num2 = port2;
                // Add the node the the topology
                if (linkObj) {
                    this.add_topology(linkObj);
                }
            } else if (json_link.type === "interdomain") {
                // Add new host node
                let _domain_label = "";
                if (typeof(p_neighbor.domain_name)!=='undefined') {
                    _domain_label = p_neighbor.domain_name;
                }

                // add node data do d3
                let linkObj = new Link();

                let _switch1 = this.get_node_by_id(dpid1);
                linkObj.node1 = Switch.clone_obj(_switch1);;
                linkObj.node1.ports = [];

                // creating switch ports from node1
                let node1_port = _switch1.get_port_by_id(port1);
                if (node1_port === null) {
                    node1_port = new Port(dpid1, port1, port1, port1);
                    linkObj.node1.ports.push(node1_port);
                } else {
                    linkObj.node1.ports.push(node1_port);
                }
                linkObj.label1 = node1_port.label;

                let domainObj = d3lib.addNewNodeDomain(_domain_label, _domain_label);
                linkObj.node2 = domainObj;

                // Add the node the the topology
                if (linkObj) {
                    this.add_topology(linkObj);
                }
            }

        }
    }

    /**
     * Call ajax to load the switch topology.
     * 
     * @param {function} callback Callback function
     */
    callSdntraceGetTopology(callback=null) {
        let _self = this;
        let ajaxDone = function(json) {
            // get kytos topology object from json
            let jsonObj = json.topology;

            // find switches from json
            _self.sdntraceGetSwitches(jsonObj);

            // verify if the json is not a '{}' response
            if (!jQuery.isEmptyObject(jsonObj)) {
                _self.sdntraceGetLinks(jsonObj);

                // render D3 force
                d3lib.render_topology();
            }

            if(callback) {
                callback();
            }
        };

        // AJAX call
        $.ajax({
            url: SDNLG_CONF.api_topology(),
            dataType: 'json'
        })
        .done(function(json) {
            ajaxDone(json);
        })
        .fail(function() {
            console.log( "call_get_topology ajax error" );
        })
        .always(function() {
            console.log( "call_get_topology ajax complete" );
        });
    }

    /**
     * Call ajax to load the switch ports data.
     */
    sdntraceGetSwitchPorts(jsonObj, p_dpid, callback=null) {
        let switchObj = this.get_node_by_id(p_dpid);

        if (switchObj) {
            //for (var x = 0; x < jsonObj.nodes.length; x++) {
            for (let k in jsonObj.interfaces){
                let json_node = jsonObj.interfaces[k];

                if (json_node.type === "interface" && json_node.switch === p_dpid) {
                    let p_port_data = json_node;

                    let portObj = switchObj.get_port_by_id(p_port_data.port_number);

                    if (portObj === null) {
                        portObj = new Port(p_dpid, p_port_data.port_number, p_port_data.port_number, p_port_data.name);

                        // create Port object and push to the switch ports
                        if (switchObj.ports === null) {
                            switchObj.ports = [];
                        }
                        switchObj.ports.push(portObj);
                    }
                    portObj.speed = p_port_data.speed;
                    portObj.name = p_port_data.name;
                    portObj.number = p_port_data.port_number;
                    //portObj.status = p_port_data.status;
                    portObj.stats = {};
                    if (p_port_data.stats) {
                        portObj.stats.collisions = p_port_data.stats.collisions;

                        portObj.stats.rx_bytes = p_port_data.stats.rx_bytes;
                        portObj.stats.rx_crc_err = p_port_data.stats.rx_crc_err;
                        portObj.stats.rx_dropped = p_port_data.stats.rx_dropped;
                        portObj.stats.rx_errors = p_port_data.stats.rx_errors;
                        portObj.stats.rx_frame_err = p_port_data.stats.rx_frame_err;
                        portObj.stats.rx_over_err = p_port_data.stats.rx_over_err;
                        portObj.stats.rx_packets = p_port_data.stats.rx_packets;

                        portObj.stats.tx_bytes = p_port_data.stats.tx_bytes;
                        portObj.stats.tx_dropped = p_port_data.stats.tx_dropped;
                        portObj.stats.tx_errors = p_port_data.stats.tx_errors;
                        portObj.stats.tx_packets = p_port_data.stats.tx_packets;
                    }
                }
            }
        }
    }

    /**
     * Callback to be used with the AJAX that retrieve switch ports.
     * @param {type} nodeId Node Id that contains the ports
     * @param {type} jsonObj JSON object with port data
     */
    _render_html_popup_ports(nodeId, jsonObj) {
        let popupSwitch = function(nodeId, data) {
            // remove possible popups
            d3.select(".canvas")
                .selectAll(".popup")
                .remove();

             // Build the popup
            let popup = d3.select(".canvas")
                .append("div")
                .attr("class", "popup")
                .attr("id", "switch_popup");
            // close icon
            popup.append("button")
                .attr("type", "button")
                .attr("class", "close")
                .append("span")
                    .html('&times;')
                    // removing the popup
                    .on("click", function(d) {
                        d3.select(".canvas")
                        .selectAll(".popup")
                        .remove();
                    });
            // popup content Header
            popup.append("div")
                .attr("class","popup_header")
                .text(nodeId);
            popup.append("div")
                .attr("class","popup_header")
                .text("Interfaces (" + data.length + "):");
            // popup header separator
            popup.append("hr");
            // popup content
            let popupBody = popup
                .append("div")
                .attr("class","popup_body");
            let updatePopupBody = popupBody
                .selectAll("p")
                .data(data)
                .enter()
                    .append("p")
                        .append("a")
                            // adding click function
                            .on("click", function(d) {
                                popup.selectAll(".popup_body").remove();
                                let popup_body = popup.append("div").attr("class","popup_body");
                                popup_body.append("p").text("Port n.: " + d.port_no);
                                popup_body.append("p").text("Port name: " + d.name);
                                popup_body.append("p").text("Port speed: " + d.speed);
                                popup_body.append("p").text("Port uptime: " + d.uptime);
                                // adding back button
                                popup_body.append("p")
                                    .append("a")
                                    .text("back")
                                    .on("click", function() { popupSwitch(nodeId, data); });
                             })
                            .text(function(d) { return d.port_no + " - " + d.name; });
            updatePopupBody.exit();
        };
        
        popupSwitch(nodeId, jsonObj);
    }

    /**
    * Get switch ports from a dpid.
    */
    get_switch_ports(dpid) {
        let switch_obj = this.get_node_by_id(dpid);

        if (switch_obj) {
            return switch_obj.ports;
        } else {
            return "";
        }
    }

    /**
     * Show the trace form to trigger the SDN Trace.
     * It has three forms, to L2, L3 and full trace.
     * We use modal forms over the layout.
     */
    showTraceForm(d) {
        // setting switch label
        let label = d.dpid;
        if (d.dpid && d.dpid !== d.label) {
            label += " - " + d.label;
        }
        sdntrace.renderHtmlTraceFormSelectedSwitch(d.dpid, label);

        // render switch ports
        let ports = this.get_switch_ports(d.dpid);
        sdntrace.renderHtmlTraceFormPorts(d.dpid, ports);

        // open trace form panel
        sdntraceform.showForm();
    }
}

export {
  SDNTopology as SDNTopology
};

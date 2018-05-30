import {sdncolor} from './main';
import {SDNLG_CONF} from "./conf";

/**
 * Represents link between two nodes.
 * @returns {Link}
 */
class Link {
    constructor() {
        // Switch objects
        this.node1 = null;
        this.node2 = null;

        // Label name String
        this.label1 = null;
        this.label2 = null;

        // Label number String
        this.label_num1 = null;
        this.label_num2 = null;

        // number. Bits per second.
        this.speed = null;
    }
}

/**
 * Switch representation.
 * @param {type} switch_id Switch DPID (datapath id)
 * @returns {Switch}
 */
class Switch {
    constructor(switch_id) {
        this.id = switch_id;
        this.dpid = switch_id; // datapath_id

        this.name = null;
        this.switch_color = null;
        this.tcp_port = null;
        this.openflow_version = null;
        this.switch_vendor = null;
        this.hardware = null;
        this.software = null;
        this.ip_address = null;
        this.number_flows = null;

        // number of ports
        this.n_ports = null;
        this.n_tables = null;

        // switch ports
        this.ports = [];

        // switch flows statistics
        this.flow_stat = null;

        this.domain = null; // if the switch belongs to an interdomain
    }

    /**
     * Get switch fantasy name from configuration data.
     * @returns {String}
     */
    getName() {
        if (this.name) {
            return this.name;
        }
        if (typeof SDNLG_CONF !== 'undefined') {
            let name = SDNLG_CONF.dict[this.id];
            if (name !== undefined) {
                return name;
            }
        }
        return "";
    }

    /**
     * Get switch fantasy name from configuration data.
     * If there is no name return the switch ID.
     */
    getNameOrId() {
        if (this.name) {
            return this.name;
        }
        if (typeof SDNLG_CONF !== 'undefined') {
            let name = SDNLG_CONF.dict[this.id];
            if (name !== undefined) {
                return name;
            }
        }
        return this.id;
    }

    /**
     * Get switch fantasy name from configuration data.
     * Return verbose name as: <ID> - <NAME>
     */
    getVerboseName() {
        if (this.name) {
            return this.id + ' - ' + this.name;
        }
        if (typeof SDNLG_CONF !== 'undefined') {
            let name = SDNLG_CONF.dict[this.id];
            if (name !== undefined) {
                return this.id + ' - ' + name;
            }
        }
        return this.id;
    }

    /**
     * Get switch fantasy name from configuration data.
     * Return verbose name to be used on vis.js: <ID>\n<NAME>
     */
    getNodeName() {
        if (this.name) {
            return this.name;
        }

        if (typeof SDNLG_CONF !== 'undefined') {
            let name = SDNLG_CONF.dict[this.id];
            if (name !== undefined) {
                return name;
            }
        }
        return this.id;
    }

    get_port_by_id(node_id, p_id) {
        let port_id = node_id +"_"+ p_id;

        for (let _port of this.ports){
            if(_port.id === port_id) {
                return _port;
            }
        }
        return null;
    }

    getD3jsData() {
        let nodeObj = {
            id: this.id,
            dpid: this.id,
            name: this.id,
            data: this,
            label: this.getNodeName(),
            physics: true,
            stroke_width: 1,
            x: 300, // OBS: need to position otherwise will be at x = 0
            y: 300, // OBS: need to position otherwise will be at y = 0
            type: Switch.TYPE,
            obj: this
        };
        // Trace coloring
        if (typeof(nodeObj.color) === 'undefined') {
            nodeObj.background_color = sdncolor.NODE_COLOR[nodeObj.type];
        }
        return nodeObj;
    }

    static clone_obj(p_sw) {
        let return_switch = new Switch(p_sw.id);

        return_switch.id = p_sw.id;
        return_switch.dpid = p_sw.dpid;
        return_switch.name = p_sw.name;
        return_switch.switch_color = p_sw.switch_color;
        return_switch.tcp_port = p_sw.tcp_port;
        return_switch.openflow_version = p_sw.openflow_version;
        return_switch.switch_vendor = p_sw.switch_vendor;
        return_switch.ip_address = p_sw.ip_address;
        return_switch.number_flows = p_sw.number_flows;
        return_switch.n_ports = p_sw.n_ports;
        return_switch.n_tables = p_sw.n_tables;
        return_switch.ports = p_sw.ports;
        return_switch.domain = p_sw.domain;

        return return_switch;
    }
}

// Return switch id if the class is used with strings
Switch.prototype.toString = function(){ return this.id; };


/**
 * Switch static TYPE property;
 * @type String
 */
Switch.TYPE = "switch";

/**
 * Node port representation.
 * Node can be a Switch or Host.
 * 
 * @param {type} node_id Switch or Host id.
 * @param {type} port_id Port id
 * @param {type} number Port number
 * @param {type} label Port label
 * @returns {Port}
 */
class Port {
    constructor(node_id, port_id, number, label) {
        this.id = node_id + "_" + port_id;
        this.number = number;
        this.label = label;
        this.name = label;
        this.speed = '';
        this.uptime = '';
        this.status = '';
        this.stats = {
            collisions: 0,
            rx_bytes: 0,
            rx_crc_err: 0,
            rx_dropped: 0,
            rx_errors: 0,
            rx_frame_err: 0,
            rx_over_err: 0,
            rx_packets: 0,
            tx_bytes: 0,
            tx_dropped: 0,
            tx_errors: 0,
            tx_packets: 0
        }
    }

    getD3jsData() {
        let nodeObj = {
            id: this.id,
            name: null,
            data: this,
            label: this.label,
            physics: true,
            from_sw: '',
            to_sw: '',
            stroke_width: 1,
            type: Port.TYPE,
            obj: this
        };
        nodeObj.background_color = sdncolor.NODE_COLOR[nodeObj.type];

        return nodeObj;
    }
}

// Return switch port id if the class is used with strings
Port.prototype.toString = function(){ return this.id; };

/**
 * Port static TYPE property;
 * @type String
 */
Port.TYPE = "port";


/**
 * Domain representation.
 * @param {type} domain_id
 * @param {type} label
 * @returns {Domain}
 */
class Domain {
    constructor(domain_id, label) {
        this.id = domain_id;
        this.label = label;
    }

    getD3jsData() {
        let nodeObj = {
            id: this.id,
            name: null,
            data: this,
            label: this.label,
            physics: true,
            stroke_width: 1,
            type: Domain.TYPE
        };
        nodeObj.background_color = sdncolor.NODE_COLOR[nodeObj.type];

        return nodeObj;
    }

    getName() {
        return this.label;
    }

    /**
     * Domain static function to generate an ID based on the domain_name.
     * @param {type} p_domainName
     * @returns {String}
     */
    static createId(p_domainName) {
        if (p_domainName === null || p_domainName === "") {
            console.log("[ERROR] Domain.createId p_domain_name is empty.");
            throw "[ERROR] Domain.createId p_domain_name is empty.";
        }

        let domain_id = p_domainName.replace(" ", "_");

        return "domain_" + domain_id;
    }
}

/**
 * Domain static TYPE property;
 * @type String
 */
Domain.TYPE = "domain";


/**
 * Host representation.
 * Hosts must be linked to a Node.
 * 
 * @param {type} host_id Host id. Use can use the createId() to generate an ID.
 * @param {type} label Host label
 * @returns {Host}
 */
class Host {
    constructor(host_id, label) {
        this.id = host_id;
        this.label = label;
    }

    getD3jsData() {
        let nodeObj = {
            id: this.id,
            name: null,
            data: this,
            label: this.label,
            physics: true,
            stroke_width: 1,
            type: Host.TYPE
        };
        nodeObj.background_color = sdncolor.NODE_COLOR[nodeObj.type];

        return nodeObj;
    }

    getName() {
        return this.label;
    }

    /**
     * Host static function to generate a Host ID with the parameters.
     * @param {type} node_id
     * @param {type} port_id
     * @returns {String}
     */
    static createId(node_id, port_id) {
        if (node_id === null || node_id === "") {
            console.log("[ERROR] Host.createId node_id empty.");
            throw "[ERROR] Host.createId node_id empty.";
        }
        if (port_id === null || port_id === "") {
            console.log("[ERROR] Host.createId port_id empty.");
            throw "[ERROR] Host.createId port_id empty.";
        }

        return "host_" + node_id + "_" + port_id;
    }
}

/**
 * Host static TYPE property;
 * @type String
 */
Host.TYPE = "host";


export {
  Link as Link,
  Switch as Switch,
  Port as Port,
  Domain as Domain,
  Host as Host
};

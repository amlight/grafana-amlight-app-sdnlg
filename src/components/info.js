import {formatBits} from "./util";

/** @constant */
const REST_TRACE_TYPE = {'STARTING':'starting', 'LAST':'last', 'TRACE':'trace', 'INTERTRACE':'intertrace'};
/** @constant */
const REST_TRACE_REASON = {'ERROR':'error', 'DONE':'done', 'LOOP':'loop'};


class SDNDeviceInfo {
    constructor() {
        this._self = this;
        this.switchInfo = new SwitchInfo();
        this.portInfo = new PortInfo();
    }
}


/**
 * Switch information class.
 * It is used to send Switch information data to the Information table/panel.
 */
class SwitchInfo {
    constructor() {
        this._self = this;
    }

    show(data) {
        // hide port info panel. Otherwise it will show wrong association with switch data.
        $('#port_panel_info').hide();

        // show switch info panel.
        $('#switch_panel_info').show();
        // fill html content

        $('#switch_panel_info_dpid_value').html(data.dpid);
        let name = data.getName();
        if (name && name.length > 0) {
            $('#switch_panel_info_name').show();
            $('#switch_panel_info_name_value').html(name);
        } else {
            $('#switch_panel_info_name').hide();
        }

        $('#switch_panel_info_flows_value').html(data.number_flows);
        if (data.number_flows && data.number_flows > 0) {
            // Open flow panel clicking the flow number
            $('#switch_panel_info_flows')
                .css({
                    "cursor": "pointer",
                    "text-decoration": "underline"
                })
                .click(function() {
                    sdnflowtable.setDataAndOpen(data.dpid, data.flow_stat, data.flow_pivot);
                });
        }

        if (data.domain) {
            $('#switch_panel_info_domain').show();
            $('#switch_panel_info_domain_value').html(data.domain);
        } else {
            $('#switch_panel_info_domain').hide();
        }
        $('#switch_panel_info_tcp_port_value').html(data.tcp_port);
        $('#switch_panel_info_openflow_version_value').html(data.openflow_version);
        $('#switch_panel_info_switch_vendor_value').html(data.switch_vendor);
        $('#switch_panel_info_ip_address_value').html(data.ip_address);
        $('#switch_panel_info_color_value').html(data.switch_color);
    }

    /**
    Initialize form binds.
    Parameter: parent element
    */
    _init(elem) {
        _elem = elem;
    }
}

/**
 * Port information class.
 * It is used to send Port information data to the Information table/panel.
 */
class PortInfo {
    constructor() {
        this._self = this;
    }

    show(data) {

        $('#port_panel_info').show();
        let name = data.label;

        if (name && name.length > 0) {
            $('#port_panel_info_name').show();
            $('#port_panel_info_name_value').html(name);
        } else {
            $('#port_panel_info_name').hide();
        }

        $('#port_panel_info_number_value').html(data.number);
        $('#port_panel_info_speed_value').html(formatBits(data.speed));
        $('#port_panel_info_status_value').html(data.status);

        $('#port_panel_info_collisions_value').html(data.stats.collisions);

        $('#port_panel_info_rx_bytes_value').html(data.stats.rx_bytes);
        $('#port_panel_info_rx_crc_err_value').html(data.stats.rx_crc_err);
        $('#port_panel_info_rx_dropped_value').html(data.stats.rx_dropped);
        $('#port_panel_info_rx_errors_value').html(data.stats.rx_errors);
        $('#port_panel_info_rx_frame_err_value').html(data.stats.rx_frame_err);
        $('#port_panel_info_rx_over_err_value').html(data.stats.rx_over_err);
        $('#port_panel_info_rx_packets_value').html(data.stats.rx_packets);

        $('#port_panel_info_tx_bytes_value').html(data.stats.tx_bytes);
        $('#port_panel_info_tx_dropped_value').html(data.stats.tx_dropped);
        $('#port_panel_info_tx_errors_value').html(data.stats.tx_errors);
        $('#port_panel_info_tx_packets_value').html(data.stats.tx_packets);
    }

    /**
    Initialize form binds.
    Parameter: parent element
    */
    _init(elem) {
        _elem = elem;
    }
}


const sdndeviceinfo = new SDNDeviceInfo();


export {
  sdndeviceinfo as sdndeviceinfo
};

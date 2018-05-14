
/** @constant */
const REST_TRACE_TYPE = {'STARTING':'starting', 'LAST':'last', 'TRACE':'trace', 'INTERTRACE':'intertrace'};
/** @constant */
const REST_TRACE_REASON = {'ERROR':'error', 'DONE':'done', 'LOOP':'loop'};


class SDNDeviceInfo {
    constructor() {
        this._self = this;
        this.switchInfo = new SwitchInfo();
    }
}


class SwitchInfo {
    constructor() {
        this._self = this;
    }

    show(data) {
        $('#switch_panel_info').show();
        // fill html content

        $('#switch_panel_info_dpid_value').html(data.dpid);
        var name = data.getName();
        if (name && name.length > 0) {
            $('#switch_panel_info_name').show();
            $('#switch_panel_info_name_value').html(name);
        } else {
            $('#switch_panel_info_name').hide();
        }

        $('#switch_panel_info_flows_value').html(data.number_flows);
        if (data.number_flows && data.number_flows > 0) {
            // Open flow panel clicking the flow number
            $('#switch_panel_info_flows').css('cursor', 'pointer');
            $('#switch_panel_info_flows').css('text-decoration', 'underline');
            $('#switch_panel_info_flows').click(function() {
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
    }

    /**
     * Show trace form.
     * It also cleans and hides all the informations in the panel to display propperly the form.
     */
    showForm() {
        $('#sdn_trace_form_btn_new').hide();

        // Hide trace info
        _self.hideInfo();

        $('#sdn_trace_form_include_form').show();
        $('#sdn_trace_form_btn_close').show();
    }
}

const sdndeviceinfo = new SDNDeviceInfo();


export {
  sdndeviceinfo as sdndeviceinfo
};

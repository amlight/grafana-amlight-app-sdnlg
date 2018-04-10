import {SDNTopology} from './topologykytos';
import {ForceGraph, D3JS} from "./d3topology";
import {SDNColor} from "./topologycolor";
import {sdntraceform} from "./trace";

/* global Switch, DEBUG, d3, d3lib, MOCK */
//var sniffer = '';


//var sdnflowtable = '';

/* Initial data load */
/* Call ajax to load switches and topology */
var _initialDataLoad = function() {
    // Clearing contents
    $('#switches_select').html("<option>---</option>");
    $('#switch-ports-content').html('');
    $('#topology__elements__list').html('');

    // Hiding panels
    $('#switch-ports').hide();
    $('#trace-result-panel').hide();
    $('#topology__elements').hide();

//    // create the topology after loading the switches data
//    var getSwitchesCallback = sdntopology.callSdntraceGetTopology;
//
//    // load switches data
//    // Pass load topology function as a callback
//    sdntopology.callSdntraceGetSwitches(getSwitchesCallback);
    sdntopology.callSdntraceGetTopology();
};


/* Initial configuration */
var _initial_configuration = function() {
    if (typeof SDNLG_CONF != 'undefined') {
        // header logo img src
        $('#header__logo img').attr("src", SDNLG_CONF.header_logo_img_src);
        // header name
        // $('#header__name').text(SDNLG_CONF.header_name);
        // SDN LG version
        $('#about__version').text(SDNLG_CONF.version);
        $('#about__roadmap').html(SDNLG_CONF.about_roadmap);

        $('#dialogSniffer > iframe').attr("src", SDNLG_CONF.sniffer_dashboard)
    }
}

var _initial_event_handlers = function() {
    
    // Configure toolbar handlers
    // Topology port labels handler
    $('#topology__toolbar__btn__label__link').click(function() {
        if ($(this).hasClass("active")) {
            $('.target-label').hide();
            $('.source-label').hide();
            d3.selectAll(".node_port").style("display", "none");
            d3.selectAll(".text_port").style("display", "none");
        } else {
            $('.target-label').show();
            $('.source-label').show();
            d3.selectAll(".node_port").style("display", "");
            d3.selectAll(".text_port").style("display", "");
        }
    });
    // Topology speed link labels handler
    $('#topology__toolbar__btn__label__speed').click(function() {
        if ($(this).hasClass("active")) {
            $('.speed-label').hide();
        } else {
            $('.speed-label').show();
        }
    });

    // Button to clear trace elements
    $('#topology__toolbar__btn__clear_trace').click(function() {
        // clear interface trace elements
        sdntrace.clearTraceInterface();

        // redraw the graph
        forcegraph.draw();
    });

    // Button to show topology color
    $('#topology__toolbar__btn__colors').click(function() {
        if ($(this).hasClass("active")) {
            forcegraph.restore_topology_colors();
        } else {
            forcegraph.show_topology_colors();
        }
    });

    $('#menu_item_sniffer > a').click(function() {
        sniffer.dialogSniffer.dialog('open');
    });
}





var setForcegraph = function(p_forcegraph) {
    forcegraph = p_forcegraph;
}


/* Initial load */
var initialize_topology = function() {
    // Load js configuration data
//    _initial_configuration();

    // Initialize sniffer
//    sniffer = new Sniffer();



//    forcegraph = new ForceGraph(selector,data);
//    sdnflowtable = new SdnFlowTable();

//    _initial_event_handlers()

    // initial data load (switch list, topology, colors)
    _initialDataLoad();
}


var forcegraph = '';
var sdntopology = new SDNTopology();
var d3lib = new D3JS();
var sdncolor = new SDNColor();

export {
  forcegraph as forcegraph,
  setForcegraph as setForcegraph,
  sdntopology as sdntopology,
  sdncolor as sdncolor,
  d3lib as d3lib
};




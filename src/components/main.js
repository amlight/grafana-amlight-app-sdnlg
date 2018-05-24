import {SDNLG_CONF} from "./conf"
import {SDNTopology} from './topologykytos';
import {SDNColor} from "./topologycolor";
import {SDNFlowTable} from "./sdnflowtable";
import {ForceGraph, D3JS} from "./d3topology";
import {sdntraceform} from "./trace";

/* global Switch, DEBUG, d3, d3lib, MOCK */



var setForcegraph = function(p_forcegraph) {
    forcegraph = p_forcegraph;
}
var setForcegraphPersistency = function(p_forcegraphPersistency) {
    forceGraphPersistency = p_forcegraphPersistency;
}
var setSDNFlowTable = function(p_sdnflowtable) {
    sdnflowtable = p_sdnflowtable;
}
var getSDNFlowTable = function(p_sdnflowtable) {
    return sdnflowtable;
}



var Main = function() {

    var _self = this;



    this._appInitialized = false;
    this._appConfigLoading = false;
    this._initializationCallbacks = [];


    var _initialize_libs = function() {

    }


    var _load_configuration = function() {
        var ajaxDone = function(json) {


            // Setting kytos URL location
            SDNLG_CONF.setKytosServer(json.jsonData.kytos_url);
    //        SDNLG_CONF.trace_server = json.jsonData.kytos_url;

    //        if(callback) {
    //            callback();
    //        }

            _self._appConfigLoading = false;
            _self._appInitialized = true;

            for(var x in _self._initializationCallbacks) {
                _self._initializationCallbacks[x]();
            }

            _initialize_libs();

        };

        // AJAX call
        $.ajax({
            url: "/api/plugins/grafana-amlight-app-sdnlg/settings",
            dataType: 'json'
        })
        .done(function(json) {
            ajaxDone(json);
        })
        .fail(function() {
            console.log( "load_configuration ajax error" );
        })
        .always(function() {
            console.log( "load_configuration ajax complete" );
        });
    }



    this.initializeApp = function(callback) {
        if(_self._appInitialized) {
            callback();
            return;
        } else {
            _self._initializationCallbacks.push(callback);
            if(_self._appConfigLoading) {
               return;
            } else {
                _self._appConfigLoading = true;
                _load_configuration();
            }
        }
    }



    var Main = function(self) {
    }(this);
};


var forcegraph = '';
var forceGraphPersistency = '';
var sdntopology = new SDNTopology();
var d3lib = new D3JS();
var sdncolor = new SDNColor();
var sdnflowtable = '';

var main = new Main();

export {
  forcegraph as forcegraph,
  setForcegraph as setForcegraph,
  forceGraphPersistency as forceGraphPersistency,
  setForcegraphPersistency as setForcegraphPersistency,
  sdntopology as sdntopology,
  sdncolor as sdncolor,
  sdnflowtable as sdnflowtable,
  getSDNFlowTable as getSDNFlowTable,
  setSDNFlowTable as setSDNFlowTable,
  d3lib as d3lib,
  main as main
};




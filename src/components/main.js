import {SDNLG_CONF} from "./conf"
import {SDNTopology} from './topologykytos';
import {SDNColor} from "./topologycolor";
import {D3JS} from "./d3topology";


let setForcegraph = function(p_forcegraph) {
    forcegraph = p_forcegraph;
};
let setForcegraphPersistence = function(p_forcegraphPersistence) {
    forceGraphPersistence = p_forcegraphPersistence;
};
let setSDNFlowTable = function(p_sdnflowtable) {
    sdnflowtable = p_sdnflowtable;
};
let getSDNFlowTable = function(p_sdnflowtable) {
    return sdnflowtable;
};


/**
 * SDN LG Main class.
 * It is used to load configuration, initialize libraries, load initial data.
 */
class Main {
    constructor() {
        // flag to signal that the app was initialized
        this._appInitialized = false;
        // flag to signal that the app configuration is still loading
        this._appConfigLoading = false;
        // array of callbacks to call after initialization
        this._initializationCallbacks = [];
    }

    _initialize_libs() {
        //
    }

    /**
     * Load initial configuration.
     * Ex: load Kytos REST URL entrypoint
     * @private
     */
    _load_configuration() {
        let _self = this;
        let ajaxDone = function(json) {
            // Setting kytos URL location
            SDNLG_CONF.setKytosServer(json.jsonData.kytos_url);

            _self._appConfigLoading = false;
            _self._appInitialized = true;

            for(let callback of _self._initializationCallbacks) {
                callback();
            }

            _self._initialize_libs();
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
    };

    initializeApp(callback) {
        if(this._appInitialized) {
            callback();
            return;
        } else {
            this._initializationCallbacks.push(callback);
            if(this._appConfigLoading) {
               return;
            } else {
                this._appConfigLoading = true;
                this._load_configuration();
            }
        }
    };
}


let forcegraph = '';
let forceGraphPersistence = '';
let sdnflowtable = '';
const sdntopology = new SDNTopology();
const d3lib = new D3JS();
const sdncolor = new SDNColor();
const main = new Main();

export {
    forcegraph as forcegraph,
    setForcegraph as setForcegraph,
    forceGraphPersistence as forceGraphPersistence,
    setForcegraphPersistence as setForcegraphPersistence,
    sdntopology as sdntopology,
    sdncolor as sdncolor,
    sdnflowtable as sdnflowtable,
    getSDNFlowTable as getSDNFlowTable,
    setSDNFlowTable as setSDNFlowTable,
    d3lib as d3lib,
    main as main
};




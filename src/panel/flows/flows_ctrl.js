import {MetricsPanelCtrl} from 'app/plugins/sdk';

import 'lodash';
import _ from 'lodash';

import {SDNFlowTable} from  '../../components/sdnflowtable';
import {sdntopology, setSDNFlowTable, main, getSDNFlowTable} from '../../components/main';

import '../../external/tabulator_midnight.min.css!';
import '../../css/panel/tabulator_custom.css!';


const panelDefaults = {
    bgColor: null,
};

export class FlowsCtrl extends MetricsPanelCtrl {
    constructor($scope, $injector) {
        super($scope, $injector);
        _.defaults(this.panel, panelDefaults);

        this.panelContainer = null;
        this.scoperef = $scope;

        // used for initialization timeout
        this.initialize_timeout = false;

        // used in forms.html to store the selected switch field value
        this.selectedSwitch = "";

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
        this.events.on('panel-initialized', this.onInitialized.bind(this));
    }

    getSwitches() {
        return sdntopology.switches;
    }

    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/grafana-amlight-app-sdnlg/panel/flows/editor.html', 2);
    }

    onPanelTeardown() {
        this.$timeout.cancel(this.nextTickPromise);
    }

    /**
     * [setContainer description]
     * @param {[type]} container [description]
     */
    setContainer(container) {
        this.panelContainer = container;
    }

    onInitialized() {
        clearTimeout(this.initialize_timeout);

        // Verify if html has been loaded.
        if (document.getElementById('flow_stats_table')) {
            setSDNFlowTable(new SDNFlowTable());

            var _self = this;
            let callback = function() {
                setSDNFlowTable(new SDNFlowTable());
            };

            main.initializeApp(callback);

        } else {
            // if html isnt loaded, wait
            setTimeout(this.onInitialized, 250);
        }
    }

    link(scope, elem, attrs, ctrl) {
        ctrl.setContainer(elem.find('.panel-content'));
    }

    /**
    * onchange action on switch filter drop down.
    */
    selectSwitch() {
        let data = sdntopology.get_node_by_id(this.selectedSwitch.dpid);
        let callback = function() {
            getSDNFlowTable().setDataAndOpen(data.dpid, data.flow_stat, data.flow_pivot);
        };
        sdntopology.callSdntraceGetSwitchFlows(null, data.dpid, callback);
    }
}

FlowsCtrl.templateUrl = 'public/plugins/grafana-amlight-app-sdnlg/panel/flows/module.html';


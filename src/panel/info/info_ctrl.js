import {MetricsPanelCtrl} from 'app/plugins/sdk';
import * as _ from 'lodash';

import {sdntopology} from '../../components/main';
import '../../css/panel/sdnlg-panel.css!';


const panelDefaults = {
};

export class InfoCtrl extends MetricsPanelCtrl {
    constructor($scope, $injector) {
        super($scope, $injector);
        this.initialized = false;
        this.panelContainer = null;

        this.scoperef = $scope;

        // used in forms.html to store the selected switch field value
        this.selectedSwitch = "";
        // used in forms.html to store the selected switch port field value
        this.selectedSwitchPort = "";

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
        this.events.on('render', this.onRender.bind(this));

        this.events.on('component-did-mount', this.panelDidMount.bind(this));
    }

    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/grafana-amlight-app-sdnlg/panel/info/editor.html', 2);
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

    onRender() {
        console.log('render');
    }

    panelDidMount() {
        console.log('panelDidMount');
    }

    link(scope, elem, attrs, ctrl) {
        // force a render
        this.onRender();
    }

    getSwitches() {
        return sdntopology.switches;
    }

    getSwitchPorts(dpid) {
        return sdntopology.get_switch_ports(dpid);
    }
}


InfoCtrl.templateUrl = 'public/plugins/grafana-amlight-app-sdnlg/panel/info/module.html';

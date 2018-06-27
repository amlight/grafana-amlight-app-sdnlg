import {MetricsPanelCtrl} from 'app/plugins/sdk';

import 'lodash';
import _ from 'lodash';

import {sdntopology, sdncolor} from '../../components/main';
import {sdntrace, sdntraceform, sdntracecp, sdntracecpform} from "../../components/trace";

import '../../css/panel/sdnlg-panel.css!';


const panelDefaults = {
  traceColor: sdncolor.TRACE_COLOR_ACTIVE,
  tracecpColor: sdncolor.TRACECP_COLOR_ACTIVE
};

export class TraceCtrl extends MetricsPanelCtrl {
    constructor($scope, $injector) {
        super($scope, $injector);
        _.defaults(this.panel, panelDefaults);

        this.initialized = false;
        this.panelContainer = null;

        this.scoperef = $scope;

        this.traceColor;
        this.tracecpColor;

        // used in forms.html to store the selected switch field value
        this.selectedSwitch = "";
        // used in forms.html to store the selected switch port field value
        this.selectedSwitchPort = "";

        this.sdntraceform = sdntraceform;

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
        this.events.on('render', this.onRender.bind(this));
    }

    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/grafana-amlight-app-sdnlg/panel/trace/editor.html', 2);
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
    }

    onEdit() {
        // Load configuration color for trace control plane and data plane.
        sdntrace.configureColors(this.$scope.ctrl.panel.traceColor);
        sdntracecp.configureColors(this.$scope.ctrl.panel.tracecpColor);
    }

    link(scope, elem, attrs, ctrl) {
        ctrl.setContainer(elem.find('.panel-content'));
        // force a render
        this.render();

        // initialize trace form
        sdntraceform._init(elem.find('.panel-content'));
        sdntraceform.showForm();
        sdntrace.configureColors(this.$scope.ctrl.panel.traceColor);
        sdntracecp.configureColors(this.$scope.ctrl.panel.tracecpColor);
    }

    onClick_traceLayer2() {
        let jsonStr = sdntrace.buildTraceLayer2JSON();
        sdntrace.callTraceRequestId(jsonStr);
        sdntracecp.callTraceRequestId(jsonStr);
    }
    onClick_traceLayer3() {
        let jsonStr = sdntrace._build_trace_layer3_json();
        sdntrace.callTraceRequestId(jsonStr);
        sdntracecp.callTraceRequestId(jsonStr);
    }
    onClick_traceLayerFull() {
        let jsonStr = sdntrace._build_trace_layerfull_json();
        sdntrace.callTraceRequestId(jsonStr);
        sdntracecp.callTraceRequestId(jsonStr);
    }

    getSwitches() {
        return sdntopology.switches;
    }

    getSwitchPorts(dpid) {
        return sdntopology.get_switch_ports(dpid);
    }
}


TraceCtrl.templateUrl = 'public/plugins/grafana-amlight-app-sdnlg/panel/trace/module.html';

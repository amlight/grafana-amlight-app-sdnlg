import {MetricsPanelCtrl} from 'app/plugins/sdk';
import * as _ from 'lodash';

import {sdntopology} from '../../components/main';
import {sdntraceutil, sdntrace, sdntracecp, sdntraceform} from "../../components/trace";

import '../../css/panel/sdnlg-panel.css!';


const panelDefaults = {
  bgColor: null,
};

export class TraceCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    this.initialized = false;
    this.panelContainer = null;

    this.scoperef = $scope;

    // used in forms.html to store the selected switch field value
    this.selectedSwitch = "";
    // used in forms.html to store the selected switch port field value
    this.selectedSwitchPort = "";

    this.sdntraceform = sdntraceform;

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('render', this.onRender.bind(this));

    this.events.on('component-did-mount', this.panelDidMount.bind(this));
//    _.defaultsDeep(this.panel, panelDefaults);
    //this.events.on('panel-initialized', this.render.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/grafana-amlight-app-sdnlg/panel/topology/editor.html', 2);
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
    console.log('link');
    ctrl.setContainer(elem.find('.panel-content'));
    // force a render
    this.onRender();

    // initialize trace form
    sdntraceform._init(elem.find('.panel-content'));
  }


  onClickLayer2() {
    var jsonStr = sdntrace.buildTraceLayer2JSON();
    sdntrace.callTraceRequestId(jsonStr);
//    sdntracecp.callTraceRequestId(jsonStr);
  }
  onClickLayer3() {
    var jsonStr = sdntrace._build_trace_layer3_json();
    sdntrace.callTraceRequestId(jsonStr);
//        sdntracecp.callTraceRequestId(jsonStr);
  }
  onClickLayerFull() {
    var jsonStr = sdntrace._build_trace_layerfull_json();
    sdntrace.callTraceRequestId(jsonStr);
//        sdntracecp.callTraceRequestId(jsonStr);
  }
  getSwitches() {
    return sdntopology.switches;
  }

  getSwitchPorts(dpid) {
    return sdntopology.get_switch_ports(dpid);
  }



};


TraceCtrl.templateUrl = 'public/plugins/grafana-amlight-app-sdnlg/panel/trace/module.html';


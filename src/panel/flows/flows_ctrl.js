import {MetricsPanelCtrl} from 'app/plugins/sdk';

import 'lodash';
import _ from 'lodash';

import {SDNFlowTable} from  '../../components/sdnflowtable';
import {setSDNFlowTable, main} from '../../components/main';

import '../../external/tabulator_midnight.min.css!';
import '../../css/panel/tabulator_custom.css!';


const panelDefaults = {
  bgColor: null,
};

export class FlowsCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    _.defaults(this.panel, panelDefaults);

    // used for initialization timeout
    this.initialize_timeout = false;

    this.panelContainer = null;
    this.scoperef = $scope;

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('panel-initialized', this.onInitialized.bind(this));
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

  onRender() {
//    if(!this.initialized) {
//        setTimeout(this.onInitialized, 2000);
//    }
  }

  onInitialized() {
    clearTimeout(this.initialize_timeout);
    console.log('onInitialized');
    console.log(document.getElementById('flow_stats_table'));

    if (document.getElementById('flow_stats_table')) {
        setSDNFlowTable(new SDNFlowTable());

        var _self = this
        let callback = function() {
            setSDNFlowTable(new SDNFlowTable());
        };

        main.initializeApp(callback);

    } else {
      console.log('set timeout');
      setTimeout(this.onInitialized, 1000);
    }
  }

  link(scope, elem, attrs, ctrl) {
    ctrl.setContainer(elem.find('.panel-content'));

    // force a render
    this.onRender();
  }
};

FlowsCtrl.templateUrl = 'public/plugins/grafana-amlight-app-sdnlg/panel/flows/module.html';


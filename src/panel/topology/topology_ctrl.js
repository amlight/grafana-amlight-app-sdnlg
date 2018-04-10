import {MetricsPanelCtrl} from 'app/plugins/sdk';

import 'lodash';
import _ from 'lodash';

import * as d3 from '../../external/d3';
import {forcegraph, setForcegraph,  sdntopology, d3lib} from '../../components/main';
import {SDNTopology} from '../../components/topologykytos';
import {ForceGraph, D3JS} from "../../components/d3topology";

import '../../css/panel/sdnlg-panel.css!';

const panelDefaults = {
  bgColor: null,
  checkedLabelNodeDpid: true
};


export class TopologyCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    _.defaults(this.panel, panelDefaults);

    this.initialized = false;
    this.panelContainer = null;
    this.svg = null;
    this.scoperef = $scope;

    // Editor form. checkbox to toggle ports' labels
    this.checkedLabelLink;
    // Editor form. checkbox to toggle link speed labels
    this.checkedLabelSpeed;

    // Editor form. checkbox to toggle node labels
    this.checkedLabelNodeDpid = true;
    this.checkedLabelNodeName;
    this.checkedLabelNodeOFVersion;
    this.checkedLabelNodeVendor;
    this.checkedLabelNodeHardware;
    this.checkedLabelNodeSoftware;


    this._forcegraph = null;


    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('render', this.onRender.bind(this));
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

  getPanelWidth() {
    // locate this panel with jQuery
    var tmpPanelWidthCSS = $("div.panel > plugin-component > panel-plugin-amlight-sdnlg-app-panel > grafana-panel > div.panel-container ").css("width");
    tmpPanelWidthCSS = String(tmpPanelWidthCSS);


    var tmpPanelWidthPx = tmpPanelWidthCSS.replace("px","");
    var tmpPanelWidth = parseInt(tmpPanelWidthPx);
    // get our "span" setting
    var percentWidth = ((this.panel.span / 1.2) * 10) / 100;
    // calculate actual width
    var actualWidth = tmpPanelWidth * percentWidth;

    actualWidth = tmpPanelWidth - 20;

    return actualWidth;
  }

  getPanelHeight() {
    // panel can have a fixed height via options
    var tmpPanelHeight = this.$scope.ctrl.panel.height;
    // if that is blank, try to get it from our row
    if (typeof tmpPanelHeight === 'undefined') {
      // get from the row instead
      tmpPanelHeight = this.row.height;
      // default to 250px if that was undefined also
      if (typeof tmpPanelHeight === 'undefined') {
        tmpPanelHeight = "250px";
      }
    }
    tmpPanelHeight = String(tmpPanelHeight);
    // convert to numeric value
    tmpPanelHeight = tmpPanelHeight.replace("px","");
    var actualHeight = parseInt(tmpPanelHeight);
    // grafana minimum height for a panel is 250px
    if (actualHeight < 250) {
      actualHeight = 250;
    }
    return actualHeight;
  }


  onRender() {
  }

  /**
  * Show/hide topology port labels
  */
  togglePort() {
    if (this.$scope.ctrl.panel.checkedLabelLink) {
      $('.target-label').show();
      $('.source-label').show();
      d3.selectAll(".node_port").style("display", "");
      d3.selectAll(".text_port").style("display", "");
    } else {
      $('.target-label').hide();
      $('.source-label').hide();
      d3.selectAll(".node_port").style("display", "none");
      d3.selectAll(".text_port").style("display", "none");
    }
  }

  toggleLabels(checkedField, className) {
    if (checkedField) {
        $(className).show();
    } else {
        $(className).hide();
    }
  }

  /**
  * Show/hide topology link speed labels
  */
  toggleSpeed() {
    this.toggleLabels(this.$scope.ctrl.panel.checkedLabelSpeed, '.speed-label');
  }

  /**
  * Show/hide topology node labels
  */
  toggleNodeDpid() {
    this.toggleLabels(this.$scope.ctrl.panel.checkedLabelNodeDpid, '.text_switch_dpid');
  }
  toggleNodeName() {
    this.toggleLabels(this.$scope.ctrl.panel.checkedLabelNodeName, '.text_switch_name');
  }
  toggleNodeOFVersion() {
    this.toggleLabels(this.$scope.ctrl.panel.checkedLabelNodeOFVersion, '.text_switch_ofversion');
  }
  toggleNodeVendor() {
    this.toggleLabels(this.$scope.ctrl.panel.checkedLabelNodeVendor, '.text_switch_vendor');
  }
  toggleNodeHardware() {
    this.toggleLabels(this.$scope.ctrl.panel.checkedLabelNodeHardware, '.text_switch_hardware');
  }
  toggleNodeSofware() {
    this.toggleLabels(this.$scope.ctrl.panel.checkedLabelNodeSoftware, '.text_switch_software');
  }



  link(scope, elem, attrs, ctrl) {
    ctrl.setContainer(elem.find('.panel-content'));
    // force a render
    this.onRender();

    // use jQuery to get the height on our container
    this.panelWidth = this.getPanelWidth();
    this.panelHeight = this.getPanelHeight();

    var margin = {top: 10, right: 0, bottom: 30, left: 0};
    var width = this.panelWidth;
    var height = this.panelHeight;

    if (this._forcegraph === null) {

        var selector = this.panelContainer[0];

        var forceArgs = {
            selector: selector,
            width: width,
            height: height
        };
        var data = {
            nodes: [],
            links: []
        };

        setForcegraph(new ForceGraph(forceArgs, data));
    }

    sdntopology.callSdntraceGetTopology();

  }
};


TopologyCtrl.templateUrl = 'public/plugins/grafana-amlight-app-sdnlg/panel/topology/module.html';


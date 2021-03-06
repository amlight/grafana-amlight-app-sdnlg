import {MetricsPanelCtrl} from 'app/plugins/sdk';

import 'lodash';
import _ from 'lodash';

import * as d3 from '../../external/d3';
import {forcegraph, setForcegraph, setForcegraphPersistence, sdntopology, d3lib, main} from '../../components/main';
import {SDNTopology} from '../../components/topologykytos';
import {ForceGraph, ForceGraphPersistence, D3JS} from "../../components/d3topology";

import '../../css/panel/sdnlg-panel.css!';

const panelDefaults = {
  bgColor: null,
  checkedLabelNodeDpid: true,
  checkedLabelLink: false,
  checkedLabelSpeed: false
};


export class TopologyCtrl extends MetricsPanelCtrl {
    constructor($scope, $injector) {
        super($scope, $injector);
        _.defaults(this.panel, panelDefaults);

        this.panelContainer = null;
        this.svg = null;
        this.scoperef = $scope;

        // Editor form. checkbox to toggle ports' labels
        this.checkedLabelLink;
        // Editor form. checkbox to toggle link speed labels
        this.checkedLabelSpeed;

        // Editor form. checkbox to toggle node labels
        this.checkedLabelNodeDpid;
        this.checkedLabelNodeName;
        this.checkedLabelNodeOFVersion;
        this.checkedLabelNodeVendor;
        this.checkedLabelNodeHardware;
        this.checkedLabelNodeSoftware;

        this.graphPersistency;

        this._forcegraph = null;

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
        this.events.on('render', this.onRender.bind(this));
        this.events.on('panel-initialized', this.onInitialized.bind(this));
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
        let tmpPanelWidthCSS = $("div.panel > plugin-component > panel-plugin-amlight-sdnlg-app-panel > grafana-panel > div.panel-container ").css("width");
        tmpPanelWidthCSS = String(tmpPanelWidthCSS);

        let tmpPanelWidthPx = tmpPanelWidthCSS.replace("px","");
        let tmpPanelWidth = parseInt(tmpPanelWidthPx);
        // get our "span" setting
        let percentWidth = ((this.panel.span / 1.2) * 10) / 100;
        // calculate actual width
        let actualWidth = tmpPanelWidth * percentWidth;

        actualWidth = tmpPanelWidth - 20;

        return actualWidth;
    }

    getPanelHeight() {
        // panel can have a fixed height via options
        //var tmpPanelHeight = this.$scope.ctrl.panel.height;
        let tmpPanelHeight = this.$scope.ctrl.containerHeight;
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
        let actualHeight = parseInt(tmpPanelHeight);
        // grafana minimum height for a panel is 250px
        if (actualHeight < 250) {
          actualHeight = 250;
        }
        return actualHeight;
    }

    setTopologyContainerHeight() {
        let d3_container = $('#d3_svg_container');
        if (typeof d3_container !== 'undefined') {
          let height = this.getPanelHeight();
          d3_container.attr('height', height);
        }
    }

    onRender() {
        this.setTopologyContainerHeight();
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

            $(".text_port_name").show();

        } else {
            $('.target-label').hide();
            $('.source-label').hide();
            d3.selectAll(".node_port").style("display", "none");
            d3.selectAll(".text_port").style("display", "none");

            $(".text_port_name").hide();
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

    // Initialize controller visualization
    // **Be sure to load all the topology before calling this method.
    initializeController(_self) {
        let callback = function() {
            _self.togglePort();
            _self.toggleSpeed();
            _self.toggleNodeDpid();
            _self.toggleNodeName();
            _self.toggleNodeOFVersion();
            _self.toggleNodeVendor();
            _self.toggleNodeHardware();
            _self.toggleNodeSofware();
        };

        sdntopology.callSdntraceGetTopology(callback);
    }

    onInitialized() {
        var _self = this
        let callback = function() {
            _self.initializeController(_self);
            _self.setTopologyContainerHeight();
        };

        main.initializeApp(callback);
    }

    link(scope, elem, attrs, ctrl) {
        ctrl.setContainer(elem.find('.panel-content'));

        // force a render
        this.render();

        // use jQuery to get the height on our container
        this.panelWidth = this.getPanelWidth();
        this.panelHeight = this.getPanelHeight();

        let margin = {top: 10, right: 0, bottom: 30, left: 0};
        let width = this.panelWidth;
        let height = this.panelHeight;

        if (this._forcegraph === null) {

            let selector = this.panelContainer[0];

            let forceArgs = {
                selector: selector,
                width: width,
                height: height
            };
            let data = {
                nodes: [],
                links: []
            };

            setForcegraph(new ForceGraph(forceArgs, data));

            let graphPersistence = new ForceGraphPersistence(this.$scope.ctrl.panel, "graphPersistence");
            setForcegraphPersistence(graphPersistence);
        }
    }
}


TopologyCtrl.templateUrl = 'public/plugins/grafana-amlight-app-sdnlg/panel/topology/module.html';


import * as d3 from '../external/d3';
import {sdntopology, sdncolor, getSDNFlowTable, forcegraph, forceGraphPersistence, d3lib} from "./main";
import {Switch, Link, Port, Domain, Host} from "./domain";
import {sdndeviceinfo} from "./info";
import {formatBits} from "./util";

/** @constant */
const SPEED_100GB = 100000000000;
/** @constant */
const SPEED_10GB = 10000000000;
/** @constant */
const SPEED_1GB = 1000000000;

/** @constant */
const SIZE = {'switch': 16,
            'domain': 3,
            'port': 8,
            'host': 16};

/** @constant */
const SIZE_PATH = {'switch': 700,
            'domain': 700,
            'port': 80,
            'host': 700};

/** @constant */
const DISTANCE = {'domain': 10 * SIZE['switch'],
                'switch': 10 * SIZE['switch'],
                'port': SIZE['switch'] + 16,
                'host': 10 * SIZE['switch']};


let ForceGraphContextMenu = function() {
    // Define contextual menu over the circles
    this.nodeContextMenu = function(data) {
        forcegraph.endHighlight();
        return [
            {
                title: function(d) {
                    let sw = sdntopology.get_node_by_id(d.name);
                    return sw.id;
                },
                disabled: true
            },
            {
                divider: true
            },
            {
                title: function(d) {
                    let sw = sdntopology.get_node_by_id(d.name);
                    return 'Name: ' + sw.getName();
                },
                disabled: true
            },
// TODO: Expecting new info services
//            {
//                title: 'Interfaces (' + data.data.n_ports + ')',
//                action: function(elm, d, i) {
//                    sdntopology.callGetSwitchPorts(d.dpid, sdntopology._render_html_popup_ports);
//                }
//            },
//            {
//                title: 'Total traffic: 000',
//                action: function() {}
//            },
            {
                title: 'Flows',
                action: function(elm, d, i) {
                    let callback = function() {
                        let flowTable = getSDNFlowTable();
                        if (flowTable) {
                            flowTable.setDataAndOpen(d.data.dpid, d.data.flow_stat, d.data.flow_pivot);
                        }
                    };
                    sdntopology.callSdntraceGetSwitchFlows(null, d.data.dpid, callback);
                }
            },
            {
                title: 'Trace',
                action: function(elm, d, i) {
                    sdntopology.showTraceForm(d);
                }
            }
        ];
    };
    
    // Hide node context menu.
    this.hideContextMenu = function() {
        $('.d3-context-menu').hide();
    };
};


/**
 * Persistence class for the D3 graph.
 */
class ForceGraphPersistence {
    /**
     * Save the graph in a object elem and in the field fieldName
     * @param elem
     * @param fieldName
     */
    constructor(elem, fieldName) {
        this._self = this;
        this._elem = elem;
        this._fieldName = fieldName;
    }

    /**
     * Load the graph positions.
     * @returns {*}
     */
    load() {
        let prevLoc = [];

        if (this._elem && this._elem[this._fieldName]) {
            prevLoc = JSON.parse(this._elem[this._fieldName]);
            return prevLoc.data;
        }
    }

    /**
     * Save D3 data nodes.
     * Ex: d3.selectAll(".node")
     *
     * @param data D3 nodes.
     */
    save(data) {
        // Save node positions to an object:
        let prevLoc = [];

        data.each(function(d) {
            if (d && d.id) {
                prevLoc.push({'id':d.id, 'x':d.x, 'y':d.y});
            }
        });

        if (this._elem && prevLoc.length > 0) {
            this._elem[this._fieldName] = JSON.stringify({"data":prevLoc});
        }
    }
}



/**
 * This is the class that will create a D3 Forcegraph.
 * @param {type} p_args
 * @param {number} p_args.selector - HTML selector to create the SVG graph.
 * @param {number} p_args.width - SVG width.
 * @param {number} p_args.height - SVG height.
 *
 * @param {type} p_data Graph data
 * @returns {ForceGraph}
 */
let ForceGraph = function(p_args, p_data) {

    let _self = this;
    
    // Local variable representing the forceGraph data
    let _data = p_data;

    let highlight_transparency = 0.1;
    // highlight var helpers
    let focus_node = null;

    let min_zoom = 0.1;
    let max_zoom = 7;

    let selector = p_args.selector;
    let width = p_args.width ? p_args.width : "100%";
    let height = p_args.height ? p_args.height : "100%";

    // node/circle size
    d3.scaleLinear()
      .domain([1,100])
      .range([8,24]);
    let nominal_base_node_size = 8;

    let _linkedByIndex = new Map();

    let addConnection = function(a, b) {
        /**
         a: source switch dpid
         b: target switch dpid
        */
        _linkedByIndex.set(a + "-" + b, true);
    };

    let isConnected = function(a, b) {
        return _linkedByIndex.has(a.id + "-" + b.id) || _linkedByIndex.has(b.id + "-" + a.id) || a.id === b.id;
    };
    
    
    // context menu manager
    let forceGraphContextMenu = new ForceGraphContextMenu();

    // zoom behavior
    let zoomed = function(d) {
        container.attr("transform", "translate(" + d3.event_d3().transform.x + "," + d3.event_d3().transform.y + ") scale(" + d3.event_d3().transform.k + ")");
    };
    // zoom configuration
    let zoom = d3.zoom()
        .scaleExtent([min_zoom, max_zoom])
        .on("zoom", zoomed);

    // clear selector, otherwise it will append several SVG elements
    d3.select(selector).selectAll("svg").remove();

    // creating SVG tag. Need a width and height to proper display the topology.
    let svg = d3.select(selector)
        .append("svg")
            .attr("id", "d3_svg_container")
            .attr("width", width)
            .attr("height", height)
            .call(zoom);
    let container = svg.append("g");

    // ForceGraph set data. Remember to redraw the simulation after the set.
    this.data = function(value) {
        if ( typeof value === 'undefined') {
            // accessor
            return _data;
        }
        _data = value;

        return _data;
    };

    let collisionForce = d3.forceCollide(12)
        .strength(10)
        .iterations(20);

    let force = d3.forceSimulation()
        .force("link",
            d3.forceLink()
                .id(function(d) { return d.id; })
                .distance(function(d) {
                    if (d.edgetype === 's_p') {
                        return 0;
                    }
                    return DISTANCE['switch'];
                })
                .strength(0.1)
        )
        .force("collisionForce",collisionForce)
        .force("charge", d3.forceManyBody())
        .on("tick", ticked);

    // OBS: SVG Document order is important!
    // Draw order:
    //     links
    //     nodes
    //     labels

    // draw link paths
    let path = container.append("g")
        .attr("class", "paths")
        .selectAll("path");
    // switch node
    let node = container
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle");
    // domain node
    container
        .append("g")
        .attr("class", "domains")
        .selectAll("rect");
    // draw switch label
    let textSelection = container.append("g").selectAll("text");
    // draw link label
    let link_label = container.append("g").selectAll("text");


    /**
     * Node drag start event handler.
     * @param {type} d       D3 Node object
     * @param {type} d.type  Type of the node (ex: can be switch, port, domain)
     */
    let _nodeDragstarted = function (d) {
        // Prevent the Port node to be dragged.
        if (d.type === Port.TYPE) { return; }
        // Change the nodes alpha color to signal the user the drag event.
        if (!d3.event_d3().active) { force.alphaTarget(0.3).restart(); }
        
        // if node context menu is open, close it.
        forceGraphContextMenu.hideContextMenu();
    };

    /**
     * Node drag event handler.
     * @param {type} d       D3 Node object
     * @param {type} d.type  Type of the node (ex: can be switch, port, domain)
     * @param {type} d.fx    D3 Node fix X coordinate position
     * @param {type} d.fy    D3 Node fix Y coordinate position
     */
    let _nodeDragged = function (d) {
        // Prevent the Port node to be dragged.
        if (d.type === Port.TYPE) { return; }
        
        // Fix pin down X and Y coordinates.
        // Transform translate will not affect the position anymore.
        d.fx = d3.event_d3().x;
        d.fy = d3.event_d3().y;
    };

    /**
     * Node drag end event handler.
     * @param {type} d       D3 Node object
     * @param {type} d.type  Node type
     */
    let _nodeDragended = function (d) {
        // Prevent the Port node to be dragged.
        if (d.type === Port.TYPE) { return; }
        // Reset the nodes alpha color
        if (!d3.event_d3().active) force.alphaTarget(0);
        
        focus_node = null;
        _self.endHighlight(d);

        forceGraphPersistence.save(d3.selectAll(".node"));
    };

    /**
     * Start highlight node handler.
     * @param {type} d       D3 Node object
     */
    let _startHighlight = function(d) {
        svg.style("cursor","pointer");
        if (focus_node !== null) {
            d = focus_node;
        }
        node.attr("fill", function(o) {
            return isConnected(d, o) ? sdncolor.NODE_COLOR_HIGHLIGHT[o.type] : sdncolor.NODE_COLOR[o.type];});
//        text.style("font-weight", function(o) {
//            return isConnected(d, o) ? "bold" : "normal";});
        path.style("stroke", function(o) {
            return o.source.index === d.index || o.target.index === d.index ? sdncolor.LINK_COLOR_HIGHLIGHT['switch'] : sdncolor.LINK_COLOR['switch'];
        });
    };

    /**
     * End highlight node handler.
     * @param {type} d       D3 Node object
     * @returns {undefined}
     */
    this.endHighlight = function(d) {
        svg.style("cursor","move");
        node.attr("fill", function(o) { return o.background_color; })
            .style("opacity", 1);
            //.style(towhite, "white");
        path.style("opacity", 1)
            .style("stroke", function(o) { return sdncolor.LINK_COLOR[o.type]; });
//        text.style("font-weight", function(o) {
//            return isConnected(d, o) ? "bold" : "normal";});
        textSelection.style("opacity", 1);
    };

    // Show topology colors for Switches that are used to Trace
    // It is just to identify the difference in color field
    this.show_topology_colors = function() {
        let nodes = d3.selectAll(".node");
        nodes.attr("fill", function(d) {
            if(d.type === Switch.TYPE) {
                for (let x in sdncolor.colors) {
                    if (x === d.data.switch_color) {
                        return sdncolor.colors[d.data.switch_color];
                    }
                }
            }
            return d.background_color;
        });
    };
    
    this.restore_topology_colors = function() {
        let nodes = d3.selectAll(".node");
        nodes.attr("fill", function(d) {
            return d.background_color;
        });
    };

    /**
     * Focus on a clicked switch. (on node mousedown)
     * @param d D3 data object.
     */
    let focusSwitch = function(d) {
        // Set data info panel
        if(d && d.data) {
            // show all the switch data in the panel
            sdndeviceinfo.switchInfo.show(d.data);
        }

        // Set nodes and links opacity to all of them that are not connected to the clicked node
        if (highlight_transparency < 1) {
            node.style("opacity", function(o) {
                return isConnected(d, o) ? 1 : highlight_transparency;
            });
            textSelection.style("opacity", function(o) {
                return isConnected(d, o) ? 1 : highlight_transparency;
            });
            path.style("opacity", function(o) {
                return o.source.index === d.index || o.target.index === d.index ? 1 : highlight_transparency;
            });
        }
        // Set the focused node to the highlight color
        node.attr("fill", function(o) {
                return isConnected(d, o) ? sdncolor.NODE_COLOR_HIGHLIGHT[o.type] : sdncolor.NODE_COLOR[o.type];})
            .style("opacity", function(o) {
                return isConnected(d, o) ? 1 : highlight_transparency;
            });
    };

    /**
     * Focus highlight (on node mousedown)
     * @param {type} d       D3 Node object
     */
    let setPortFocus = function(d) {

        // Set data info panel
        if(d && d.data) {
            // show switch info.
            sdndeviceinfo.switchInfo.show(d.from_sw.data);
            sdndeviceinfo.portInfo.show(d.data);
        }
    };

    /**
     * Focus highlight (on node mousedown)
     * @param {type} d       D3 Node object
     */
    function set_domain_focus(d) {
        // Set data info panel
        if(d && d.data) {
            // hide switch info
            $('#switch_to_panel_info').hide();
            // hide port info
            $('#port_panel_info').hide();

            $('#switch_flows_panel').hide();

            // show domain info
            _setDomainFocusPanelData(d);
            $('#domain_panel_info_collapse').collapse("show");
        }
    }

    /**
     * Focus and show to the lateral domain panel data.
     * Use with setSwitchFocus to set the lateral panel data
     * @param {type} d       D3 Node object
     * @param {type} d.data  Data object related to the node (ex: switch, port, domain)
     */
    let _setDomainFocusPanelData = function(d) {
        $('#domain_panel_info').show();
        $('#domain_panel_info_collapse').collapse("show");
        $('#domain_panel_info_dpid_value').html(d.data.domain);
        let name = d.data.getName();

        if (name && name.length > 0) {
            $('#domain_panel_info_name').show();
            $('#domain_panel_info_name_value').html(name);
        } else {
            $('#domain_panel_info_name').hide();
        }
    };

    /**
     * Function to calculate the radius position from point C to point D.
     * 
     * @param {type} cx
     * @param {type} cy
     * @param {type} dx
     * @param {type} dy
     * @returns {Array}
     */
    let radiusPositioning = function(cx, cy, dx, dy) {
        let delta_x = dx - cx;
        let delta_y = dy - cy;
        let rad = Math.atan2(delta_y, delta_x);
        let new_x = cx + Math.cos(rad) * DISTANCE['port'];
        let new_y = cy + Math.sin(rad) * DISTANCE['port'];

        return [new_x, new_y];
    };

    /**
     * Function to calculate the link position arc between source and target.
     * It is used in the tick transformation.
     * @param {type} d          D3 Node object
     * @param {type} d.source   Source link node
     * @param {type} d.target   Target link node
     */
    function linkArc(d) {
        d3.selectAll("line")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
    function transformNode(d) {
        let return_val = '';
        if (d.type === Port.TYPE) {
            let new_positions = radiusPositioning(d.from_sw.x, d.from_sw.y, d.to_sw.x, d.to_sw.y);
            let dx = new_positions[0];
            let dy = new_positions[1];
            return_val = "translate(" + dx + "," + dy + ")";
        } else {
            return_val = "translate(" + d.x + "," + d.y + ")";
        }
        return return_val;
    }
    function transformLabel(d) {
        let return_val = '';
        let dx = d.x;
        let dy = d.y;
        if (d.type === Port.TYPE) {
            let new_positions = radiusPositioning(d.from_sw.x, d.from_sw.y, d.to_sw.x, d.to_sw.y);
            dx = new_positions[0];
            dy = new_positions[1];
            return_val = "translate(" + dx + "," + dy + ")";
        } else {
            dx = dx - SIZE[d.type] / 2.0;
            return_val = "translate(" + dx + "," + dy + ")";
        }
        return return_val;
    }
    function transformLinkSourceLabel(d) {
        let new_positions = radiusPositioning(d.source.x, d.source.y, d.target.x, d.target.y);
        let dx = new_positions[0] - SIZE['port'];
        let dy = new_positions[1] + SIZE['port']/2.0;
        return "translate(" + dx + "," + dy + ")";
    }
    function transformLinkTargetLabel(d) {
        let new_positions = radiusPositioning(d.target.x, d.target.y, d.source.x, d.source.y);
        let dx = new_positions[0];
        let dy = new_positions[1];
        return "translate(" + dx + "," + dy + ")";
    }
    function transformLinkSpeedLabel(d) {
        // Do not move if the label is empty.
        if (d.speed) {
            let dx = (d.source.x - d.target.x) * 0.5;
            let dy = (d.source.y - d.target.y) * 0.5;
            return "translate(" + (d.target.x + dx) + "," + (d.target.y + dy) + ")";
        }
    }

    // Use elliptical arc path segments to doubly-encode directionality.
    function ticked(d) {
        d3.selectAll("line").attr("d", linkArc);
        d3.selectAll(".node").attr("transform", transformNode);
        d3.selectAll(".domain").attr("transform", transform);
        d3.selectAll(".node_text").attr("transform", transformLabel);
        d3.selectAll(".speed-label").attr("transform", transformLinkSpeedLabel);
    }

    /**
     * Load the topology previous positions.
     */
    function loadPositions() {
        // Load the previous graph positions
        let prevLoc = forceGraphPersistence.load();

        if (prevLoc) {
            // try to fix the position for every node.
            d3.selectAll(".node").each(function (d) {
                let oldX = 0;
                let oldY = 0;

                // find the node
                let prev = null;
                for (let location of prevLoc) {
                    if (location.id === d.id) {
                        oldX = location.x;
                        oldY = location.y;
                        break;
                    }
                }

                // if the node exists, set the fixed location
                if (oldX !== 0 || oldY !== 0) {
                    d.fx = oldX;
                    d.fy = oldY;
                }
            });
        }
    }

    this.draw = function() {
        force.stop();

        // Check to know if two nodes are connected
        for (let link of _data.links) {
            if (!isConnected(link.source, link.target)) {
                addConnection(link.source, link.target);
            }
        }

        // draw link paths
        path = path.data(_data.links, function(d) { return d.id; });
        path.exit().remove();
        path = path
            .enter()
                .append("line")
                    .attr("id", function(d) {
                        return "link-" + d.id;
                    })
                    .attr("class", function(d) {

                        let return_var = "";
                        if (d.speed >= SPEED_100GB) {
                            return_var = return_var + " link-path link-large";
                        } else if (d.speed >= SPEED_10GB) {
                            return_var = return_var + " link-path link-medium";
                        } else if (d.speed >= SPEED_1GB) {
                            return_var = return_var + " link-path link-thin";
                        }
                        return_var = return_var + " link-path link " + (d.type||"");

                        return return_var;
                    })
                    .attr("marker-end", function(d) { return "url(#" + (d.type||"") + ")"; })
                    .style("stroke", function(d) {
                        if (d.edgetype === 's_p') {
                            return '#fff';
                        }
                        return d.color;
                    })
                    .merge(path);

        // switch draw
        node = node.data(_data.nodes, function(d) { return d.id;});
        node.exit().remove();
        node = node
            .enter()
                .append("path")
                .attr("d", d3.symbol()
                    .type(function(d) {
                        if (d.type === Domain.TYPE) { return d3.symbolWye; }
                        else if (d.type === Host.TYPE) { return d3.symbolSquare; }
                        return d3.symbolCircle;
                    })
                    .size(function(d) { return (SIZE_PATH[d.type]); }))
                .attr("id", function(d) { return "node-" + d.id; })
                .attr("r", function(d) { return SIZE[d.type]||nominal_base_node_size; })
                .attr("fill", function(d) { return d.background_color; })
                .attr("class", function(d) {
                    if (d.type === Port.TYPE) { return " node node_port"; }
                    return "node";
                })
                .style("display", function(d) {
                    if (d.type === Port.TYPE) { return "none"; }
                    return "";
                })
                .on('contextmenu', d3.contextmenu(forceGraphContextMenu.nodeContextMenu)) // attach menu to element
                .on("mouseover", function(d) {
                    if (d.type === Port.TYPE) { return; }
                    if (d.type === Switch.TYPE) { _startHighlight(d); }
                })
                .on("mousedown", function(d) {
                    d3.event_d3().stopPropagation();

                    if (d.type === Port.TYPE) {
                        setPortFocus(d);
                    } else if (d.type === Switch.TYPE) {
                        // focus_node to control highlight events
                        focus_node = d;
                        focusSwitch(d);
                    } else if (d.type === Domain.TYPE) {
                        // focus_node to control highlight events
                        focus_node = d;
                        set_domain_focus(d);
                    }
                })
                .on("mouseout", function(d) {
                    if (d.type === Port.TYPE) { return; }
                    if (focus_node === null) { _self.endHighlight(d); }
                })
                .on("click", function(d) {
                    if (d.type === Port.TYPE) { return; }
                    focus_node = null;
                    _self.endHighlight(d);
                })
                .on("dblclick.zoom", function(d) {
                    d3.event_d3().stopPropagation();
                })
                .call(d3.drag()
                    .on("start", _nodeDragstarted)
                    .on("drag", _nodeDragged)
                    .on("end", _nodeDragended))
                .merge(node);


        let addNodeText = function(d, i) {
          let textTag = d3.select(this)
                            .append("text")
                                .attr("class", function(d) {
                                    if (d.type === Port.TYPE) { return "node_text text_port"; }
                                    return "node_text";
                                })
                                .attr("x", 0)
                                .attr("y", ".1em")
                                .style("display", function(d) {
                                    if (d.type === Port.TYPE) { return "none"; }
                                    return "";
                                });

          let addNodeTspanAttr = function(selection, attr, className, display) {
                  selection
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", 15)
                    .attr("class", className)
                    .style("display", display)
                    .text(attr);
          };


          if(d.obj && typeof d.obj.dpid !== "undefined") {
            addNodeTspanAttr(textTag, d.obj.dpid, 'text_switch_dpid', "");
          }
          if(d.obj && typeof d.obj.name !== "undefined") {
            if (d.type === Port.TYPE) {
                addNodeTspanAttr(textTag, d.obj.label, 'text_port_name', "none");
            } else {
                addNodeTspanAttr(textTag, d.obj.name, 'text_switch_name', "none");
            }
          }
          if(d.obj && typeof d.obj.openflow_version !== "undefined") {
            addNodeTspanAttr(textTag, d.obj.openflow_version, 'text_switch_ofversion', "none");
          }
          if(d.obj && typeof d.obj.switch_vendor !== "undefined") {
            addNodeTspanAttr(textTag, d.obj.switch_vendor, 'text_switch_vendor', "none");
          }
          if(d.obj && typeof d.obj.hardware !== "undefined") {
            addNodeTspanAttr(textTag, d.obj.hardware, 'text_switch_hardware', "none");
          }
          if(d.obj && typeof d.obj.software !== "undefined") {
            addNodeTspanAttr(textTag, d.obj.software, 'text_switch_software', "none");
          }

          d3.select(this)
            .merge(textSelection);
        };


        // draw switch label
        let textNodes = textSelection.data(_data.nodes, function(d) { return d.id;});
        textNodes.exit().remove();
        let textTags = textNodes
            .enter()
                .each(addNodeText);

        // draw link label
        link_label = link_label.data(_data.links);
        link_label.exit().remove();
        link_label = link_label
            .enter()
                .append("text")
                    .attr("class", "speed-label")
                        .append("tspan")
                            .attr("dx", 0)
                            .attr("dy", 0)
                            .text(function(d) { return formatBits(d.speed); })
                    .merge(link_label);

        // setting data
        force.force("link").links(_data.links, function(d) { return d.source.id + "-" + d.target.id; });
        force.nodes(_data.nodes, function(d) { return d.id;});

        // load nodes positions
        loadPositions();

        force.restart();
    };
};


/**
 * Class to intermediate the communication between D3 library and other scripts.
 * It manages the data related to nodes and edges and prepare all data to 
 * be sendo forward to the D3 lib.
 * 
 * @returns {D3JS}
 */
let D3JS = function() {
    let _self = this;
    
    this.nodes = null;
    this.edges = null;

    this.findNode = function(p_id) {
        let id = '';
        // Check if the p_id is an object or the real ID attribute
        if ( typeof p_id.id === 'undefined') {
            id = p_id;
        } else {
            id = p_id.id;
        }

        // looking for existing node.
        for (let node of this.nodes){
            if (node && node.id === id) {
                 return node;
            }
        }
        return null;
    };

    this.hasNode = function(p_id) {
        let findNodeObj = this.findNode(p_id);
        return (findNodeObj !== null);
    };

    this.removeNode = function(id) {
        // Delete the node from the array
        for (let k in this.nodes){
            if (this.nodes.hasOwnProperty(k) && this.nodes[k] && this.nodes[k].id === id) {
                 this.nodes.splice(k, 1);
            }
        }
        // Delete the edges related to the deleted node
        for (let k in this.edges){
            if (this.edges.hasOwnProperty(k) && this.edges[k]) {
                if (this.edges[k].source.id === id || this.edges[k].target.id === id)
                 this.edges.splice(k, 1);
            }
        }
        return null;
    };
    
    
    this.addNewNodeHost = function(p_dpid, p_port_id, p_label="") {
        if (this.nodes) {
            let _host_id = Host.createId(p_dpid, p_port_id);
            for (let node of this.nodes) {
                if(node.id === _host_id) {
                    // do nothing
                    return node;
                }
            }
        } else {
            this.nodes = [];
        }

        let host_id = Host.createId(p_dpid, p_port_id);
        let host_obj = new Host(host_id, p_label);

        sdntopology.domains.push(host_obj);

        if (this.nodes) {

            // create an array with nodes
            _createNetworkNodes(false, false, true);

            let data = forcegraph.data();
            data.nodes = this.nodes;

            // Draw the d3js graph
            forcegraph.draw();
        }

        return host_obj;
    };

    this.addNewNodeDomain = function(id=null, label="") {
        let domain_id = Domain.createId(id);

        if(this.nodes) {
            for (let node of this.nodes) {
                if(node.id === domain_id) {
                    // do nothing
                    return node;
                }
            }
        } else {
            this.nodes = [];
        }

        let domain_obj = new Domain(domain_id);
        domain_obj.label = label;

        sdntopology.domains.push(domain_obj);

        // create an array with nodes
        _createNetworkNodes(false, false, true);

        let data = forcegraph.data();
        data.nodes = this.nodes;

        // Draw the d3js graph
        forcegraph.draw();

        return domain_obj;
    };

    this.addNewLink = function(id_from, id_to, prefix_id="", label="") {
        let node_from = sdntopology.get_node_by_id(id_from);
        let node_to = sdntopology.get_node_by_id(id_to);

        let _link = sdntopology.get_topology_link(node_from, node_to, prefix_id);

        if (_link === null) {
            _link = {node1: node_from , node2:node_to, prefix_id:prefix_id, label1:label, label2:label, speed:""};

            sdntopology.add_topology(_link);

            // create an array with edges
            _createNetworkEdges(false, false, true);

            let data = forcegraph.data();
            data.links = this.edges;
            data.edges_data = this.edges;

            // Draw the d3js graph
            forcegraph.draw();
        }
    };

    this.addNewNode = function(p_dpid=null, p_label="", p_domain=null) {
        let _hasSwitch = function(p_id) {
            for(let _switch of sdntopology.switches) {
                if(_switch.id === p_id) {
                    return true;
                }
            }
            return false;
        };
        let with_colors = typeof with_colors !== 'undefined' ? with_colors : true;
        let with_trace = typeof with_trace !== 'undefined' ? with_trace : true;

        let _dpid = "";
        if (p_dpid) {
            _dpid = p_dpid;
        }

        if (_hasSwitch(_dpid)) {
            return;
        }

        let _switch_obj = new Switch(_dpid);
        if (p_label) { _switch_obj.name = p_label; }
        if (p_domain) { _switch_obj.domain = p_domain; }

        sdntopology.switches.push(_switch_obj);

        // create an array with nodes
        _createNetworkNodes(with_colors, with_trace, true);

        let data = forcegraph.data();
        data.nodes = this.nodes;

        forcegraph.draw();
    };

    this.resetAllNodes = function() {
        if (this.nodes) {
            this.nodes = [];
        }
        if (this.edges) {
            this.edges = [];
        }
    };

    this.startNodeActivate = function(p_id) {
        let css_selector = document.getElementById("node-" + p_id);
        $(css_selector).addClass("node-trace-active");

        for (let k in this.nodes){
            if (this.nodes[k].id === p_id) {
                this.nodes[k].isActive = true;
                break;
            }
        }
    };

    this.startPathActivate = function(p_id_from, p_id_to) {
        let css_selector = document.getElementById("link-" + p_id_from +"-"+ p_id_to);
        $(css_selector).addClass("link-trace-active link-trace-active-color");

        css_selector = document.getElementById("link-" + p_id_to +"-"+ p_id_from);
        $(css_selector).addClass("link-trace-active link-trace-active-color");

        //
        // for (var k in this.nodes){
        //     if (this.nodes[k].id === id) {
        //          this.data.isActive = true;
        //     }
        // }
        // Delete the edges related to the deleted node
        for (let k in this.edges){
            if (this.edges.hasOwnProperty(k) && this.edges[k]) {
                if (this.edges[k].source.id === p_id_from && this.edges[k].target.id === p_id_to) {
                    this.edges[k].isActive = true;
                    break;
                }

                if (this.edges[k].source.id === p_id_to && this.edges[k].target.id === p_id_from) {
                    this.edges[k].isActive = true;
                    break;
                }
            }
        }
    };

    this.startPathCPActivate = function(p_id_from, p_id_to) {
        let css_selector = document.getElementById("link-CP" + p_id_from +"-"+ p_id_to);
        $(css_selector).addClass("link-tracecp-active link-tracecp-active-color");

        css_selector = document.getElementById("link-CP" + p_id_to +"-"+ p_id_from);
        $(css_selector).addClass("link-tracecp-active link-tracecp-active-color");

        for (let k in this.edges){
            if (this.edges.hasOwnProperty(k) && this.edges[k]) {
                if (this.edges[k].source.id === p_id_from && this.edges[k].target.id === p_id_to) {
                    this.edges[k].isCPActive = true;
                    break;
                }

                if (this.edges[k].source.id === p_id_to && this.edges[k].target.id === p_id_from) {
                    this.edges[k].isCPActive = true;
                    break;
                }
            }
        }
    };

    this.clearActivate = function() {
        for(let k in this.nodes){
            if (this.nodes.hasOwnProperty(k)) {
                this.nodes[k].data.isActive = false;
            }
        }

        $("path").removeClass("node-trace-active node-trace-active-color");
        $("line").removeClass("link-trace-active link-trace-active-color")
                 .removeClass("link-tracecp-active link-tracecp-active-color");
    };


    /**
     * Create D3JS network nodes.
     * We use the sdntopology.switch list to create the nodes and expect that the topology will have the same
     * node identification to draw the network edges.
     * @param {type} with_colors
     * @param {type} with_trace
     * @param {type} p_updateCurrent Flag to signal to update the internal node data.
     */
    let _createNetworkNodes = function(with_colors, with_trace, p_updateCurrent=false) {
        // create an array with nodes
        let nodesArray = [];
        for (let x = 0; x < sdntopology.switches.length; x++) {
            // positioning in spiral mode to help the physics animation and prevent crossing lines
            let nodeObj = sdntopology.switches[x].getD3jsData();

            if (p_updateCurrent) {
                for (let y = 0; y < _self.nodes.length; y++) {
                    if (_self.nodes[y].id === nodeObj.id) {
                        nodeObj = _self.nodes[y];
                    }
                }
            }

            nodesArray.push(nodeObj);
        }
        for (let x = 0; x < sdntopology.domains.length; x++) {
            // positioning in spiral mode to help the physics animation and prevent crossing lines
            let nodeObj = sdntopology.domains[x].getD3jsData();

            if (p_updateCurrent) {
                for (let y = 0; y < _self.nodes.length; y++) {
                    if (_self.nodes[y].id === nodeObj.id) {
                        nodeObj = _self.nodes[y];
                    }
                }
            }
            nodesArray.push(nodeObj);
        }
        _self.nodes = nodesArray;
    };

    /**
     * Create D3JS network edges.
     * This function can be used to create the topology, topology with color and
     * topology with tracing.
     * @param {type} with_colors
     * @param {type} with_trace
     * @param {type} p_updateCurrent Flag to signal to update the internal node data.
     * @returns {undefined}
     */
    let _createNetworkEdges = function(with_colors, with_trace, p_updateCurrent=false) {
        let edgesArray = [];

        // verify topology to create edges
        for (let x = 0; x < sdntopology.topologies.length; x++) {
            let link_prefix_id = sdntopology.topologies[x].prefix_id;

            let nodeFromId = sdntopology.topologies[x].node1;
            let nodeToId = sdntopology.topologies[x].node2;

            let labelFrom = sdntopology.topologies[x].label1;
            let labelTo = sdntopology.topologies[x].label2;

            let labelNumberFrom = sdntopology.topologies[x].label_num1;
            let labelNumberTo = sdntopology.topologies[x].label_num2;

            let speed = sdntopology.topologies[x].speed;

            let source = _self.findNode(nodeFromId) || _self.nodes.push({id:nodeFromId, dpid:nodeFromId, name: nodeFromId});
            let target = _self.findNode(nodeToId) || _self.nodes.push({id:nodeToId, dpid:nodeToId, name: nodeToId});

            let edgeId = (link_prefix_id||"") + source.id + "-" + target.id;
            let sourceLabel = {name: labelFrom, num: labelNumberFrom};
            let targetLabel = {name: labelTo, num: labelNumberTo};

            let edgeObj = {id:edgeId, name:x, source: source, target: target, source_label:sourceLabel, target_label:targetLabel, speed:speed, prefix_id:link_prefix_id};
            edgeObj.color = sdncolor.LINK_COLOR['switch'];

            // Update current link instead of creating a new one
            if (p_updateCurrent) {
                for (let y = 0; y < _self.edges.length; y++) {
                    if (_self.edges[y].id === edgeObj.id) {
                        edgeObj = _self.edges[y];
                    }
                }
            }

            edgesArray.push(edgeObj);

            // adding port as a node
            let node_port_obj_from = null;
            let node_port_obj_to = null;

            if (nodeFromId.ports && nodeFromId.ports.length > 0 && nodeFromId.ports[0]) {
                node_port_obj_from = nodeFromId.ports[0].getD3jsData();
                node_port_obj_from.from_sw = source;
                node_port_obj_from.to_sw = target;

                if(!_self.hasNode(node_port_obj_from.id)) {
                    _self.nodes.push(node_port_obj_from);
                }
            }

            if (nodeToId.ports && nodeToId.ports.length > 0 && nodeToId.ports[0]) {
                node_port_obj_to = nodeToId.ports[0].getD3jsData();
                node_port_obj_to.from_sw = target;
                node_port_obj_to.to_sw = source;

                if(!_self.hasNode(node_port_obj_to.id)) {
                    _self.nodes.push(node_port_obj_to);
                }
            }
        }

        _self.edges = edgesArray;
    };

    let _renderNetwork = function(with_colors, with_trace) {
        with_colors = typeof with_colors !== 'undefined' ? with_colors : true;
        with_trace = typeof with_trace !== 'undefined' ? with_trace : true;

        // create an array with nodes
        _createNetworkNodes(with_colors, with_trace);

        // create an array with edges
        _createNetworkEdges(with_colors, with_trace);

        let data = {
            nodes: _self.nodes,
            links: _self.edges,
            edges_data: _self.edges
        };

        // creating Force Graph nodes
        // Set the new data
        forcegraph.data(data);
        // Create the graph object
        // Having myGraph in the global scope makes it easier to call it from a json function or anywhere in the code (even other js files).
        forcegraph.draw();
        // Draw the graph for the first time
    };

    /**
     * Render topology using topology data saved in sdntopology object.
     * It uses the vis.js graph library.
     * You must load the sdntopology switch and topology data before trying to render the topology.
     */
    this.render_topology = function() {
        _renderNetwork(false, false);
    };

};


export {
  ForceGraph as ForceGraph,
  ForceGraphContextMenu as ForceGraphContextMenu,
  ForceGraphPersistence as ForceGraphPersistence,
  D3JS
};




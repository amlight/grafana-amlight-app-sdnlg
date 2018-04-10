
/* global Switch, DEBUG, d3, d3lib, MOCK */

/**
 * SDNColor utility to transform SDN color codes to CSS names.
 */
var SDNColor = function() {
    this.colors = {'1':'darkseagreen', '10':'dodgerblue', '11':'chocolate', '100':'darkorange', '101':'darkviolet', '110':'darkturquoise', '111':'black' };
    this.trace_color_on = '#1AC91A';
    this.trace_color_off = 'lightgray';

    this.color_default = '#8EB5EA';

    this.NODE_COLOR = {'host': 'rgb(192,231,255)',
                       'domain': '#847DAF',
                       'switch': '#8EB5EA',
                       'port': "#0cc"};
    this.NODE_COLOR_HIGHLIGHT = {'domain': "#4D7C9D",
                                 'host': "#4D7C9D",
                                 'switch': "#4D7C9D",
                                 'port': "#007C9D"};

    //var NODE_BORDER_COLOR = {'switch': 30,
    //                         'port': 5};

    this.LINK_COLOR = {'domain': "#888",
                       'host': "#888",
                       'switch': "#888",
                       'port': "#888"};
    //var NODE_BORDER_COLOR_HIGHLIGHT = {'switch': 30,
    //                                   'port': 5};
    this.LINK_COLOR_HIGHLIGHT = {'domain': "#4D7C9D", 'host': "#4D7C9D", 'switch': "#4D7C9D"};
    this.LINK_COLOR_HIDE = {'domain': 'white', 'host': 'white', 'switch': 'white'};

    /**
     * Get color CSS name.
     * @param {type} code binary color code
     * @returns {val} CSS color name
     */
    this.get_color = function(code) {
        var result = null;
        $.each( this.colors, function( key, val ) {
            if (key === code) {
                result = val;
            }
        });
        return result;
    };
};

export {
  SDNColor as SDNColor
};



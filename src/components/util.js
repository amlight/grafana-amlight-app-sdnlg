
/**
 * Helper function to remove duplicates from an array.
 * @param {type} p_array
 * @returns {Array}
 */
var arrayRemoveDuplicates = function(p_array) {
    var seen = {};
    var out = [];
    var len = p_array.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
        var item = p_array[i];
        if(seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
};

/*
 * Helper function to remove attributes with empty values from a json object.
 */
var removeEmptyJsonValues = function(obj) {
    for (var i in obj) {
        for (var j in obj[i]) {
            for (var w in obj[i][j]) {
                if (obj[i][j][w] === null || obj[i][j][w] === '') {
                    delete obj[i][j][w];
                }
            }
            if (jQuery.isEmptyObject(obj[i][j])) {
                delete obj[i][j];
            }
        }
        if (jQuery.isEmptyObject(obj[i])) {
            delete obj[i];
        }
    }
    return obj;
};

var isMacAddress = function(str) {
    var patt = new RegExp("^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$");
    var res = patt.test(str);
    return res;
}

export {
  arrayRemoveDuplicates as arrayRemoveDuplicates,
  removeEmptyJsonValues as removeEmptyJsonValues,
  isMacAddress as isMacAddress
};

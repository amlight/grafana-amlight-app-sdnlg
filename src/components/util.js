/**
 * Helper function to remove duplicates from an array.
 * @param {type} p_array
 * @returns {Array}
 */
let arrayRemoveDuplicates = function(p_array) {
    let seen = {};
    let out = [];
    let len = p_array.length;
    let j = 0;
    for(let i = 0; i < len; i++) {
        let item = p_array[i];
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
let removeEmptyJsonValues = function(obj) {
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

let isMacAddress = function(str) {
    let patt = new RegExp("^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$");
    let res = patt.test(str);
    return res;
};


function formatBytes(x){
  const units = ['', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = 0, number = parseInt(x, 10) || 0;

  while(number >= 1024 && ++i) {
      number = number/1024;
  }

  return(number.toFixed(number >= 10 || i < 1 ? 0 : 1) + ' ' + units[i]);
}

function formatBits(x){
  const units = ['', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
  let i = 0, number = parseInt(x, 10) || 0;

  while(number >= 1000 && ++i) {
      number = number/1000;
  }

  return(number.toFixed(number >= 10 || i < 1 ? 0 : 1) + ' ' + units[i]);
}

function injectStyles(p_id, p_rule) {
  // remove old styles
  let elem = document.getElementById(p_id);
  if(elem) {
    elem.parentNode.removeChild(elem);
  }

  // Works in IE6
  let div = document.createElement('div');
  div.id = p_id;
  div.innerHTML = '&shy;<style>' + p_rule + '</style>';
  document.body.appendChild(div.childNodes[1]);
}

export {
  arrayRemoveDuplicates as arrayRemoveDuplicates,
  removeEmptyJsonValues as removeEmptyJsonValues,
  isMacAddress as isMacAddress,
  formatBytes as formatBytes,
  formatBits as formatBits,
  injectStyles as injectStyles
};

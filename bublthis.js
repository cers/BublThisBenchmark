// Author: Christian Sonne <cers@geeksbynature.dk>
// 
var performance = performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         Date.now;
})();

// http://stackoverflow.com/a/5918791
var sayswho = (function(){
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    M= M[2]? [M[1], M[2]]:[navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    return M.join(' ');
})();

var results = window.location.search.substr(1);
if (results == "") results = [];
else results = results.split(",");
document.title += " ("+(results.length+1)+"/25) "+sayswho;

function report() {
    var i, average=0, stderr=0;
    for (i = 0; i < results.length; i++)
        average += parseFloat(results[i]);
    average /= results.length;

    for (i = 0; i < results.length; i++)
        stderr += Math.pow(parseFloat(results[i]) - average, 2);
    stderr = Math.sqrt(stderr/results.length);

    window.location = "http://127.0.0.1:8000?average="+average+"&stderr="+stderr+"&browser="+sayswho;

}

function Setup() {
    window.focus();
    var color = "#000000";
    var bubbles = null;
    var img = null;
    var start;

    var overlay = document.createElement("canvas");
    overlay.width = 1200;
    overlay.height = 800;
    var ctx = overlay.getContext('2d');
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(200, 300, 150, 400);
    overlay = ctx.getImageData(0,0,overlay.width,overlay.height);

    function bublThis() {
        start = performance.now();

        var img = new ImgPUInt32(overlay, 1200, 800);
        img.fromRGBA(overlay.data, overlay.height, overlay.width, function alpha(r,g,b,a) {return !(a>0);});
        img.edt_meijster2000();
        bubbles = document.createElement("canvas");
        bubbles.height = overlay.height;
        bubbles.width = overlay.width;
        var bctx = bubbles.getContext("2d");
        var tmp = document.createElement("canvas");
        tmp.height = overlay.height;
        tmp.width = overlay.width;
        var tctx = tmp.getContext("2d");
        tctx.putImageData(overlay,0,0);
        var b;
        document.body.appendChild(bubbles);
        function placeBubbles(num, limit) {
            var max = 0, maxid=0;
            var idx;
            for (idx=0; idx<img.data.length; idx++) {
                if (img.data[idx]>=max) {
                    max = img.data[idx];
                    maxid = idx;
                }
            }
            var radius = Math.sqrt(max),
                x      = maxid%overlay.width,
                y      = parseInt(maxid/overlay.width);
            if (radius > 2) {
                bctx.beginPath();
                bctx.arc(x, y, radius, 0, Math.PI*2, true);
                bctx.closePath();
                bctx.fill();
            }
            else
                limit = -1; // abort
            if (limit-num>0) {
                tctx.drawImage(bubbles,0,0);
                img.fromRGBA(tctx.getImageData(0,0,overlay.width,overlay.height).data, overlay.height, overlay.width, function alpha(r,g,b,a) {return !(a>0);});
                img.edt_meijster2000();
                window.setTimeout(placeBubbles,0,num+1,limit);
            } else {
                // invert
                var i;
                var bubbleData = bctx.getImageData(0,0,overlay.width,overlay.height);
                for (i=0; i<overlay.height*overlay.width; i++) {
                    var idx = i*4;
                    if (bubbleData.data[idx+3]>0)
                        bubbleData.data[idx+3] = 0;
                    else {
                        var carr = [255,0,0];
                        bubbleData.data[idx  ] = carr[0];
                        bubbleData.data[idx+1] = carr[1];
                        bubbleData.data[idx+2] = carr[2];
                        bubbleData.data[idx+3] = 255;
                    }
                }
                bctx.putImageData(bubbleData,0,0);
                results.push(performance.now()-start);
                if (results.length == 25) report();
                else window.location = window.location.href.split("?")[0]+"?"+results.join(",");
            }
        }
        setTimeout(placeBubbles,0,0,30);
    }
    bublThis();
}
window.addEventListener("load", Setup, false);
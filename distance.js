/*
 * =============================================================================
 *
 * D I S T A N C E   T R A N S F O R M   R O U T I N E S
 *
 * $Revision: 1.4 $ $Date: 2009/03/29 04:10:18 $
 *
 * ANIMAL - ANIMAL IMage Processing LibrarY
 * Copyright (C) 2002,2003  Ricardo Fabbri <rfabbri@if.sc.usp.br>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 * =============================================================================
 */ 

 /* This javascript port is Copyright (C) 2010 Christian Sonne <cers@geeksbynature.dk> */

Array.prototype.set = function set(arr, offset) {
    var o=offset||0,i;
    for (i=0; i<arr.length; i++)
        this[i] = arr[i];
}

Array.prototype.subarray = Array.prototype.slice;
if (typeof Float64Array != "undefined") {
  if (typeof Float64Array.prototype.subarray != "function") {
    Float64Array.prototype.subarray = Float64Array.prototype.slice;
  }
} else {
  function Float64Array(data) {
    if (data instanceof Array) return data;
    return Array(data);
  }
  function Uint8ClampedArray(data) {
    if (data instanceof Array) return data;
    return Array(data);
  }
}

// this is the image class, emulating ImgPUInt32 from Animal
function ImgPUInt32(im, c, r) {

    this.data = Float64Array(im);
    this.lut = Float64Array(r+1);
 
    this.cols = c;
    this.rows = r;

    // initiate lut - one too many, to aid slice later
    var i;
    for (i=0; i<=r; i++) {
        this.lut[i] = i*c;
    }
}


// 1st step vertical erosions for Lotufo-Zampirolli EDT
ImgPUInt32.prototype.edt_lz_step1_vertical = function edt_lz_step1_vertical() {
    var r,c,b;

    for (c=0; c < this.cols; c++) {
        b=1;
        for (r=1; r<this.rows; r++)
            if ((this.data[c+this.lut[r]]) > (this.data[c+this.lut[r-1]]) + b) {
                (this.data[c+this.lut[r]]) = (this.data[c+this.lut[r-1]]) + b;
                b += 2;
            } else
                b = 1;
            b=1;
        for (r=this.rows-2; r >= 0; r--) {
            if ((this.data[c+this.lut[r]]) > (this.data[c+this.lut[r+1]]) + b) {
                (this.data[c+this.lut[r]]) = (this.data[c+this.lut[r+1]]) + b;
                b += 2;
            } else
            b = 1;
        }
    }
    return true;
}



ImgPUInt32.prototype.edt_meijster_2D_from_1D = function edt_meijster_2D_from_1D() {
    function meijster_f(x,i, val){ return ( ( (x) - (i))*((x) - (i) ) + (val) ) };

    var rows=this.rows, r,
        cols=this.cols, u,
        q, w, s, t;
    var img_row, row_copy;
    var MAX = -1 >>> 1;

    s = Float64Array(cols);
    t = Float64Array(cols);
    row_copy = Float64Array(cols);

    for (r=0; r<rows; r++) {
        img_row = this.lut[r];
        q = s[0] = t[0] = 0;
        for (u = 1; u < cols; ++u) {
            var im_r_u = this.data[u+img_row];
            while (q != -1 && meijster_f(t[q],s[q],this.data[s[q]+img_row]) > meijster_f(t[q],u,im_r_u)) {
                --q;
            }

            if (q == -1) {
                q = 0; 
                s[0] = u;
            } else { // FIXME this line might need to be understood
                var tmp = (u*u - (s[q]*s[q]) + this.data[u+img_row] - this.data[s[q]+img_row]) / (2*(u - s[q]));
                if (tmp < 0)
                    tmp = MAX+tmp+1;
                w = 1 + parseInt(tmp) ;
                if (w < cols) {
                    ++q;
                    s[q] = u;
                    t[q] = w;
                }
            }
        }
        row_copy = this.data.subarray(this.lut[r], this.lut[r+1]);
        

        for (u = cols-1; u != -1; --u) {
            this.data[u+img_row] = meijster_f(u,s[q], row_copy[s[q]]);
            if (u == t[q]) {
                --q;
                if (q<0)
                    q = MAX+q+1;
            }
        }
    }

   return true;
}




/*
 * PAPER
 *    A. Meijster, J.B.T.M. Roerdink, and W.H. Hesselink "A General Algorithm
 *    for Computing Distance Transforms in Linear Time",
 *    proc. of 5th Int. Conf. Mathematical Morphology and its Applications to
 *    Image and Signal Processing, 2000
 */

ImgPUInt32.prototype.edt_meijster2000 = function edt_meijster2000() {
    var i, r = this.rows, c = this.cols;
    var stat;
    var MAX = -1 >>> 1;
    var infty = MAX - r*r - c*c;
    var FG=1;

    for (i=0; i < r*c; i++)
        if (this.data[i] == FG)
            this.data[i] = infty;

    // Vertical columnwise EDT
    stat = this.edt_lz_step1_vertical();
    // Lotufo's 1D EDT is equivalent to Meijster's scans 1 and 2.
    // What really matters is the 2nd stage.

    stat = this.edt_meijster_2D_from_1D();      

    return true;
}

ImgPUInt32.prototype.normalize = function normalize(m) {
    if (typeof(m) === "undefined" || !parseInt(m))
        var m = 255;
    else
        var m = parseInt(m);
    var i, max=0;
    for (i=0; i<this.cols*this.rows; i++) {
        this.data[i] = Math.sqrt(this.data[i]);
        if (this.data[i]>max)
            max = this.data[i];
    }
    for (i=0; i<this.cols*this.rows; i++) {
        this.data[i] = parseInt((m/max)*this.data[i]);
    }
}

ImgPUInt32.prototype.generateLut = function generateLut() {
    try {
        this.lut = Uint32Array(this.rows+1);
    } catch (e) {
        this.lut = Array(this.rows+1);
    }
    // initiate lut - one too many, to aid slice later
    var i;
    for (i=0; i<this.lut.length; i++) {
        this.lut[i] = i*this.cols;
    }

}

ImgPUInt32.prototype.fromRGBA = function fromRGBA(data, rows, cols, threshold) {
    function luminance(r,g,b) {
        return parseInt(0.2126*r + 0.7152*g + 0.0722*b); // according to wikipedia
    }
    this.data = Float64Array(rows*cols);

    var bw, i;
    switch (typeof(threshold)) {
        case "number":
            bw = function luminanceCustomThreshold(r,g,b,a) {return luminance(r,g,b)>threshold;};
            break;
        case "function":
            bw = threshold;
            break;
        case "undefined":
        default:
            bw = function luminanceDefaultThreshold(r,g,b,a) {return luminance(r,g,b)>127;};
            break;
    }
    for (i=0; i<rows*cols; i++) {
        var idx = 4*i;
        this.data[i] = bw(data[idx],data[idx+1],data[idx+2],data[idx+3])?1:0;
    }
    this.rows = rows;
    this.cols = cols;
    this.generateLut();
}

ImgPUInt32.prototype.toRGBA = function toRGBA(normalize) {
    if (typeof(normalize) === "undefined" || normalize)
        this.normalize();
    var data = Uint8ClampedArray(this.rows*this.cols*4);
    var i,idx;
    for (i=0; i<this.rows*this.cols; i++) {
        idx = i*4;
        data[idx] = data[idx+1] = data[idx+2] = this.data[i];
        data[idx+3] = 255;
    }
    return data;
}

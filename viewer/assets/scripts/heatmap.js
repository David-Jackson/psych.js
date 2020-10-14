// DEPENDENCIES:
// heatmap.js
// papaparse

/*
 * heatmap.js v2.0.5 | JavaScript Heatmap Library
 *
 * Copyright 2008-2016 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license 
 *
 * :: 2016-09-05 01:16
 */
(function (a, b, c) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = c()
    } else if (typeof define === "function" && define.amd) {
        define(c)
    } else {
        b[a] = c()
    }
})("h337", this, function () {
    var a = {
        defaultRadius: 40,
        defaultRenderer: "canvas2d",
        defaultGradient: {
            .25: "rgb(0,0,255)",
            .55: "rgb(0,255,0)",
            .85: "yellow",
            1: "rgb(255,0,0)"
        },
        defaultMaxOpacity: 1,
        defaultMinOpacity: 0,
        defaultBlur: .85,
        defaultXField: "x",
        defaultYField: "y",
        defaultValueField: "value",
        plugins: {}
    };
    var b = function h() {
        var b = function d(a) {
            this._coordinator = {};
            this._data = [];
            this._radi = [];
            this._min = 10;
            this._max = 1;
            this._xField = a["xField"] || a.defaultXField;
            this._yField = a["yField"] || a.defaultYField;
            this._valueField = a["valueField"] || a.defaultValueField;
            if (a["radius"]) {
                this._cfgRadius = a["radius"]
            }
        };
        var c = a.defaultRadius;
        b.prototype = {
            _organiseData: function (a, b) {
                var d = a[this._xField];
                var e = a[this._yField];
                var f = this._radi;
                var g = this._data;
                var h = this._max;
                var i = this._min;
                var j = a[this._valueField] || 1;
                var k = a.radius || this._cfgRadius || c;
                if (!g[d]) {
                    g[d] = [];
                    f[d] = []
                }
                if (!g[d][e]) {
                    g[d][e] = j;
                    f[d][e] = k
                } else {
                    g[d][e] += j
                }
                var l = g[d][e];
                if (l > h) {
                    if (!b) {
                        this._max = l
                    } else {
                        this.setDataMax(l)
                    }
                    return false
                } else if (l < i) {
                    if (!b) {
                        this._min = l
                    } else {
                        this.setDataMin(l)
                    }
                    return false
                } else {
                    return {
                        x: d,
                        y: e,
                        value: j,
                        radius: k,
                        min: i,
                        max: h
                    }
                }
            },
            _unOrganizeData: function () {
                var a = [];
                var b = this._data;
                var c = this._radi;
                for (var d in b) {
                    for (var e in b[d]) {
                        a.push({
                            x: d,
                            y: e,
                            radius: c[d][e],
                            value: b[d][e]
                        })
                    }
                }
                return {
                    min: this._min,
                    max: this._max,
                    data: a
                }
            },
            _onExtremaChange: function () {
                this._coordinator.emit("extremachange", {
                    min: this._min,
                    max: this._max
                })
            },
            addData: function () {
                if (arguments[0].length > 0) {
                    var a = arguments[0];
                    var b = a.length;
                    while (b--) {
                        this.addData.call(this, a[b])
                    }
                } else {
                    var c = this._organiseData(arguments[0], true);
                    if (c) {
                        if (this._data.length === 0) {
                            this._min = this._max = c.value
                        }
                        this._coordinator.emit("renderpartial", {
                            min: this._min,
                            max: this._max,
                            data: [c]
                        })
                    }
                }
                return this
            },
            setData: function (a) {
                var b = a.data;
                var c = b.length;
                this._data = [];
                this._radi = [];
                for (var d = 0; d < c; d++) {
                    this._organiseData(b[d], false)
                }
                this._max = a.max;
                this._min = a.min || 0;
                this._onExtremaChange();
                this._coordinator.emit("renderall", this._getInternalData());
                return this
            },
            removeData: function () {},
            setDataMax: function (a) {
                this._max = a;
                this._onExtremaChange();
                this._coordinator.emit("renderall", this._getInternalData());
                return this
            },
            setDataMin: function (a) {
                this._min = a;
                this._onExtremaChange();
                this._coordinator.emit("renderall", this._getInternalData());
                return this
            },
            setCoordinator: function (a) {
                this._coordinator = a
            },
            _getInternalData: function () {
                return {
                    max: this._max,
                    min: this._min,
                    data: this._data,
                    radi: this._radi
                }
            },
            getData: function () {
                return this._unOrganizeData()
            }
        };
        return b
    }();
    var c = function i() {
        var a = function (a) {
            var b = a.gradient || a.defaultGradient;
            var c = document.createElement("canvas");
            var d = c.getContext("2d");
            c.width = 256;
            c.height = 1;
            var e = d.createLinearGradient(0, 0, 256, 1);
            for (var f in b) {
                e.addColorStop(f, b[f])
            }
            d.fillStyle = e;
            d.fillRect(0, 0, 256, 1);
            return d.getImageData(0, 0, 256, 1).data
        };
        var b = function (a, b) {
            var c = document.createElement("canvas");
            var d = c.getContext("2d");
            var e = a;
            var f = a;
            c.width = c.height = a * 2;
            if (b == 1) {
                d.beginPath();
                d.arc(e, f, a, 0, 2 * Math.PI, false);
                d.fillStyle = "rgba(0,0,0,1)";
                d.fill()
            } else {
                var g = d.createRadialGradient(e, f, a * b, e, f, a);
                g.addColorStop(0, "rgba(0,0,0,1)");
                g.addColorStop(1, "rgba(0,0,0,0)");
                d.fillStyle = g;
                d.fillRect(0, 0, 2 * a, 2 * a)
            }
            return c
        };
        var c = function (a) {
            var b = [];
            var c = a.min;
            var d = a.max;
            var e = a.radi;
            var a = a.data;
            var f = Object.keys(a);
            var g = f.length;
            while (g--) {
                var h = f[g];
                var i = Object.keys(a[h]);
                var j = i.length;
                while (j--) {
                    var k = i[j];
                    var l = a[h][k];
                    var m = e[h][k];
                    b.push({
                        x: h,
                        y: k,
                        value: l,
                        radius: m
                    })
                }
            }
            return {
                min: c,
                max: d,
                data: b
            }
        };

        function d(b) {
            var c = b.container;
            var d = this.shadowCanvas = document.createElement("canvas");
            var e = this.canvas = b.canvas || document.createElement("canvas");
            var f = this._renderBoundaries = [1e4, 1e4, 0, 0];
            var g = getComputedStyle(b.container) || {};
            e.className = "heatmap-canvas";
            this._width = e.width = d.width = b.width || +g.width.replace(/px/, "");
            this._height = e.height = d.height = b.height || +g.height.replace(/px/, "");
            this.shadowCtx = d.getContext("2d");
            this.ctx = e.getContext("2d");
            e.style.cssText = d.style.cssText = "position:absolute;left:0;top:0;";
            c.style.position = "relative";
            c.appendChild(e);
            this._palette = a(b);
            this._templates = {};
            this._setStyles(b)
        }
        d.prototype = {
            renderPartial: function (a) {
                if (a.data.length > 0) {
                    this._drawAlpha(a);
                    this._colorize()
                }
            },
            renderAll: function (a) {
                this._clear();
                if (a.data.length > 0) {
                    this._drawAlpha(c(a));
                    this._colorize()
                }
            },
            _updateGradient: function (b) {
                this._palette = a(b)
            },
            updateConfig: function (a) {
                if (a["gradient"]) {
                    this._updateGradient(a)
                }
                this._setStyles(a)
            },
            setDimensions: function (a, b) {
                this._width = a;
                this._height = b;
                this.canvas.width = this.shadowCanvas.width = a;
                this.canvas.height = this.shadowCanvas.height = b
            },
            _clear: function () {
                this.shadowCtx.clearRect(0, 0, this._width, this._height);
                this.ctx.clearRect(0, 0, this._width, this._height)
            },
            _setStyles: function (a) {
                this._blur = a.blur == 0 ? 0 : a.blur || a.defaultBlur;
                if (a.backgroundColor) {
                    this.canvas.style.backgroundColor = a.backgroundColor
                }
                this._width = this.canvas.width = this.shadowCanvas.width = a.width || this._width;
                this._height = this.canvas.height = this.shadowCanvas.height = a.height || this._height;
                this._opacity = (a.opacity || 0) * 255;
                this._maxOpacity = (a.maxOpacity || a.defaultMaxOpacity) * 255;
                this._minOpacity = (a.minOpacity || a.defaultMinOpacity) * 255;
                this._useGradientOpacity = !!a.useGradientOpacity
            },
            _drawAlpha: function (a) {
                var c = this._min = a.min;
                var d = this._max = a.max;
                var a = a.data || [];
                var e = a.length;
                var f = 1 - this._blur;
                while (e--) {
                    var g = a[e];
                    var h = g.x;
                    var i = g.y;
                    var j = g.radius;
                    var k = Math.min(g.value, d);
                    var l = h - j;
                    var m = i - j;
                    var n = this.shadowCtx;
                    var o;
                    if (!this._templates[j]) {
                        this._templates[j] = o = b(j, f)
                    } else {
                        o = this._templates[j]
                    }
                    var p = (k - c) / (d - c);
                    n.globalAlpha = p < .01 ? .01 : p;
                    n.drawImage(o, l, m);
                    if (l < this._renderBoundaries[0]) {
                        this._renderBoundaries[0] = l
                    }
                    if (m < this._renderBoundaries[1]) {
                        this._renderBoundaries[1] = m
                    }
                    if (l + 2 * j > this._renderBoundaries[2]) {
                        this._renderBoundaries[2] = l + 2 * j
                    }
                    if (m + 2 * j > this._renderBoundaries[3]) {
                        this._renderBoundaries[3] = m + 2 * j
                    }
                }
            },
            _colorize: function () {
                var a = this._renderBoundaries[0];
                var b = this._renderBoundaries[1];
                var c = this._renderBoundaries[2] - a;
                var d = this._renderBoundaries[3] - b;
                var e = this._width;
                var f = this._height;
                var g = this._opacity;
                var h = this._maxOpacity;
                var i = this._minOpacity;
                var j = this._useGradientOpacity;
                if (a < 0) {
                    a = 0
                }
                if (b < 0) {
                    b = 0
                }
                if (a + c > e) {
                    c = e - a
                }
                if (b + d > f) {
                    d = f - b
                }
                var k = this.shadowCtx.getImageData(a, b, c, d);
                var l = k.data;
                var m = l.length;
                var n = this._palette;
                for (var o = 3; o < m; o += 4) {
                    var p = l[o];
                    var q = p * 4;
                    if (!q) {
                        continue
                    }
                    var r;
                    if (g > 0) {
                        r = g
                    } else {
                        if (p < h) {
                            if (p < i) {
                                r = i
                            } else {
                                r = p
                            }
                        } else {
                            r = h
                        }
                    }
                    l[o - 3] = n[q];
                    l[o - 2] = n[q + 1];
                    l[o - 1] = n[q + 2];
                    l[o] = j ? n[q + 3] : r
                }
                k.data = l;
                this.ctx.putImageData(k, a, b);
                this._renderBoundaries = [1e3, 1e3, 0, 0]
            },
            getValueAt: function (a) {
                var b;
                var c = this.shadowCtx;
                var d = c.getImageData(a.x, a.y, 1, 1);
                var e = d.data[3];
                var f = this._max;
                var g = this._min;
                b = Math.abs(f - g) * (e / 255) >> 0;
                return b
            },
            getDataURL: function () {
                return this.canvas.toDataURL()
            }
        };
        return d
    }();
    var d = function j() {
        var b = false;
        if (a["defaultRenderer"] === "canvas2d") {
            b = c
        }
        return b
    }();
    var e = {
        merge: function () {
            var a = {};
            var b = arguments.length;
            for (var c = 0; c < b; c++) {
                var d = arguments[c];
                for (var e in d) {
                    a[e] = d[e]
                }
            }
            return a
        }
    };
    var f = function k() {
        var c = function h() {
            function a() {
                this.cStore = {}
            }
            a.prototype = {
                on: function (a, b, c) {
                    var d = this.cStore;
                    if (!d[a]) {
                        d[a] = []
                    }
                    d[a].push(function (a) {
                        return b.call(c, a)
                    })
                },
                emit: function (a, b) {
                    var c = this.cStore;
                    if (c[a]) {
                        var d = c[a].length;
                        for (var e = 0; e < d; e++) {
                            var f = c[a][e];
                            f(b)
                        }
                    }
                }
            };
            return a
        }();
        var f = function (a) {
            var b = a._renderer;
            var c = a._coordinator;
            var d = a._store;
            c.on("renderpartial", b.renderPartial, b);
            c.on("renderall", b.renderAll, b);
            c.on("extremachange", function (b) {
                a._config.onExtremaChange && a._config.onExtremaChange({
                    min: b.min,
                    max: b.max,
                    gradient: a._config["gradient"] || a._config["defaultGradient"]
                })
            });
            d.setCoordinator(c)
        };

        function g() {
            var g = this._config = e.merge(a, arguments[0] || {});
            this._coordinator = new c;
            if (g["plugin"]) {
                var h = g["plugin"];
                if (!a.plugins[h]) {
                    throw new Error("Plugin '" + h + "' not found. Maybe it was not registered.")
                } else {
                    var i = a.plugins[h];
                    this._renderer = new i.renderer(g);
                    this._store = new i.store(g)
                }
            } else {
                this._renderer = new d(g);
                this._store = new b(g)
            }
            f(this)
        }
        g.prototype = {
            addData: function () {
                this._store.addData.apply(this._store, arguments);
                return this
            },
            removeData: function () {
                this._store.removeData && this._store.removeData.apply(this._store, arguments);
                return this
            },
            setData: function () {
                this._store.setData.apply(this._store, arguments);
                return this
            },
            setDataMax: function () {
                this._store.setDataMax.apply(this._store, arguments);
                return this
            },
            setDataMin: function () {
                this._store.setDataMin.apply(this._store, arguments);
                return this
            },
            configure: function (a) {
                this._config = e.merge(this._config, a);
                this._renderer.updateConfig(this._config);
                this._coordinator.emit("renderall", this._store._getInternalData());
                return this
            },
            repaint: function () {
                this._coordinator.emit("renderall", this._store._getInternalData());
                return this
            },
            getData: function () {
                return this._store.getData()
            },
            getDataURL: function () {
                return this._renderer.getDataURL()
            },
            getValueAt: function (a) {
                if (this._store.getValueAt) {
                    return this._store.getValueAt(a)
                } else if (this._renderer.getValueAt) {
                    return this._renderer.getValueAt(a)
                } else {
                    return null
                }
            }
        };
        return g
    }();
    var g = {
        create: function (a) {
            return new f(a)
        },
        register: function (b, c) {
            a.plugins[b] = c
        }
    };
    return g
});


/* @license
Papa Parse
v5.0.2
https://github.com/mholt/PapaParse
License: MIT
*/
! function (e, t) {
    "function" == typeof define && define.amd ? define([], t) : "object" == typeof module && "undefined" != typeof exports ? module.exports = t() : e.Papa = t()
}(this, function s() {
    "use strict";
    var f = "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0 !== f ? f : {};
    var n = !f.document && !!f.postMessage,
        o = n && /blob:/i.test((f.location || {}).protocol),
        a = {},
        h = 0,
        b = {
            parse: function (e, t) {
                var r = (t = t || {}).dynamicTyping || !1;
                q(r) && (t.dynamicTypingFunction = r, r = {});
                if (t.dynamicTyping = r, t.transform = !!q(t.transform) && t.transform, t.worker && b.WORKERS_SUPPORTED) {
                    var i = function () {
                        if (!b.WORKERS_SUPPORTED) return !1;
                        var e = (r = f.URL || f.webkitURL || null, i = s.toString(), b.BLOB_URL || (b.BLOB_URL = r.createObjectURL(new Blob(["(", i, ")();"], {
                                type: "text/javascript"
                            })))),
                            t = new f.Worker(e);
                        var r, i;
                        return t.onmessage = _, t.id = h++, a[t.id] = t
                    }();
                    return i.userStep = t.step, i.userChunk = t.chunk, i.userComplete = t.complete, i.userError = t.error, t.step = q(t.step), t.chunk = q(t.chunk), t.complete = q(t.complete), t.error = q(t.error), delete t.worker, void i.postMessage({
                        input: e,
                        config: t,
                        workerId: i.id
                    })
                }
                var n = null;
                b.NODE_STREAM_INPUT, "string" == typeof e ? n = t.download ? new l(t) : new p(t) : !0 === e.readable && q(e.read) && q(e.on) ? n = new m(t) : (f.File && e instanceof File || e instanceof Object) && (n = new c(t));
                return n.stream(e)
            },
            unparse: function (e, t) {
                var i = !1,
                    _ = !0,
                    g = ",",
                    v = "\r\n",
                    n = '"',
                    s = n + n,
                    r = !1,
                    a = null;
                ! function () {
                    if ("object" != typeof t) return;
                    "string" != typeof t.delimiter || b.BAD_DELIMITERS.filter(function (e) {
                        return -1 !== t.delimiter.indexOf(e)
                    }).length || (g = t.delimiter);
                    ("boolean" == typeof t.quotes || Array.isArray(t.quotes)) && (i = t.quotes);
                    "boolean" != typeof t.skipEmptyLines && "string" != typeof t.skipEmptyLines || (r = t.skipEmptyLines);
                    "string" == typeof t.newline && (v = t.newline);
                    "string" == typeof t.quoteChar && (n = t.quoteChar);
                    "boolean" == typeof t.header && (_ = t.header);
                    if (Array.isArray(t.columns)) {
                        if (0 === t.columns.length) throw new Error("Option columns is empty");
                        a = t.columns
                    }
                    void 0 !== t.escapeChar && (s = t.escapeChar + n)
                }();
                var o = new RegExp(U(n), "g");
                "string" == typeof e && (e = JSON.parse(e));
                if (Array.isArray(e)) {
                    if (!e.length || Array.isArray(e[0])) return u(null, e, r);
                    if ("object" == typeof e[0]) return u(a || h(e[0]), e, r)
                } else if ("object" == typeof e) return "string" == typeof e.data && (e.data = JSON.parse(e.data)), Array.isArray(e.data) && (e.fields || (e.fields = e.meta && e.meta.fields), e.fields || (e.fields = Array.isArray(e.data[0]) ? e.fields : h(e.data[0])), Array.isArray(e.data[0]) || "object" == typeof e.data[0] || (e.data = [e.data])), u(e.fields || [], e.data || [], r);
                throw new Error("Unable to serialize unrecognized input");

                function h(e) {
                    if ("object" != typeof e) return [];
                    var t = [];
                    for (var r in e) t.push(r);
                    return t
                }

                function u(e, t, r) {
                    var i = "";
                    "string" == typeof e && (e = JSON.parse(e)), "string" == typeof t && (t = JSON.parse(t));
                    var n = Array.isArray(e) && 0 < e.length,
                        s = !Array.isArray(t[0]);
                    if (n && _) {
                        for (var a = 0; a < e.length; a++) 0 < a && (i += g), i += y(e[a], a);
                        0 < t.length && (i += v)
                    }
                    for (var o = 0; o < t.length; o++) {
                        var h = n ? e.length : t[o].length,
                            u = !1,
                            f = n ? 0 === Object.keys(t[o]).length : 0 === t[o].length;
                        if (r && !n && (u = "greedy" === r ? "" === t[o].join("").trim() : 1 === t[o].length && 0 === t[o][0].length), "greedy" === r && n) {
                            for (var d = [], l = 0; l < h; l++) {
                                var c = s ? e[l] : l;
                                d.push(t[o][c])
                            }
                            u = "" === d.join("").trim()
                        }
                        if (!u) {
                            for (var p = 0; p < h; p++) {
                                0 < p && !f && (i += g);
                                var m = n && s ? e[p] : p;
                                i += y(t[o][m], p)
                            }
                            o < t.length - 1 && (!r || 0 < h && !f) && (i += v)
                        }
                    }
                    return i
                }

                function y(e, t) {
                    if (null == e) return "";
                    if (e.constructor === Date) return JSON.stringify(e).slice(1, 25);
                    e = e.toString().replace(o, s);
                    var r = "boolean" == typeof i && i || Array.isArray(i) && i[t] || function (e, t) {
                        for (var r = 0; r < t.length; r++)
                            if (-1 < e.indexOf(t[r])) return !0;
                        return !1
                    }(e, b.BAD_DELIMITERS) || -1 < e.indexOf(g) || " " === e.charAt(0) || " " === e.charAt(e.length - 1);
                    return r ? n + e + n : e
                }
            }
        };
    if (b.RECORD_SEP = String.fromCharCode(30), b.UNIT_SEP = String.fromCharCode(31), b.BYTE_ORDER_MARK = "\ufeff", b.BAD_DELIMITERS = ["\r", "\n", '"', b.BYTE_ORDER_MARK], b.WORKERS_SUPPORTED = !n && !!f.Worker, b.NODE_STREAM_INPUT = 1, b.LocalChunkSize = 10485760, b.RemoteChunkSize = 5242880, b.DefaultDelimiter = ",", b.Parser = E, b.ParserHandle = r, b.NetworkStreamer = l, b.FileStreamer = c, b.StringStreamer = p, b.ReadableStreamStreamer = m, f.jQuery) {
        var d = f.jQuery;
        d.fn.parse = function (o) {
            var r = o.config || {},
                h = [];
            return this.each(function (e) {
                if (!("INPUT" === d(this).prop("tagName").toUpperCase() && "file" === d(this).attr("type").toLowerCase() && f.FileReader) || !this.files || 0 === this.files.length) return !0;
                for (var t = 0; t < this.files.length; t++) h.push({
                    file: this.files[t],
                    inputElem: this,
                    instanceConfig: d.extend({}, r)
                })
            }), e(), this;

            function e() {
                if (0 !== h.length) {
                    var e, t, r, i, n = h[0];
                    if (q(o.before)) {
                        var s = o.before(n.file, n.inputElem);
                        if ("object" == typeof s) {
                            if ("abort" === s.action) return e = "AbortError", t = n.file, r = n.inputElem, i = s.reason, void(q(o.error) && o.error({
                                name: e
                            }, t, r, i));
                            if ("skip" === s.action) return void u();
                            "object" == typeof s.config && (n.instanceConfig = d.extend(n.instanceConfig, s.config))
                        } else if ("skip" === s) return void u()
                    }
                    var a = n.instanceConfig.complete;
                    n.instanceConfig.complete = function (e) {
                        q(a) && a(e, n.file, n.inputElem), u()
                    }, b.parse(n.file, n.instanceConfig)
                } else q(o.complete) && o.complete()
            }

            function u() {
                h.splice(0, 1), e()
            }
        }
    }

    function u(e) {
        this._handle = null, this._finished = !1, this._completed = !1, this._halted = !1, this._input = null, this._baseIndex = 0, this._partialLine = "", this._rowCount = 0, this._start = 0, this._nextChunk = null, this.isFirstChunk = !0, this._completeResults = {
                data: [],
                errors: [],
                meta: {}
            },
            function (e) {
                var t = w(e);
                t.chunkSize = parseInt(t.chunkSize), e.step || e.chunk || (t.chunkSize = null);
                this._handle = new r(t), (this._handle.streamer = this)._config = t
            }.call(this, e), this.parseChunk = function (e, t) {
                if (this.isFirstChunk && q(this._config.beforeFirstChunk)) {
                    var r = this._config.beforeFirstChunk(e);
                    void 0 !== r && (e = r)
                }
                this.isFirstChunk = !1, this._halted = !1;
                var i = this._partialLine + e;
                this._partialLine = "";
                var n = this._handle.parse(i, this._baseIndex, !this._finished);
                if (!this._handle.paused() && !this._handle.aborted()) {
                    var s = n.meta.cursor;
                    this._finished || (this._partialLine = i.substring(s - this._baseIndex), this._baseIndex = s), n && n.data && (this._rowCount += n.data.length);
                    var a = this._finished || this._config.preview && this._rowCount >= this._config.preview;
                    if (o) f.postMessage({
                        results: n,
                        workerId: b.WORKER_ID,
                        finished: a
                    });
                    else if (q(this._config.chunk) && !t) {
                        if (this._config.chunk(n, this._handle), this._handle.paused() || this._handle.aborted()) return void(this._halted = !0);
                        n = void 0, this._completeResults = void 0
                    }
                    return this._config.step || this._config.chunk || (this._completeResults.data = this._completeResults.data.concat(n.data), this._completeResults.errors = this._completeResults.errors.concat(n.errors), this._completeResults.meta = n.meta), this._completed || !a || !q(this._config.complete) || n && n.meta.aborted || (this._config.complete(this._completeResults, this._input), this._completed = !0), a || n && n.meta.paused || this._nextChunk(), n
                }
                this._halted = !0
            }, this._sendError = function (e) {
                q(this._config.error) ? this._config.error(e) : o && this._config.error && f.postMessage({
                    workerId: b.WORKER_ID,
                    error: e,
                    finished: !1
                })
            }
    }

    function l(e) {
        var i;
        (e = e || {}).chunkSize || (e.chunkSize = b.RemoteChunkSize), u.call(this, e), this._nextChunk = n ? function () {
            this._readChunk(), this._chunkLoaded()
        } : function () {
            this._readChunk()
        }, this.stream = function (e) {
            this._input = e, this._nextChunk()
        }, this._readChunk = function () {
            if (this._finished) this._chunkLoaded();
            else {
                if (i = new XMLHttpRequest, this._config.withCredentials && (i.withCredentials = this._config.withCredentials), n || (i.onload = y(this._chunkLoaded, this), i.onerror = y(this._chunkError, this)), i.open("GET", this._input, !n), this._config.downloadRequestHeaders) {
                    var e = this._config.downloadRequestHeaders;
                    for (var t in e) i.setRequestHeader(t, e[t])
                }
                if (this._config.chunkSize) {
                    var r = this._start + this._config.chunkSize - 1;
                    i.setRequestHeader("Range", "bytes=" + this._start + "-" + r)
                }
                try {
                    i.send()
                } catch (e) {
                    this._chunkError(e.message)
                }
                n && 0 === i.status ? this._chunkError() : this._start += this._config.chunkSize
            }
        }, this._chunkLoaded = function () {
            4 === i.readyState && (i.status < 200 || 400 <= i.status ? this._chunkError() : (this._finished = !this._config.chunkSize || this._start > function (e) {
                var t = e.getResponseHeader("Content-Range");
                if (null === t) return -1;
                return parseInt(t.substr(t.lastIndexOf("/") + 1))
            }(i), this.parseChunk(i.responseText)))
        }, this._chunkError = function (e) {
            var t = i.statusText || e;
            this._sendError(new Error(t))
        }
    }

    function c(e) {
        var i, n;
        (e = e || {}).chunkSize || (e.chunkSize = b.LocalChunkSize), u.call(this, e);
        var s = "undefined" != typeof FileReader;
        this.stream = function (e) {
            this._input = e, n = e.slice || e.webkitSlice || e.mozSlice, s ? ((i = new FileReader).onload = y(this._chunkLoaded, this), i.onerror = y(this._chunkError, this)) : i = new FileReaderSync, this._nextChunk()
        }, this._nextChunk = function () {
            this._finished || this._config.preview && !(this._rowCount < this._config.preview) || this._readChunk()
        }, this._readChunk = function () {
            var e = this._input;
            if (this._config.chunkSize) {
                var t = Math.min(this._start + this._config.chunkSize, this._input.size);
                e = n.call(e, this._start, t)
            }
            var r = i.readAsText(e, this._config.encoding);
            s || this._chunkLoaded({
                target: {
                    result: r
                }
            })
        }, this._chunkLoaded = function (e) {
            this._start += this._config.chunkSize, this._finished = !this._config.chunkSize || this._start >= this._input.size, this.parseChunk(e.target.result)
        }, this._chunkError = function () {
            this._sendError(i.error)
        }
    }

    function p(e) {
        var r;
        u.call(this, e = e || {}), this.stream = function (e) {
            return r = e, this._nextChunk()
        }, this._nextChunk = function () {
            if (!this._finished) {
                var e = this._config.chunkSize,
                    t = e ? r.substr(0, e) : r;
                return r = e ? r.substr(e) : "", this._finished = !r, this.parseChunk(t)
            }
        }
    }

    function m(e) {
        u.call(this, e = e || {});
        var t = [],
            r = !0,
            i = !1;
        this.pause = function () {
            u.prototype.pause.apply(this, arguments), this._input.pause()
        }, this.resume = function () {
            u.prototype.resume.apply(this, arguments), this._input.resume()
        }, this.stream = function (e) {
            this._input = e, this._input.on("data", this._streamData), this._input.on("end", this._streamEnd), this._input.on("error", this._streamError)
        }, this._checkIsFinished = function () {
            i && 1 === t.length && (this._finished = !0)
        }, this._nextChunk = function () {
            this._checkIsFinished(), t.length ? this.parseChunk(t.shift()) : r = !0
        }, this._streamData = y(function (e) {
            try {
                t.push("string" == typeof e ? e : e.toString(this._config.encoding)), r && (r = !1, this._checkIsFinished(), this.parseChunk(t.shift()))
            } catch (e) {
                this._streamError(e)
            }
        }, this), this._streamError = y(function (e) {
            this._streamCleanUp(), this._sendError(e)
        }, this), this._streamEnd = y(function () {
            this._streamCleanUp(), i = !0, this._streamData("")
        }, this), this._streamCleanUp = y(function () {
            this._input.removeListener("data", this._streamData), this._input.removeListener("end", this._streamEnd), this._input.removeListener("error", this._streamError)
        }, this)
    }

    function r(g) {
        var a, o, h, i = Math.pow(2, 53),
            n = -i,
            s = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i,
            u = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/,
            t = this,
            r = 0,
            f = 0,
            d = !1,
            e = !1,
            l = [],
            c = {
                data: [],
                errors: [],
                meta: {}
            };
        if (q(g.step)) {
            var p = g.step;
            g.step = function (e) {
                if (c = e, _()) m();
                else {
                    if (m(), 0 === c.data.length) return;
                    r += e.data.length, g.preview && r > g.preview ? o.abort() : p(c, t)
                }
            }
        }

        function v(e) {
            return "greedy" === g.skipEmptyLines ? "" === e.join("").trim() : 1 === e.length && 0 === e[0].length
        }

        function m() {
            if (c && h && (k("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + b.DefaultDelimiter + "'"), h = !1), g.skipEmptyLines)
                for (var e = 0; e < c.data.length; e++) v(c.data[e]) && c.data.splice(e--, 1);
            return _() && function () {
                    if (!c) return;

                    function e(e) {
                        q(g.transformHeader) && (e = g.transformHeader(e)), l.push(e)
                    }
                    if (Array.isArray(c.data[0])) {
                        for (var t = 0; _() && t < c.data.length; t++) c.data[t].forEach(e);
                        c.data.splice(0, 1)
                    } else c.data.forEach(e)
                }(),
                function () {
                    if (!c || !g.header && !g.dynamicTyping && !g.transform) return c;

                    function e(e, t) {
                        var r, i = g.header ? {} : [];
                        for (r = 0; r < e.length; r++) {
                            var n = r,
                                s = e[r];
                            g.header && (n = r >= l.length ? "__parsed_extra" : l[r]), g.transform && (s = g.transform(s, n)), s = y(n, s), "__parsed_extra" === n ? (i[n] = i[n] || [], i[n].push(s)) : i[n] = s
                        }
                        return g.header && (r > l.length ? k("FieldMismatch", "TooManyFields", "Too many fields: expected " + l.length + " fields but parsed " + r, f + t) : r < l.length && k("FieldMismatch", "TooFewFields", "Too few fields: expected " + l.length + " fields but parsed " + r, f + t)), i
                    }
                    var t = 1;
                    !c.data[0] || Array.isArray(c.data[0]) ? (c.data = c.data.map(e), t = c.data.length) : c.data = e(c.data, 0);
                    g.header && c.meta && (c.meta.fields = l);
                    return f += t, c
                }()
        }

        function _() {
            return g.header && 0 === l.length
        }

        function y(e, t) {
            return r = e, g.dynamicTypingFunction && void 0 === g.dynamicTyping[r] && (g.dynamicTyping[r] = g.dynamicTypingFunction(r)), !0 === (g.dynamicTyping[r] || g.dynamicTyping) ? "true" === t || "TRUE" === t || "false" !== t && "FALSE" !== t && (function (e) {
                if (s.test(e)) {
                    var t = parseFloat(e);
                    if (n < t && t < i) return !0
                }
                return !1
            }(t) ? parseFloat(t) : u.test(t) ? new Date(t) : "" === t ? null : t) : t;
            var r
        }

        function k(e, t, r, i) {
            c.errors.push({
                type: e,
                code: t,
                message: r,
                row: i
            })
        }
        this.parse = function (e, t, r) {
            var i = g.quoteChar || '"';
            if (g.newline || (g.newline = function (e, t) {
                    e = e.substr(0, 1048576);
                    var r = new RegExp(U(t) + "([^]*?)" + U(t), "gm"),
                        i = (e = e.replace(r, "")).split("\r"),
                        n = e.split("\n"),
                        s = 1 < n.length && n[0].length < i[0].length;
                    if (1 === i.length || s) return "\n";
                    for (var a = 0, o = 0; o < i.length; o++) "\n" === i[o][0] && a++;
                    return a >= i.length / 2 ? "\r\n" : "\r"
                }(e, i)), h = !1, g.delimiter) q(g.delimiter) && (g.delimiter = g.delimiter(e), c.meta.delimiter = g.delimiter);
            else {
                var n = function (e, t, r, i, n) {
                    var s, a, o, h;
                    n = n || [",", "\t", "|", ";", b.RECORD_SEP, b.UNIT_SEP];
                    for (var u = 0; u < n.length; u++) {
                        var f = n[u],
                            d = 0,
                            l = 0,
                            c = 0;
                        o = void 0;
                        for (var p = new E({
                                comments: i,
                                delimiter: f,
                                newline: t,
                                preview: 10
                            }).parse(e), m = 0; m < p.data.length; m++)
                            if (r && v(p.data[m])) c++;
                            else {
                                var _ = p.data[m].length;
                                l += _, void 0 !== o ? 0 < _ && (d += Math.abs(_ - o), o = _) : o = _
                            } 0 < p.data.length && (l /= p.data.length - c), (void 0 === a || d <= a) && (void 0 === h || h < l) && 1.99 < l && (a = d, s = f, h = l)
                    }
                    return {
                        successful: !!(g.delimiter = s),
                        bestDelimiter: s
                    }
                }(e, g.newline, g.skipEmptyLines, g.comments, g.delimitersToGuess);
                n.successful ? g.delimiter = n.bestDelimiter : (h = !0, g.delimiter = b.DefaultDelimiter), c.meta.delimiter = g.delimiter
            }
            var s = w(g);
            return g.preview && g.header && s.preview++, a = e, o = new E(s), c = o.parse(a, t, r), m(), d ? {
                meta: {
                    paused: !0
                }
            } : c || {
                meta: {
                    paused: !1
                }
            }
        }, this.paused = function () {
            return d
        }, this.pause = function () {
            d = !0, o.abort(), a = a.substr(o.getCharIndex())
        }, this.resume = function () {
            t.streamer._halted ? (d = !1, t.streamer.parseChunk(a, !0)) : setTimeout(this.resume, 3)
        }, this.aborted = function () {
            return e
        }, this.abort = function () {
            e = !0, o.abort(), c.meta.aborted = !0, q(g.complete) && g.complete(c), a = ""
        }
    }

    function U(e) {
        return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }

    function E(e) {
        var O, D = (e = e || {}).delimiter,
            I = e.newline,
            T = e.comments,
            A = e.step,
            L = e.preview,
            F = e.fastMode,
            z = O = void 0 === e.quoteChar ? '"' : e.quoteChar;
        if (void 0 !== e.escapeChar && (z = e.escapeChar), ("string" != typeof D || -1 < b.BAD_DELIMITERS.indexOf(D)) && (D = ","), T === D) throw new Error("Comment character same as delimiter");
        !0 === T ? T = "#" : ("string" != typeof T || -1 < b.BAD_DELIMITERS.indexOf(T)) && (T = !1), "\n" !== I && "\r" !== I && "\r\n" !== I && (I = "\n");
        var M = 0,
            j = !1;
        this.parse = function (a, r, t) {
            if ("string" != typeof a) throw new Error("Input must be a string");
            var i = a.length,
                e = D.length,
                n = I.length,
                s = T.length,
                o = q(A),
                h = [],
                u = [],
                f = [],
                d = M = 0;
            if (!a) return R();
            if (F || !1 !== F && -1 === a.indexOf(O)) {
                for (var l = a.split(I), c = 0; c < l.length; c++) {
                    if (f = l[c], M += f.length, c !== l.length - 1) M += I.length;
                    else if (t) return R();
                    if (!T || f.substr(0, s) !== T) {
                        if (o) {
                            if (h = [], b(f.split(D)), S(), j) return R()
                        } else b(f.split(D));
                        if (L && L <= c) return h = h.slice(0, L), R(!0)
                    }
                }
                return R()
            }
            for (var p = a.indexOf(D, M), m = a.indexOf(I, M), _ = new RegExp(U(z) + U(O), "g"), g = a.indexOf(O, M);;)
                if (a[M] !== O)
                    if (T && 0 === f.length && a.substr(M, s) === T) {
                        if (-1 === m) return R();
                        M = m + n, m = a.indexOf(I, M), p = a.indexOf(D, M)
                    } else {
                        if (-1 !== p && (p < m || -1 === m)) {
                            if (-1 === g) {
                                f.push(a.substring(M, p)), M = p + e, p = a.indexOf(D, M);
                                continue
                            }
                            var v = x(p, g, m);
                            if (v && void 0 !== v.nextDelim) {
                                p = v.nextDelim, g = v.quoteSearch, f.push(a.substring(M, p)), M = p + e, p = a.indexOf(D, M);
                                continue
                            }
                        }
                        if (-1 === m) break;
                        if (f.push(a.substring(M, m)), C(m + n), o && (S(), j)) return R();
                        if (L && h.length >= L) return R(!0)
                    }
            else
                for (g = M, M++;;) {
                    if (-1 === (g = a.indexOf(O, g + 1))) return t || u.push({
                        type: "Quotes",
                        code: "MissingQuotes",
                        message: "Quoted field unterminated",
                        row: h.length,
                        index: M
                    }), w();
                    if (g === i - 1) return w(a.substring(M, g).replace(_, O));
                    if (O !== z || a[g + 1] !== z) {
                        if (O === z || 0 === g || a[g - 1] !== z) {
                            var y = E(-1 === m ? p : Math.min(p, m));
                            if (a[g + 1 + y] === D) {
                                f.push(a.substring(M, g).replace(_, O)), a[M = g + 1 + y + e] !== O && (g = a.indexOf(O, M)), p = a.indexOf(D, M), m = a.indexOf(I, M);
                                break
                            }
                            var k = E(m);
                            if (a.substr(g + 1 + k, n) === I) {
                                if (f.push(a.substring(M, g).replace(_, O)), C(g + 1 + k + n), p = a.indexOf(D, M), g = a.indexOf(O, M), o && (S(), j)) return R();
                                if (L && h.length >= L) return R(!0);
                                break
                            }
                            u.push({
                                type: "Quotes",
                                code: "InvalidQuotes",
                                message: "Trailing quote on quoted field is malformed",
                                row: h.length,
                                index: M
                            }), g++
                        }
                    } else g++
                }
            return w();

            function b(e) {
                h.push(e), d = M
            }

            function E(e) {
                var t = 0;
                if (-1 !== e) {
                    var r = a.substring(g + 1, e);
                    r && "" === r.trim() && (t = r.length)
                }
                return t
            }

            function w(e) {
                return t || (void 0 === e && (e = a.substr(M)), f.push(e), M = i, b(f), o && S()), R()
            }

            function C(e) {
                M = e, b(f), f = [], m = a.indexOf(I, M)
            }

            function R(e, t) {
                return {
                    data: t || !1 ? h[0] : h,
                    errors: u,
                    meta: {
                        delimiter: D,
                        linebreak: I,
                        aborted: j,
                        truncated: !!e,
                        cursor: d + (r || 0)
                    }
                }
            }

            function S() {
                A(R(void 0, !0)), h = [], u = []
            }

            function x(e, t, r) {
                var i = {
                        nextDelim: void 0,
                        quoteSearch: void 0
                    },
                    n = a.indexOf(O, t + 1);
                if (t < e && e < n && (n < r || -1 === r)) {
                    var s = a.indexOf(D, n);
                    if (-1 === s) return i;
                    n < s && (n = a.indexOf(O, n + 1)), i = x(s, n, r)
                } else i = {
                    nextDelim: e,
                    quoteSearch: t
                };
                return i
            }
        }, this.abort = function () {
            j = !0
        }, this.getCharIndex = function () {
            return M
        }
    }

    function _(e) {
        var t = e.data,
            r = a[t.workerId],
            i = !1;
        if (t.error) r.userError(t.error, t.file);
        else if (t.results && t.results.data) {
            var n = {
                abort: function () {
                    i = !0, g(t.workerId, {
                        data: [],
                        errors: [],
                        meta: {
                            aborted: !0
                        }
                    })
                },
                pause: v,
                resume: v
            };
            if (q(r.userStep)) {
                for (var s = 0; s < t.results.data.length && (r.userStep({
                        data: t.results.data[s],
                        errors: t.results.errors,
                        meta: t.results.meta
                    }, n), !i); s++);
                delete t.results
            } else q(r.userChunk) && (r.userChunk(t.results, n, t.file), delete t.results)
        }
        t.finished && !i && g(t.workerId, t.results)
    }

    function g(e, t) {
        var r = a[e];
        q(r.userComplete) && r.userComplete(t), r.terminate(), delete a[e]
    }

    function v() {
        throw new Error("Not implemented.")
    }

    function w(e) {
        if ("object" != typeof e || null === e) return e;
        var t = Array.isArray(e) ? [] : {};
        for (var r in e) t[r] = w(e[r]);
        return t
    }

    function y(e, t) {
        return function () {
            e.apply(t, arguments)
        }
    }

    function q(e) {
        return "function" == typeof e
    }
    return o && (f.onmessage = function (e) {
        var t = e.data;
        void 0 === b.WORKER_ID && t && (b.WORKER_ID = t.workerId);
        if ("string" == typeof t.input) f.postMessage({
            workerId: b.WORKER_ID,
            results: b.parse(t.input, t.config),
            finished: !0
        });
        else if (f.File && t.input instanceof File || t.input instanceof Object) {
            var r = b.parse(t.input, t.config);
            r && f.postMessage({
                workerId: b.WORKER_ID,
                results: r,
                finished: !0
            })
        }
    }), (l.prototype = Object.create(u.prototype)).constructor = l, (c.prototype = Object.create(u.prototype)).constructor = c, (p.prototype = Object.create(p.prototype)).constructor = p, (m.prototype = Object.create(u.prototype)).constructor = m, b
});


// END OF DEPENDENCIES

var boilerplatePlugin = (function BoilerplatePluginClosure() {

    function BoilerplateStore(config) {
        this._coordinator = {};
        this._data = [];
        this._max = 1;
        this._min = 0;
    };

    BoilerplateStore.prototype = {
        setCoordinator: function (coordinator) {

        },
        setData: function (data) {

        },
        addData: function (data) {

        },
        removeData: function (data) {

        },
        getData: function () {

        }
    };



    function BoilerplateRenderer(config) {

    };

    return {
        store: BoilerplateStore,
        renderer: BoilerplateRenderer
    }
}());

h337.register('boilerplate', boilerplatePlugin);

function startHeatmapUploadProcess() {
    console.log("Starting File Picker", this);

    var input = document.createElement('input');
    input.accept = ".csv";
    input.type = 'file';

    input.onchange = e => {
        var file = e.target.files[0];

        parseHeatmapFile(file);
    }

    input.click();
}

function parseHeatmapFile(file) {
    console.log("Parsing File", file, this);
    var results = [];
    var heatmapFileLoadingProgressText = document.querySelector("#heatmapFileLoadingProgressText");
    Papa.parse(file, {
        header: true,
        worker: true,
        step: function (row) {
            results.push(row.data);
            if (results.length % 1000 == 0) {
                heatmapFileLoadingProgressText.innerHTML = results.length + " rows processed";
            }
        },
        complete: function () {
            heatmapFileLoadingProgressText.innerHTML = "Done: " + results.length + " rows processed";
            heatmapFileLoadingProgressText.previousElementSibling.style.display = "block";
            processHeatmap(results)
        }
    });
}

// take results from CSV parse and create a heatmap
function processHeatmap(results) {
    console.log("Processing", results.length, "results", this)
    var dataObj = results
        .map(x => {
            return {
                db: parseFloat(x.HourlyDryBulbTemperature),
                rh: parseFloat(x.HourlyRelativeHumidity)
            }
        })
        .filter(x => !isNaN(x.db) && !isNaN(x.rh))
        .reduce((counts, x) => {
            if (!counts[x.db]) counts[x.db] = {};
            counts[x.db][x.rh] = (counts[x.db][x.rh] || 0) + 1;
            return counts;
        }, {});
    var data = [];
    for (var db in dataObj) {
        for (var rh in dataObj[db]) {
            data.push({
                db: parseFloat(db),
                rh: parseFloat(rh),
                occ: dataObj[db][rh]
            });
        }
    }
    console.log(data);

    var heatmapData = [];

    var maxOcc = data
        .map(x => x.occ)
        .reduce((acc, x) => Math.max(acc, x));

    var minOcc = data
        .map(x => x.occ)
        .reduce((acc, x) => Math.min(acc, x));

    data.forEach(point => {
        var inlet = new psych.PointBuilder()
            .withElevation(graph.properties.elevation)
            .withDryBulb(point.db)
            .withRelativeHumidity(point.rh)
            .build();

        graph.calculatePosition(inlet);

        heatmapData.push({
            x: Math.round(inlet.properties.graphX),
            y: Math.round(inlet.properties.graphY),
            value: point.occ
        });

        //         graph.addPoint(
        //             {
        //                 radius: map(point.occ, minOcc, maxOcc, 5, 20),
        //                 stroke: null,
        //                 fill: color(155)
        //             }, 
        //             inlet
        //         );
    });

    removeHeatmap();

    var heatmapContainer = document.createElement("div");
    heatmapContainer.setAttribute("id", "heatmap");
    heatmapContainer.style.height = height + "px";
    heatmapContainer.style.width = width + "px";

    document.querySelector("#sketch-holder").appendChild(heatmapContainer)

    var heatmapInstance = h337.create({
        container: heatmapContainer,
        maxOpacity: 0.6,
        radius: 25
    });

    heatmapInstance.setData({
        data: heatmapData,
        max: maxOcc
    });

    heatmapContainer.style.position = "absolute";
    heatmapContainer.style.top = "0px";

    window.mouseMoved = function () {
        var statsUpdated = graph.mouseMoved(mouseX, mouseY);
        if (statsUpdated) {
            var hoursAtPosition = heatmapInstance.getValueAt({
                x: mouseX,
                y: mouseY
            });
            document.getElementById("psychStats").innerHTML += hoursAtPosition + " hours out of the last 10 years</br>";
        }
    }
}

function removeHeatmap() {
    try {
        document.querySelector("#sketch-holder").removeChild(document.querySelector("#heatmap"));
        window.mouseMoved = function () {
            graph.mouseMoved(mouseX, mouseY);
        }
    } catch (e) {

    }
}
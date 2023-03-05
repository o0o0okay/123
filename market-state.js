if (window.crHeatmapWidget === undefined) {
  window.crHeatmapWidget = {};
  window.crHeatmapWidget.elClass = 'cr-heatmap-widget';

  window.crHeatmapWidget.setBodyStyles = () => {
    document.body.style = 'margin: 0; padding: 0;';
  };

  window.crHeatmapWidget.loadScript = (url, attrs, callback) => {
    var script = document.createElement('script');
    script.async = true;
    script.src = url;
    if (attrs) {
      for (let attr in attrs) {
        script[attr] = attrs[attr];
      }
    }
    script.addEventListener('load', callback);
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  window.crHeatmapWidget.loadScripts = (urls, attrs, callback, urlIndex) => {
    var urlIndex = urlIndex || 0;
    window.crHeatmapWidget.loadScript(urls[urlIndex], attrs, () => {
      if (urlIndex < urls.length - 1) {
        window.crHeatmapWidget.loadScripts(urls, attrs, callback, urlIndex + 1);
      } else {
        callback();
      }
    });
  };

  window.crHeatmapWidget.install = () => {
    ``;
    window.crHeatmapWidget.loadScripts(
      [
        'https://d3js.org/d3-hierarchy.v1.min.js',
        'https://d3js.org/d3-scale.v2.js',
        'https://d3js.org/d3-interpolate.v1.min.js',
        'https://d3js.org/d3-array.v2.min.js',
      ],
      {},
      () => {
        docReady(function () {
          var elements = document.getElementsByClassName(window.crHeatmapWidget.elClass);
          window.crHeatmapWidget.loadWidgets(elements);
        });
      }
    );
  };

  window.crHeatmapWidget.loadWidgets = (elements, elementIndex) => {
    var elementIndex = elementIndex || 0;
    var element = elements[elementIndex];
    if (elementIndex <= elements.length - 1) {
      window.crHeatmapWidget.load(element, () => {
        window.crHeatmapWidget.loadWidgets(elements, elementIndex + 1);
      });
    }
  };

  window.crHeatmapWidget.load = (element, next) => {
    if (!element.dataset.apiUrl || !element.dataset.siteUrl) {
      console.warn('API URL and Site URL for the widget are not set, please update the script initialization code');
    }

    window.crHeatmapWidget.apiUrl = element.dataset.apiUrl || 'https://api.cryptorank.io/v0';
    window.crHeatmapWidget.siteUrl = element.dataset.siteUrl || 'https://cryptorank.io';
    var top = element.dataset.top;
    var range = element.dataset.range;
    var order = element.dataset.order;
    var limit = !isNaN(top) ? top : 5000;
    var type = !isNaN(top) ? false : top;

    var params = {
      limit: Number(limit) + (order === 'cat' ? 0 : 1),
      range: range,
      order: order,
    };

    if (type) {
      params.type = type;
    }

    window.getRequest(`${window.crHeatmapWidget.apiUrl}/widget/heatmap`, params, (data) => {
      window.crHeatmapWidget.render(element, data.data);
      if (next) {
        next();
      }
    });
  };

  window.getRequest = (url, params, success) => {
    var queryParams = [];
    for (var field in params) {
      queryParams.push(`${field}=${params[field]}`);
    }

    var getUrl = url;
    if (queryParams.length) {
      getUrl += `?${queryParams.join('&')}`;
    }

    var oReq = new XMLHttpRequest();
    oReq.open('GET', getUrl);
    oReq.send();
    oReq.onload = function () {
      var json = JSON.parse(oReq.response);
      if (typeof success === 'function') {
        success(json);
      }
    };
  };

  window.crHeatmapWidget.render = (element, data) => {
    if (data.children.length === 0) {
      return;
    }

    var canvasWidth = element.offsetWidth;
    var canvasHeight = element.offsetHeight - 50; // 50 is height of header and footer

    var d3Treemap = d3.treemap().size([canvasWidth, canvasHeight]).round(true).padding(1);
    var arg = data.max - data.min;
    var scaleLinearFunc = d3
      .scaleLinear()
      .domain([0, arg / 3, arg])
      .range([0.001, 100, 120]);
    var hData = d3
      .hierarchy(data)
      .sum((node) => {
        return node.value ? scaleLinearFunc(node.value - data.min) : node.value;
      })
      .sort((a, b) => {
        return b.value - a.value;
      });
    var treemapData = d3Treemap(hData);

    var getPixelRatio = (ctx) => {
      const dpr = window.devicePixelRatio || 1;
      const bsr =
        ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio ||
        1;
      return dpr / bsr;
    };

    var canvas = document.createElement('canvas');
    canvas.style = 'display: block;';
    var context = canvas.getContext('2d');
    var ratio = getPixelRatio(context);

    if (context) {
      canvas.width = canvasWidth * ratio;
      canvas.height = canvasHeight * ratio;

      canvas.style.height = canvasHeight + 'px';
      canvas.style.width = canvasWidth + 'px';

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.save();

      treemapData.each((leaf) => {
        var w = leaf.x1 - leaf.x0;
        var h = leaf.y1 - leaf.y0;
        context.fillStyle = leaf.data.color;
        context.fillRect(leaf.x0, leaf.y0, w, leaf.y1 - leaf.y0);
        context.strokeStyle = '#000000';

        const scale = Math.min(w, h) / 5;

        if (leaf.depth === 2 && leaf.data.name) {
          context.textAlign = 'center';
          context.fillStyle = '#FFFFFF';

          context.font = '500 ' + Math.round(scale) + 'px Rubik, sans-serif';
          var name = leaf.data.name;

          context.fillText(name, leaf.x0 + w / 2, leaf.y0 + h / 2);
          context.font = '500 ' + Math.round(scale / 2) + 'px Rubik, sans-serif';
          context.fillText(leaf.data.percent + '%', leaf.x0 + w / 2, leaf.y0 + h / 2 + scale * 0.6);

          context.font = '500 ' + Math.round(scale / 3) + 'px Rubik, sans-serif';
          var currencyValue = leaf.data.formattedPrice;
          context.fillText(currencyValue, leaf.x0 + w / 2, leaf.y0 + h / 2 + scale * 1.1);
        }
      });

      var fontArg = Math.max(canvasWidth, canvasHeight);
      var fontLinearFunc = d3
        .scaleLinear()
        .domain([0, fontArg / 3, fontArg / 1.5])
        .range([10, 12, 14]);
      var children = treemapData.children;
      for (var index = 0, len = children.length; index < len; index++) {
        var leaf = children[index];

        var w = leaf.x1 - leaf.x0;
        var h = leaf.y1 - leaf.y0;
        const scale = Math.min(w, h);
        if (w > 50 && h > 50) {
          var fontSize = fontLinearFunc(scale);
          var name = leaf.data.name;
          context.textBaseline = 'alphabetic';
          context.textAlign = 'left';
          context.fillStyle = '#ffffff';
          context.font = '500 ' + fontSize + 'px Rubik, sans-serif';
          context.fillText(name, leaf.x0 + 4, leaf.y0 + fontSize);
        }
      }

      context.restore();
    }

    element.innerHTML = '';
    element.append(canvas);

    window.crHeatmapWidget.attachOnClick(element);
    window.crHeatmapWidget.setHeader(element);
    window.crHeatmapWidget.setPoweredBy(element);
  };

  window.crHeatmapWidget.setHeader = (element) => {
    var top = element.dataset.top;
    var header = '';
    switch (top) {
      case 'coin':
        header = 'Top coins';
        break;
      case 'token':
        header = 'Top tokens';
        break;
      case '9999':
        header = 'All coins';
        break;
      default:
        header = `Top ${top} coins`;
    }

    var div = document.createElement('div');
    div.innerHTML = `<span style="padding-top: 6px; display: inline-block;">${header}</span>`;
    div.style =
      'height: 23px; color: #999; text-align: center; font-size: 14px; font-family: Rubik, sans-serif; background: #2E2D2F; text-transform: uppercase; font-weight: bold;';

    element.prepend(div);
  };

  window.crHeatmapWidget.setPoweredBy = (element) => {
    var div = document.createElement('div');
    div.style =
      'height: 18px; text-align: center; clear: both; font-size: 12px; font-family: Rubik, sans-serif; background: #2E2D2F;';

    var img = document.createElement('img');
    img.src = `${window.crHeatmapWidget.siteUrl}/static/logo-white.png`;
    img.style = 'height: 17px; vertical-align: middle; margin-left: 5px;';

    var link = document.createElement('a');
    link.href = window.crHeatmapWidget.siteUrl;
    link.target = '_blank';
    link.style = 'padding-top: 11px; text-decoration: none; color: #999; vertical-align: middle;';
    link.title = 'Powered by CryptoRank.io';
    link.innerText = 'Powered by ';
    link.append(img);

    div.append(link);
    element.append(div);
  };

  window.crHeatmapWidget.attachOnClick = (element) => {
    element.style.cursor = 'pointer';
    element.addEventListener('click', function () {
      window.open(`${window.crHeatmapWidget.siteUrl}/heatmaps`);
    });
  };

  (function (funcName, baseObj) {
    funcName = funcName || 'docReady';
    baseObj = baseObj || window;
    let readyList = [];
    let readyFired = false;
    let readyEventHandlersInstalled = false;

    function ready() {
      if (!readyFired) {
        readyFired = true;
        for (let i = 0; i < readyList.length; i++) {
          readyList[i].fn.call(window, readyList[i].ctx);
        }
        readyList = [];
      }
    }

    function readyStateChange() {
      if (document.readyState === 'complete') {
        ready();
      }
    }

    baseObj[funcName] = function (callback, context) {
      if (typeof callback !== 'function') {
        throw new TypeError('callback for docReady(fn) must be a function');
      }

      if (readyFired) {
        setTimeout(function () {
          callback(context);
        }, 1);
        return;
      } else {
        readyList.push({ fn: callback, ctx: context });
      }

      if (document.readyState === 'complete' || (!document.attachEvent && document.readyState === 'interactive')) {
        setTimeout(ready, 1);
      } else if (!readyEventHandlersInstalled) {
        if (document.addEventListener) {
          document.addEventListener('DOMContentLoaded', ready, false);
          window.addEventListener('load', ready, false);
        } else {
          document.attachEvent('onreadystatechange', readyStateChange);
          window.attachEvent('onload', ready);
        }
        readyEventHandlersInstalled = true;
      }
    };
  })('docReady', window);

  window.crHeatmapWidget.setBodyStyles();
  window.crHeatmapWidget.install();
}
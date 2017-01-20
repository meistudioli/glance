(function() {
	var fcamelCase, camelCase, getStyle, getSize, getPageScroll, getPosition, getPageSize, viewport, tracks, addTracking, imgReady, refresh, isRAFSupport;

	isRAFSupport = (typeof requestAnimationFrame != 'undefined') ? true : false;
	viewport = {
		leftTop: {
			x: 0,
			y: 0
		},
		rightBottom: {
			x: 0,
			y: 0
		}
	};
	tracks = [];

	fcamelCase = function (all, letter) {
		return letter.toUpperCase();
	};

	camelCase = function (str) {
		return str.replace(/-([a-z])/ig, fcamelCase);
	};

	getStyle = function(e, property) {
		var v = '';
		if (typeof(e.style) != 'undefined' && e.style[property]) v = e.style[property];
		else if (e.currentStyle) v = e.currentStyle[camelCase(property)];
		else if (window.getComputedStyle) v = document.defaultView.getComputedStyle(e,null).getPropertyValue(property.replace(/([A-Z])/g,'-$1').toLowerCase());
		if (v == undefined) v = 1;
		return v;
	};

	getSize = function(e) {
		var display = getStyle(e,'display'), size;
		if (display && display != 'none') size = [e.offsetWidth,e.offsetHeight];
		else {
			var style = e.style;
			var oriStyle = {visibility:style.visibility, position:style.position, display:style.display},
				newStyle = {visibility:'hidden', display:'block'};
			if (oriStyle.position !== 'fixed') newStyle.position = 'absolute';
			for (var i in newStyle) style[i] = newStyle[i];
			size = [e.offsetWidth,e.offsetHeight];
			for (var i in oriStyle) style[i] = oriStyle[i];
		}//end if
		return size;
	};

	getPageScroll = function() {
		var sX, sY;
		sX = (self.pageXOffset) ? self.pageXOffset : (document.documentElement && document.documentElement.scrollLeft) ? document.documentElement.scrollLeft : document.body.scrollLeft;
		sY = (self.pageYOffset) ? self.pageYOffset : (document.documentElement && document.documentElement.scrollTop) ? document.documentElement.scrollTop : document.body.scrollTop;
		return [sX, sY];
	};

	getPosition = function(target) {
		var x, y;
		x = 0;
		y = 0;
		while (target != null) {
			x += target.offsetLeft;
			y += target.offsetTop;
			target = target.offsetParent;
		}
		return [x, y];
	};

	getPageSize = function() {
		var xScroll, yScroll, windowWidth, windowHeight, pageWidth, pageHeight;
		
		if (window.innerHeight && window.scrollMaxY)  {xScroll = document.body.scrollWidth; yScroll = window.innerHeight + window.scrollMaxY; }
		else if (document.body.scrollHeight > document.body.offsetHeight){ xScroll = document.body.scrollWidth; yScroll = document.body.scrollHeight; }
		else { xScroll = document.body.offsetWidth; yScroll = document.body.offsetHeight; }
		
		if (self.innerHeight) {	windowWidth = self.innerWidth; windowHeight = self.innerHeight; }
		else if (document.documentElement && document.documentElement.clientHeight) { windowWidth = document.documentElement.clientWidth; windowHeight = document.documentElement.clientHeight; }
		else if (document.body) { windowWidth = document.body.clientWidth; windowHeight = document.body.clientHeight; }	
		
		pageHeight = (yScroll < windowHeight) ? windowHeight : yScroll;
		pageWidth = (xScroll < windowWidth) ? windowWidth : xScroll;
		return [pageWidth,pageHeight,windowWidth,windowHeight];
	};

	addTracking = function(node) {
		var imgs;
		if (typeof node.nodeType == 'undefined' || node.nodeType != 1) return;
		
		imgs = [];
		if (node.childNodes.length) {
			imgs = [].slice.call(node.querySelectorAll('img'));
		} else if (/img/i.test(node.tagName)) imgs = [node];

		imgs.forEach(
			function(img) {
				if (img.markGlance) return;
				img.markGlance = true;
				img.addEventListener('load', imgReady, false);
			}
		);
	};

	imgReady = function(e) {
		this.removeEventListener('load', imgReady, false);
		navigator.glanceRefresh();
	};

	refresh = function() {
		var scroll, page;

		scroll = getPageScroll();
		page = getPageSize();

		viewport.leftTop.x = scroll[0];
		viewport.leftTop.y = scroll[1];
		viewport.rightBottom.x = scroll[0] + page[2];
		viewport.rightBottom.y = scroll[1] + page[3];
		if (viewport.rightBottom.x > page[0]) viewport.rightBottom.x = page[0];
		if (viewport.rightBottom.y > page[1]) viewport.rightBottom.y = page[1];

		tracks.forEach(
			function(target) {
				if (typeof target.glanceCallBack == 'undefined' || !Array.isArray(target.glanceCallBack)) return;
				target.glanceCallBack.forEach(
					function(callBack) {
						callBack(target, navigator.inViewport(target));
					}
				);
			}
		);
	};

	//properties
	Object.defineProperties(navigator, {
		inViewport: {
			configurable: false,
			value: function(target) {
				var flag, pos, size, geo;

				if (typeof target.nodeType == 'undefined' || target.nodeType != 1) flag = false;
				else {
					pos = getPosition(target);
					size = getSize(target);
					geo = [
						{
							x: pos[0],
							y: pos[1]
						},
						{
							x: pos[0]+size[0],
							y: pos[1]
						},
						{
							x: pos[0]+size[0],
							y: pos[1]+size[1]
						},
						{
							x: pos[0],
							y: pos[1]+size[1]
						}
					];//leftTop, rightTop, rightBottom, leftBottom

					flag = geo.some(function(unit){
						return (unit.x >= viewport.leftTop.x && unit.x <= viewport.rightBottom.x && unit.y >= viewport.leftTop.y && unit.y <= viewport.rightBottom.y) ? true : false;
					});
				}//end if

				return flag;
			}
		},
		glance: {
			configurable: false,
			value: function(action, target, callBack) {
				if (!action || !target || !callBack) return;
				if (!/(add)|(remove)/i.test(action)) return;
				if (typeof target.nodeType == 'undefined' || target.nodeType != 1) return;

				if (action.toLowerCase() == 'add') {
					if (tracks.indexOf(target) == -1) tracks.push(target);
					if (typeof target.glanceCallBack == 'undefined' || !Array.isArray(target.glanceCallBack)) target.glanceCallBack = [];
					if (target.glanceCallBack.indexOf(callBack) == -1) target.glanceCallBack.push(callBack);
					this.glanceRefresh();
				} else {
					tracks.splice(tracks.indexOf(target), 1);
					if (typeof target.glanceCallBack == 'undefined' || !Array.isArray(target.glanceCallBack)) target.glanceCallBack.splice(target.glanceCallBack.indexOf(callBack), 1);
				}//end if
			}
		},
		glanceRefresh: {
			configurable: false,
			value: function(evt) {
				(isRAFSupport) ? requestAnimationFrame(refresh) : refresh();
			}
		}
	});

	//evt
	['resize', 'scroll'].forEach(
		function(e) {
			window.addEventListener(e, navigator.glanceRefresh, false);
		}
	);

	if (typeof MutationObserver != 'undefined') {
		var c, max, iid;

		c = 0;
		max = 10000;
		iid = setInterval(
			function() {
				c += 5;
				if (c >= max) {
					clearInterval(iid);
					return;
				}//end if
				if (document.body) {
					clearInterval(iid);
					new MutationObserver(
						function(mutations) {
							mutations.forEach(function(mutation) {
								[].slice.call(mutation.addedNodes).forEach(
									function(node) {
										addTracking(node);
									}
								);
							});
							navigator.glanceRefresh();
						}
					).observe(document.body, {childList:true, subtree:true});
					// ).observe(document.body, {childList:true, attributes:true, subtree:true});
					addTracking(document.body);
				}//end if
			}
		, 5);
	}//end if

	//init
	navigator.glanceRefresh();
})();
/*programed by mei(李維翰), http://www.facebook.com/mei.studio.li*/
/**
 * shopping.js
 */
YAHOO.namespace("SSS"); // Simple Shopping Search

/**
 * display status information
 * @module status
 * @return function
 */
YAHOO.SSS.status = function(){
	var _oStatusEl = document.getElementById("status");
	var _oTimer    = {};
		
	return {
		/**
		 * display status message with given strings
		 * @method show
		 * @param  {string} MessageType
		 * @param  {string} Message
		 */
		show: function(sMessageType, sMessage){
			clearTimeout(_oTimer);
			_oStatusEl.innerHTML = '<span class="' + sMessageType + '">'
								 + sMessage
								 + '</span>';
		},
		/**
		 * remove status message
		 * @method hide
		 */
		hide: function(){
			_oTimer = setTimeout(function(){
				_oStatusEl.innerHTML = "";
			}, 300);
		}
	};
}();

/**
 * provide to select shopping site
 * @module shopSelector
 * @return function
 */
YAHOO.SSS.shopSelector = function(){
	var _aMenuItems  = [
		{ text: "Amazon (JP)", value: "awsJp" },
		{ text: "Amazon (US)", value: "awsUs" }
	];
	var _sShop       = _aMenuItems[0].value;
	var _sShopName   = _aMenuItems[0].text;
	var _oDate       = new Date();
	var _nThisMonth  = _oDate.getMonth();
	_oDate.setMonth(_nThisMonth + 1);
	
	
	/**
	 * change menu label and shop when menu item clicked
	 * @method {private} _onMenuItemClick
	 * @param  {string} Type of event
	 * @param  {array}  Arguments
	 */
	var _onMenuItemClick = function(sType, aArgs){
		var oMenuItem = aArgs[1];
		_sShopName    = oMenuItem.cfg.getProperty("text");
		_sShop        = oMenuItem.value;
		_oMenuButton.set("label", _sShopName);
		
		YAHOO.util.Cookie.set("shop", _sShop, {expires: _oDate});
		
		YAHOO.log("refresh navigation for shop: " + _sShop);
		YAHOO.SSS.bcNavigation.init();
		YAHOO.SSS.data.search("ItemSearch", {ItemPage: 1});
	};

	// Create YUI MenuButton from HTML select element
	var _oMenuButton = new YAHOO.widget.Button("shop-selector", {
		type: "menu",
		menu: _aMenuItems
	});
	
	_oMenuButton.getMenu().subscribe("click", _onMenuItemClick);
	
	// Get default shop from cookie
	var sCookie = YAHOO.util.Cookie.get("shop");
	_sShop = sCookie ? sCookie : _sShop;
	for (var i=0, l=_aMenuItems.length; i<l; i++) {
		if (_aMenuItems[i].value == _sShop) {
			_sShopName = _aMenuItems[i].text;
			break;
		}
	}
	_oMenuButton.set("label", _sShopName);
	
	return {
		/**
		 * return shopping site
		 * @method getShop
		 * @return {string} shop
		 */
		getShop: function(){
			return _sShop + "Data";
		}
	};
}();


/**
 * Access to Amazon JP Data
 * @module awsJpData
 * @retrun function
 */
YAHOO.SSS.awsJpData = function(){
	var _status         = YAHOO.SSS.status;
	
	var _sAwsProxyUrl   = "http://www.stonedsoul.org/onca/json"	
	var _sAwsDomain     = "ecs.amazonaws.jp";
	var _sAwsAsscTag    = "ss0f-22";
	
	var _sBrowseNodeUrl = _sAwsProxyUrl
						+ "?_callback=YAHOO.SSS.awsJpData.processNode"
						+ "&_host=" + _sAwsDomain
						+ "&AssociateTag=" + _sAwsAsscTag
						+ "&Operation=BrowseNodeLookup"
						+ "&ResponseGroup=BrowseNodeInfo"
						+ "&BrowseNodeId=";
	var _sItemSearchUrl = _sAwsProxyUrl
						+ "?_host=" + _sAwsDomain
						+ "&Operation=ItemSearch"
						+ "&ResponseGroup=Small%2CImages%2CItemAttributes"
						+ "&AssociateTag=" + _sAwsAsscTag
						+ "&Keywords=";
	var _sCallbackfunc  = "YAHOO.SSS.productList.show";
	
	// YUI DataSource for ItemSearch
	var _oDataSource    = new YAHOO.util.ScriptNodeDataSource(_sItemSearchUrl, {
		generateRequestCallback: function(){
			return "&_callback=" + _sCallbackfunc;
		}
	});
	
	// Amazon JP node data
	var _oNodeCache = {
		"n0": [
				{ value: "0",         text: "ALL",                        SearchIndex: "Blended" },
				{ value: "465610",    text: "本",                         SearchIndex: "Books" },
				{ value: "562002",    text: "DVD",                        SearchIndex: "DVD" },
				{ value: "562032",    text: "音楽",                       SearchIndex: "Music" },
				{ value: "637630",    text: "PCソフト",                   SearchIndex: "Software" },
				{ value: "637872",    text: "ゲーム",                     SearchIndex: "VideoGames" },
				{ value: "3210991",   text: "家電&カメラ",                SearchIndex: "Electronics" },
				{ value: "3839151",   text: "ホーム&キッチン",            SearchIndex: "Kitchen" },
				{ value: "13299551",  text: "おもちゃ",                   SearchIndex: "Toys" },
				{ value: "14315361",  text: "スポーツ&アウトドア",        SearchIndex: "SportingGoods" },
				{ value: "57240051",  text: "食品＆飲料",                 SearchIndex: "Grocery" },
				{ value: "161669011", text: "ヘルス&ビューティー",        SearchIndex: "Beauty" },
				{ value: "331952011", text: "時計",                       SearchIndex: "Watches" },
				{ value: "344919011", text: "ベビー&マタニティ",          SearchIndex: "Baby" },
				{ value: "361245011", text: "アパレル＆ファッション雑貨", SearchIndex: "Apparel" }
		]
	};
	
	/**
	 * get current search index for ItemSearch
	 * @method _getSearchIndex
	 * @return {string} SearchIndex
	 */
	var _getSearchIndex = function(){
		var nCurrentRoot = YAHOO.SSS.bcNavigation.getCurrentRoot();
		var aRootNodes   = _oNodeCache["n0"];
		YAHOO.log("return current search index for current root node: " + nCurrentRoot);
		YAHOO.log("_getSearchIndex in JP", "warn");
		for (var i=0, l=aRootNodes.length; i<l; i++){
			if (aRootNodes[i].value == nCurrentRoot) {
				return aRootNodes[i].SearchIndex;
			}
		}
		return "All";
	};
		
	return {
		/**
		 * return YUI DataSource object for Amazon JP
		 * @method getDataSource
		 * @return {object} YUI DataSource
		 */
		getDataSource: function(){
			YAHOO.log("return DataSouce of awsJP");
			return _oDataSource;
		},
		/**
		 * return request query string for Amazon JP
		 * @method generateRequest
		 * @param  {string} Query string (keyword)
		 * @return {string} Query string with additional parameter
		 */
		generateRequest: function(sQuery){
			YAHOO.log("generate query string with: " + sQuery);
			var nNodeId = YAHOO.SSS.bcNavigation.getCurrentNode();
			if (nNodeId && nNodeId != 0) {
				sQuery += "&BrowseNode=" + nNodeId;
			}
			sQuery += "&SearchIndex=" + _getSearchIndex();
			YAHOO.log(sQuery);
			
			return sQuery;			
		},
		/**
		 * request to aws browse node lookup
		 * @method getNode
		 * @param  {number} NodeId
		 */
		getNode: function(nNodeId){
			YAHOO.log("requested data for NodeId: " + nNodeId);
			_status.show("info", "request data for node #" + nNodeId);
			
			var _bcNav   = YAHOO.SSS.bcNavigation;
			var nCacheId = "n" + nNodeId;
			if (_oNodeCache[nCacheId]) {
				YAHOO.log("cache hits for NodeId: " + nNodeId);
				_bcNav.show(nNodeId, _oNodeCache[nCacheId]);

			} else {
				// get Node Data from Amazon JP
				YAHOO.log("request node data to awsJP for NodeId: " + nNodeId);
				_status.show("info", "request node data to Amazon for node #" + nNodeId);
				
				var reqUrl = _sBrowseNodeUrl + nNodeId;
				YAHOO.util.Get.script(reqUrl);
			}
		},
		/**
		 * request to aws item search
		 * @method searchProduct
		 * @param  {number} ItemPage
		 */
		searchProduct: function(nItemPage){
			YAHOO.log("request item data to awsJp");
			var nPage       = nItemPage ? nItemPage : 1;
			var oInput      = document.getElementById("search-term");
			
			if (oInput.value) {
				YAHOO.log("attempt to search with keywords: " + oInput.value + ", Page: " + nPage, "warn");
				_status.show("info", "search with '" + oInput.value + "', page #" + nPage);
				
				var sKeyword = oInput.value;
				// triggered by paginator (continuous pagenation)
				var sQueryString = YAHOO.SSS.awsJpData.generateRequest( encodeURIComponent(sKeyword) );
				var sUrl         = _sItemSearchUrl
				                 + sQueryString
				                 + "&_callback=" + _sCallbackfunc;
				if (nPage > 1) {
					sUrl += "&ItemPage=" + nPage;
				}
				YAHOO.log(sUrl);
				YAHOO.util.Get.script(sUrl);
			}
		},
		/**
		 * updata cache and then execute callback function to display 
		 * node data in breadcrumb navigation
		 * @method processNode
		 * @param  {object} Data of node items
		 */
		processNode: function(oData){
			YAHOO.log("processNode with node data");
			_status.show("info", "node data received");
			
			//YAHOO.log("updateCache called with data: " + YAHOO.lang.JSON.stringify(oData));
			var oBrowseNodes = oData.BrowseNodeLookupResponse.BrowseNodes;
			try {
				var nNodeId  = oBrowseNodes.BrowseNode.BrowseNodeId;
				var nCacheId = "n" + nNodeId;
				
				// add data to _oNodeCache
				_oNodeCache[nCacheId] = [];
				// add parent node id to _oNodeCache[nCacheId][0]
				// this will be parent node ID in currentNode object
				_oNodeCache[nCacheId][0] = {
					value: oBrowseNodes.BrowseNode.BrowseNodeId,
					text: "ALL"
				};

				// if there are child nodes, add the nodes to _nodeCache
				if (oBrowseNodes.BrowseNode.Children) {
					//var aNodeList = oBrowseNodes.BrowseNode.Children.BrowseNode;
					var aNodeList = oBrowseNodes.BrowseNode.Children;
					for (var i=1, l=aNodeList.length; i<l; i++) {
						_oNodeCache[nCacheId][i] = { 
							value: aNodeList[i]["BrowseNodeId"],
							text: aNodeList[i]["Name"]
						};
					}
				}
				YAHOO.SSS.bcNavigation.show(nNodeId, _oNodeCache[nCacheId]);
				
			} catch(e) {
				YAHOO.log("can not update cache: " + e, "error");
				_status.show("error", "can not update node data: " + e);
			}
		}
	};
}();

/**
 * Access to Amazon US Data extends Amazon JP Data
 * @module awsUsData
 */
YAHOO.SSS.awsUsData = function(){
	var _status         = YAHOO.SSS.status;
	
	var _sAwsProxyUrl   = "http://www.stonedsoul.org/onca/json"
	var _sAwsDomain     = "webservices.amazon.com";
	var _sAwsAsscTag    = "s07f1-20";
	
	var _sBrowseNodeUrl = _sAwsProxyUrl
						+ "?_callback=YAHOO.SSS.awsUsData.processNode"
						+ "&_host=" + _sAwsDomain
						+ "&AssociateTag=" + _sAwsAsscTag
						+ "&Operation=BrowseNodeLookup"
						+ "&ResponseGroup=BrowseNodeInfo"
						+ "&BrowseNodeId=";
	var _sItemSearchUrl = _sAwsProxyUrl
						+ "?_host=" + _sAwsDomain
						+ "&Operation=ItemSearch"
						+ "&ResponseGroup=Small%2CImages%2CItemAttributes"
						+ "&AssociateTag=" + _sAwsAsscTag
						+ "&Keywords=";
	var _sCallbackfunc  = "YAHOO.SSS.productList.show";
	
	// YUI DataSource for ItemSearch
	var _oDataSource    = new YAHOO.util.ScriptNodeDataSource(_sItemSearchUrl, {
		generateRequestCallback: function(){
			return "&_callback=" + _sCallbackfunc;
		}
	});
	
	// Amazon US node data
	var _oNodeCache     = {
		"n0": [
				{ value: "0",         text: "ALL",                        SearchIndex: "Blended" },
				{ value: "1000",      text: "Books",                      SearchIndex: "Books" },
				{ value: "130",       text: "DVD",                        SearchIndex: "DVD" },
				{ value: "301668",    text: "Music",                      SearchIndex: "Music" },
				{ value: "409488",    text: "Software",                   SearchIndex: "Software" },
				{ value: "493964",    text: "Video Games",                SearchIndex: "VideoGames" },
				{ value: "493964",    text: "Electronics",                SearchIndex: "Electronics" },
				{ value: "285080",    text: "Home & Garden",              SearchIndex: "HomeGarden" },
				{ value: "493964",    text: "Toys",                       SearchIndex: "Toys" },
				{ value: "1079730",   text: "Sports & Outdoors",          SearchIndex: "SportingGoods" },
				{ value: "3580501",   text: "Gourmet Food",               SearchIndex: "GourmetFood" },
				{ value: "11055981",  text: "Health & Beauty",            SearchIndex: "Beauty" },
				{ value: "1036682",   text: "Kids & Baby",                SearchIndex: "Baby" },
				{ value: "1036682",   text: "Apparel",                    SearchIndex: "apparel" }
			
		]
	};
	
	/**
	 * get current search index for ItemSearch
	 * @method _getSearchIndex
	 * @return {string} SearchIndex
	 */
	var _getSearchIndex = function(){
		var nCurrentRoot = YAHOO.SSS.bcNavigation.getCurrentRoot();
		var aRootNodes   = _oNodeCache["n0"];
		YAHOO.log("return current search index for current root node: " + nCurrentRoot);
		YAHOO.log("_getSearchIndex in US", "warn");
		for (var i=0, l=aRootNodes.length; i<l; i++){
			if (aRootNodes[i].value == nCurrentRoot) {
				return aRootNodes[i].SearchIndex;
			}
		}
		return "All";
	};
		
	return {
		/**
		 * return YUI DataSource object for Amazon JP
		 * @method getDataSource
		 * @return {object} YUI DataSource
		 */
		getDataSource: function(){
			YAHOO.log("return DataSouce of awsJP");
			return _oDataSource;
		},
		/**
		 * return request query string for Amazon JP
		 * @method generateRequest
		 * @param  {string} Query string (keyword)
		 * @return {string} Query string with additional parameter
		 */
		generateRequest: function(sQuery){
			YAHOO.log("generate query string with: " + sQuery);
			var nNodeId = YAHOO.SSS.bcNavigation.getCurrentNode();
			if (nNodeId && nNodeId != 0) {
				sQuery += "&BrowseNode=" + nNodeId;
			}
			sQuery += "&SearchIndex=" + _getSearchIndex();
			YAHOO.log(sQuery);
			
			return sQuery;			
		},
		/**
		 * request to aws browse node lookup
		 * @method getNode
		 * @param  {number} NodeId
		 */
		getNode: function(nNodeId){
			YAHOO.log("requested data for NodeId: " + nNodeId);
			_status.show("info", "request data for node #" + nNodeId);
			
			var _bcNav   = YAHOO.SSS.bcNavigation;
			var nCacheId = "n" + nNodeId;
			if (_oNodeCache[nCacheId]) {
				YAHOO.log("cache hits for NodeId: " + nNodeId);
				_bcNav.show(nNodeId, _oNodeCache[nCacheId]);

			} else {
				// get Node Data from Amazon US
				YAHOO.log("request node data to awsUS for NodeId: " + nNodeId);
				_status.show("info", "request node data to Amazon for node #" + nNodeId);
				
				var reqUrl = _sBrowseNodeUrl + nNodeId;
				YAHOO.util.Get.script(reqUrl);
			}
		},
		/**
		 * request to aws item search
		 * @method searchProduct
		 * @param  {number} ItemPage
		 */
		searchProduct: function(nItemPage){
			YAHOO.log("request item data to awsJp");
			var nPage       = nItemPage ? nItemPage : 1;
			var oInput      = document.getElementById("search-term");
			
			if (oInput.value) {
				YAHOO.log("attempt to search with keywords: " + oInput.value + ", Page: " + nPage, "warn");
				_status.show("info", "search with '" + oInput.value + "', page #" + nPage);
				
				var sKeyword = oInput.value;
				// triggered by paginator (continuous pagenation)
				var sQueryString = YAHOO.SSS.awsUsData.generateRequest( encodeURIComponent(sKeyword) );
				var sUrl         = _sItemSearchUrl
				                 + sQueryString
				                 + "&_callback=" + _sCallbackfunc;
				if (nPage > 1) {
					sUrl += "&ItemPage=" + nPage;
				}
				YAHOO.log(sUrl);
				YAHOO.util.Get.script(sUrl);
			}
		},
		/**
		 * updata cache and then execute callback function to display 
		 * node data in breadcrumb navigation
		 * @method processNode
		 * @param  {object} Data of node items
		 */
		processNode: function(oData){
			YAHOO.log("processNode with node data");
			_status.show("info", "node data received");
			
			//YAHOO.log("updateCache called with data: " + YAHOO.lang.JSON.stringify(oData));
			var oBrowseNodes = oData.BrowseNodeLookupResponse.BrowseNodes;
			try {
				var nNodeId  = oBrowseNodes.BrowseNode.BrowseNodeId;
				var nCacheId = "n" + nNodeId;
				
				// add data to _oNodeCache
				_oNodeCache[nCacheId] = [];
				// add parent node id to _oNodeCache[nCacheId][0]
				// this will be parent node ID in currentNode object
				_oNodeCache[nCacheId][0] = {
					value: oBrowseNodes.BrowseNode.BrowseNodeId,
					text: "ALL"
				};

				// if there are child nodes, add the nodes to _nodeCache
				if (oBrowseNodes.BrowseNode.Children) {
					//var aNodeList = oBrowseNodes.BrowseNode.Children.BrowseNode;
					var aNodeList = oBrowseNodes.BrowseNode.Children;
					for (var i=1, l=aNodeList.length; i<l; i++) {
						_oNodeCache[nCacheId][i] = { 
							value: aNodeList[i]["BrowseNodeId"],
							text: aNodeList[i]["Name"]
						};
					}
				}
				YAHOO.SSS.bcNavigation.show(nNodeId, _oNodeCache[nCacheId]);
				
			} catch(e) {
				YAHOO.log("can not update cache: " + e, "error");
				_status.show("error", "can not update node data: " + e);
			}
		}
	};
}();



/**
 * handling search request, send request to appropriate data source
 * @module data
 * @return function
 */
YAHOO.SSS.data = function(){
	var _status            = YAHOO.SSS.status;
	
	var _shopSelector      = YAHOO.SSS.shopSelector;
	var _oAutoCompleteConf = {
		minQueryLength: 3,
		queryDelay: 0.4,
		suppressInputUpdate: true
	};
	
	return {
		/**
		 * request to appropriate data source
		 * @method search
		 * @param  {string} Operation type
		 * @param  {object} Args
		 */
		search: function(sOperation, oArgs){
			var sShop     = _shopSelector.getShop();
			var _shopData = YAHOO.SSS[sShop];
			
			if (sOperation === "BrowseNodeLookup") {
				YAHOO.log("search node to " + sShop);
				_shopData.getNode(oArgs["NodeId"]);
				
			} else if (sOperation === "ItemSearch") {
				YAHOO.log("search product to " + sShop);
				_shopData.searchProduct(oArgs["ItemPage"]);
			}
		},
		/**
		 * return appropriate YUI DataSource object for appropreate shop
		 * @method getDataSource
		 * @return {object} DataSource
		 */
		getDataSource: function(){
			var sShop     = _shopSelector.getShop();
			var _shopData = YAHOO.SSS[sShop];
			YAHOO.log("get DataSouce from " + sShop);
			return _shopData.getDataSource();
		},
		/**
		 * return configuration for YUI AutoComplete
		 * @method getAutoCompleteConf
		 * @return {object} AutoCompleteConf
		 */
		getAutoCompleteConf: function(){
			return _oAutoCompleteConf;
		},
		/**
		 * return request query string for appropriate shop
		 * @method generateRequest
		 * @param  {string} Query string (keyword)
		 * @return {string} Query string with additional parameter
		 */
		generateRequest: function(sQuery){
			var sShop     = _shopSelector.getShop();
			var _shopData = YAHOO.SSS[sShop];
			return _shopData.generateRequest(sQuery);
		}
	};
}();

/**
 * breadcrumb navigation component
 * @module bcNavigation
 * @return function
 */
YAHOO.SSS.bcNavigation = function(){
	var _status       = YAHOO.SSS.status;
	var _data         = YAHOO.SSS.data;
	
	var _oTimer       = {};
	var _sContainer   = "breadcrumb";
	var _nCurrentNode = 0;
	var _nCurrentRoot = 0;
	
	/**
	 * create menu button with given node ID and the data
	 * @method _createMenuButton
	 * @param  {number} NodeId
	 * @param  {array}  NodeList
	 * @return {object} YUI Menu Button
	 */
	var _createMenuButton = function(nNodeId, aNodeList){
		YAHOO.log("create menubutton for node: " + nNodeId);
		_status.show("info", "adding menu for node #" + nNodeId);
		
		/**
		 * show menu list under menu button
		 * @method {private} _showMenu
		 */
		var _showMenu = function(){
			YAHOO.log("show dropdown menu");
			clearTimeout(_oTimer["n"+nNodeId]);
			
			// get position of menu button and set position of
			// menu list to be under the menu button, and then
			// show menu list
			var oMenuList = oMenuButton.getMenu();
			var aMenuAlignment = oMenuButton.get("menualignment");
			oMenuList.cfg.setProperty("context",
				[
					oMenuButton.get("element"),
					aMenuAlignment[0],
					aMenuAlignment[1]
				]
			);
			oMenuList.show();
		};
		
		/**
		 * hide menu list
		 * @method {private} _hideMenu
		 */
		var _hideMenu = function(){
			YAHOO.log("hide dropdown menu");
			_oTimer["n"+nNodeId] = setTimeout(function(){
				oMenuButton.getMenu().hide();
			}, 100);
		};
		/**
		 * change label of menu button and create menu button
		 * for child node of selected node
		 * @method {private} _onMenuItemClick
		 * @param {string} Event Type
		 * @param {array} Arguments
		 * @param {object} MenuItem
		 */
		var _onMenuItemClick = function(sType, aArgs, oMenuItem){
			YAHOO.log("menu item clicked");
			var sNodeName  = oMenuItem.cfg.getProperty("text");
			var oContainer = oMenuItem.parent.cfg.getProperty("container");
			_nCurrentNode  = oMenuItem.value;
			
			if (oContainer.lastChild.className === "node-menu") {
				// if there are button menus in child node, remove it
				oContainer.removeChild(oContainer.lastChild);
			}
						
			if (oContainer.id === "n0") {
				// if it's root node, update current root node
				_nCurrentRoot = _nCurrentNode;
			}
			
			oMenuButton.set("label", sNodeName);
			
			if (oContainer.id !== "n" + _nCurrentNode) {
				// create menu button for selected node 
				// only if "すべての商品" (ALL Items) is not selected
				YAHOO.log("call bcNavigation for child node: " + _nCurrentNode);
				YAHOO.SSS.bcNavigation.add(_nCurrentNode, oContainer.id); // create menu button for child node
			}
			
			YAHOO.SSS.productList.resetItemPage();
			YAHOO.SSS.data.search("ItemSearch", {"Callback": "YAHOO.SSS.productList.show"});
		};
		
		// Main logic of _createMenuButton
		// create container <div id="n[nodeId]" class="node-menu"></div>
		// and append it under parent node
		var oMenuContainer       = document.createElement("div");
		oMenuContainer.id        = "n" + nNodeId;
		oMenuContainer.className = "node-menu";
		var oParentEl            = document.getElementById(_sContainer);
		oParentEl.appendChild(oMenuContainer);
		
		// create menu item data with function for onclick event
		var aMenuItemData = [];
		for (var i=0, l=aNodeList.length; i<l; i++) {
			aMenuItemData[i] = {};
			aMenuItemData[i]["value"]   = aNodeList[i]["value"];
			aMenuItemData[i]["text"]    = aNodeList[i]["text"];
			aMenuItemData[i]["onclick"] = { fn: _onMenuItemClick };
		}

		var oMenuButton = new YAHOO.widget.Button({
			type: "menu",
			label: "ALL",
			menu: aMenuItemData,
			container: oMenuContainer,
			focusmenu: false
		});
		oMenuButton.MENUBUTTON_DEFAULT_TITLE      = "";
		oMenuButton.MENUBUTTON_MENU_VISIBLE_TITLE = "";
		
		// apply fade effect to menu
		var oMenuList = oMenuButton.getMenu();
		oMenuList.cfg.applyConfig({
			effect:{
				effect: YAHOO.widget.ContainerEffect.FADE,
				duration:0.3
			}
		});
		
		// Add event listener to the menu button
		oMenuButton.subscribe("appendTo", function(){
			_showMenu();
			_oTimer["n"+nNodeId] = setTimeout(_hideMenu, 1800);			
		});
		oMenuButton.subscribe("mouseover", _showMenu);
		oMenuButton.subscribe("mouseout", _hideMenu);
		// Add event listener to the menu list
		oMenuList.subscribe("mouseover", _showMenu);
		oMenuList.subscribe("mouseout", _hideMenu);
		
		_status.hide();
		return oMenuButton;
	};
		
	return {
		/**
		 * initialize breadcrumb
		 * @method init
		 */
		init: function(){
			YAHOO.log("initialize breadcrumb");
			_nCurrentNode = 0;
			document.getElementById("breadcrumb").innerHTML = "";
			this.add(0, "breadcrumb");
		},
		/**
		 * create and add navigation menu button to breadcrumb
		 * @method add
		 * @param  {number} NodeId
		 * @param  {string} Container Id
		 */
		add: function(nNodeId, sContainer){
			YAHOO.log("add navigation menu item");
			_sContainer = sContainer;
			_data.search("BrowseNodeLookup", {"NodeId": nNodeId});
		},
		/**
		 * display added navigation menu
		 * @method show
		 * @param  {number} NodeId
		 * @param  {array}  NodeList
		 */
		show: function(nNodeId, aNodeList){
			YAHOO.log("show navigation menu item");
			_createMenuButton(nNodeId, aNodeList);
		},
		/**
		 * return current node ID
		 * @method getCurrentNode
		 * @return {number} NodeId
		 */
		getCurrentNode: function(){
			return _nCurrentNode;
		},
		/**
		 * return current root node ID
		 * @method getCurrentRoot
		 * @return {number} NodeId
		 */
		getCurrentRoot: function(){
			return _nCurrentRoot;
		}
	};
}();

/**
 * product search component
 * @module productSearch
 * @return void
 */
YAHOO.SSS.productSearch = function(){
	var _status  = YAHOO.SSS.status;
	var _data    = YAHOO.SSS.data;

	var _oAcConf = _data.getAutoCompleteConf();
	
	/**
	 * Create YUI AutoComplete widget
	 * @method {private} _createAutoComplete
	 */
	var _createAutoComplete = function(){
		var _oAutoComplete = new YAHOO.widget.AutoComplete("search-term",
			"search-results",
			_data.getDataSource(),
			{
				minQueryLength: _oAcConf["minQueryLength"],
				queryDelay: _oAcConf["queryDelay"],
				generateRequest: function(sQuery){
					_status.show("info", "search with '" + decodeURIComponent(sQuery) + "', page #1");
					YAHOO.SSS.productList.resetItemPage();
					return _data.generateRequest(sQuery);
				},
				suppressInputUpdate: _oAcConf["suppressInputUpdate"]
			}
		);
		// prevent focus to input text when ac-container clicked
		YAHOO.util.Event.removeListener("search-results", "mouseover");
	};
	
	_createAutoComplete();
	
	return {
		/**
		 * initialize AutoComplete widget
		 * @method init
		 */
		init: function(){
			_createAutoComplete();
		}
	};
}();

/**
 * display search results (product list)
 * @module productList
 * @return function
 */
YAHOO.SSS.productList = function(){
	var _status      = YAHOO.SSS.status;

	var _nTotalPages = 1;
	var _nItemPage   = 1;
	
	/**
	 * create list element for product data
	 * @method _createList
	 * @param  {array} ItemList
	 * @param  {object} FieldDefinition
	 * @return {object} List Element
	 */
	var _createList = function(aItemList, oFieldDef){
		YAHOO.log("create list element for the search results");
		
		var nLen = 0;
		// check if item list is array or object (one item)
		if (aItemList.length) {
			nLen = aItemList.length;
		} else if (typeof aItemList == "object" && aItemList.ASIN) {
			nLen = 1;
			aItemList[0] = aItemList;
		}
		
		var oUl = document.createElement("ul");

		if (nLen > 0) {
			var sItemList = "";
			for (var i = 0; i < nLen; i++) {
				var sUrl    = decodeURIComponent(aItemList[i][oFieldDef.url]);
				var oItem   = aItemList[i][oFieldDef.item];
				var sTitle  = oItem.Title;
				var sAuthor = oItem.Author ? oItem.Author : "";
				var sPrice  = oItem.ListPrice ? oItem.ListPrice.FormattedPrice : "";
				
				// find image data in search results
				if (aItemList[i][oFieldDef.images] && aItemList[i][oFieldDef.images].length) {
					var oImage = aItemList[i][oFieldDef.images][0].ThumbnailImage;
					
				} else if (aItemList[i][oFieldDef.images] && aItemList[i][oFieldDef.images].ImageSet) {
					var oImage = aItemList[i][oFieldDef.images].ImageSet.ThumbnailImage;
					
				} else {
					var oImage = undefined;
				}
				
				if (oImage) {
					var sImg = '<span class="item-img">'
							 + '<img src="' + oImage.URL + '"'
					         + ' width="' + oImage.Width + '"'
					         + ' height="' + oImage.Height + '" />'
					         + '</span>';
				} else {
					var sImg = '<span class="item-img">'
							 + '<img src="http://app.stonedsoul.org/no_img.png"'
							 + ' width="60" height="75" />'
							 + '</span>';
				}
				sItemList += '<li><a href="' + sUrl + '" target="_blank">'
				           +  sImg 
				           + '<span class="item-name">' + sTitle + '</span></a><br />'
				           + '<span class="price">' + sPrice + '</span></li>';
			}
			oUl.innerHTML = sItemList;
		}
		return oUl;
	};
	
	/**
	 * load next page item when page is scrolled down to the bottom
	 * @method _autoPaginate
	 */
	var _autoPaginate = function(){
		YAHOO.log("check position and load next page if necessary");
		var _dom = YAHOO.util.Dom;
		var nViewPortY = _dom.getViewportHeight();
		var nDocHeight = _dom.getDocumentHeight();
		var nTopY      = _dom.getDocumentScrollTop();
		YAHOO.log("DocumentHeight: " + nDocHeight + ", View Y: " + nViewPortY + ", Top Y: " + nTopY);
		
		if (nTopY > nDocHeight - nViewPortY - 12) {
			_nItemPage += 1;
			if (_nItemPage <= _nTotalPages) {
				YAHOO.log("call next page: " + _nItemPage);
				YAHOO.SSS.data.search("ItemSearch", {"ItemPage": _nItemPage});
			}
		}
	};
	
	// assign _autoPaginate method to scroll event
	YAHOO.util.Event.onDOMReady(function(){
		YAHOO.log("assign _autoPaginate");
		YAHOO.util.Event.addListener(window, "scroll", _autoPaginate);
	});
	
	return {
		/**
		 * display search results
		 * @method show
		 * @param  {object} Data of product search results
		 */
		show: function(oData){
			YAHOO.log("display search results");
			_status.show("info", "creating product list..");
			
			//YAHOO.log("widget.list.show called for results: " + YAHOO.lang.JSON.stringify(oData));
			var oResults = oData.ItemSearchResponse.Items;
			var nResCnt  = oResults.TotalResults;
			var aItems   = oResults.Item ? oResults.Item : [];
			_nTotalPages = oResults.TotalPages;
			

			var oItemList = _createList(aItems, {
							 	url:   "DetailPageURL",
							 	item:  "ItemAttributes",
							 	images:"ImageSets",
							 	rating:"AverageRating"
							 });
			var oResultEl = document.getElementById("search-results");
			if (oItemList) {
				YAHOO.log("display items for Page: " + _nItemPage);
				if (_nItemPage == 1) {
					oResultEl.innerHTML = "<p>" + nResCnt + " items found</p>";
				}
				oResultEl.appendChild(oItemList);
			} else {
				oResultEl.innerHTML = "<p class='center'>No item found</p>";
			}
			_status.hide();
		},
		/**
		 * reset current page number
		 * @method resetItemPage
		 */
		resetItemPage: function(){
			_nItemPage = 1;
		}
	};
}();

/**
 * create YUILogger for debug and initialize navigation
 * @module main
 */
YAHOO.SSS.main = function(){
	// YUILogger for debug
	var loggerConf = {
		width:"420px",
		right:"10px",
		draggable:"true"
	};
	//var yuiLogger = new YAHOO.widget.LogReader(loggerConf);
	//yuiLogger.collapse();
	
	// initialize navigation menu
	YAHOO.util.Event.onDOMReady(function(){
		YAHOO.log("initialize breadcrumb navigation");
		YAHOO.SSS.bcNavigation.init();
	});
}();



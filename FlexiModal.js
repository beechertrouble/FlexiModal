/**
* Liquid Layout Modal Thing ...
* v.3.0
*
* feed me an array of slides.
	each slide can have :
	 	- content
	 	- caption
*	
*
* requires some css 
*
* @beecher : todo :
* 	- local caching 
* 	- slideshow play/pause ?
*	- touch events ?
*	- animations ?
*/

window.FlexiModalCount = 0;

var FlexiModal = function(args) {
	
	FlexiModalCount++;

	args = args !== undefined ? args : {};
		
	this.ID = args.ID !== undefined ? args.ID : 'FM_' + FlexiModalCount;
	this.mainPieces = '';
	this.loaderBg = '';
	this.isBound = false;
	this.isOpen = false;
	this.loaded = false;
	this.media = args.media !== undefined ? args.media : undefined;
	this.showCaptions = args.showCaptions !== undefined ? args.showCaptions : false;
	this.captions = [];
	this.count = 0;
	this.currentIdx = args.currentIdx !== undefined ? args.currentIdx : 0;
	this.showCallback = args.showCallback !== undefined ? args.showCallback : undefined;
	this.hideCallback = args.hideCallback !== undefined ? args.hideCallback : undefined;
	this.HTMLadded = false;
	this.closeHTML = '';
	this.closePos = args.closePos !== undefined ? args.closePos : 'modal'; // window | modal
	this.centerTryCount = 0;
	this.doBlur = args.doBlur !== undefined ? args.doBlur : false;
	this.clearContent = args.clearContent !== undefined ? args.clearContent : true;

	// ======================== funcs …
	this.load = function(media) {		
	
		var ID = this.ID,
			content = '<div id="' + ID + '_content_wrap">' + media.content + '</div>';
		
		$("#" + ID + "_content_wrap").remove();
		$("#" + ID + "_wrap").append(content);	
		
		this.loaded = true;	
			
		var caption = media.caption;
				
		switch (true) {
			
			case (caption === null):
			case (caption == ''):
			case (caption === undefined):
				$("#" + ID + "_caption").html('').hide();
				break;
			
			default:
				$("#" + ID + "_caption").html(caption).show();
				break;	
		
		}
	
	} //
	this.center = function() {
					
		var ME = this,
			ID = this.ID,
			imgTest = $("#" + ID + "_wrap").html().indexOf('<img') >= 0 ? true : false;
				
		ME.centerIt();
		
		/*
		if(imgTest) {
			
			$("#FM_wrap img").load(function(){
				
				ME.centerIt();
				
			});
			
		} else {
			
			ME.centerIt();
						
		} */
		
	} //
	this.centerIt = function() {
		
		var FM = this,
			ID = this.ID;
		
		var wH = $(window).height(),
			subNavHeight = $("#" + ID + "_subnav_wrap").height() === undefined ? 0 : $("#" + ID + "_subnav_wrap").height() * 1,
			mH = $("#" + ID + "_wrap").height() + subNavHeight,
			scrollTop = $(window).scrollTop(),
			mTop = mH < wH ? Math.floor( (wH - mH) / 2) + scrollTop : scrollTop;
			
			// override for juno
			mTop = scrollTop + 70;
		//	this.centerClose();
						
		if(mH == 0 && this.centerTryCount < 10) {
		
			this.centerTryCount = this.centerTryCount + 1;
			setTimeout(function() { FM.centerIt(); }, 200);
			
		} else {
						
			$("#" + ID + "_layer")
				.css({
					'top': mTop + 'px',
					'left': '0px'
					});
					
			this.centerTryCount = 0;
		}
		
	} //
	this.setMedia = function(newMedia) {
	
		var theMedia = newMedia === undefined ? this.media : newMedia;
		
		if(theMedia !== undefined) {
						
			this.media = typeof theMedia == "array" || typeof theMedia == "object" ? theMedia : [theMedia]; 
			
			this.count = this.media.length;
			
		} 
		
	} //
	this.bind = function() {
		
		if(!this.isBound) {
			
			var FM = this,
				ID = this.ID;
			
			if(!this.HTMLadded)
				this.requireHTML();
				
			this.setMedia(); 
			this.mainPieces = $("#" + ID + "_curtain, #" + ID + "_layer, #" + ID + "_close_curtain, #" + ID + "_uber_wrap");
			this.nextPrev = $("#" + ID + "_next, #" + ID + "_prev");
			this.loaderBg = $("#" + ID + "_wrap").css('background-image');
					
			this.mainPieces
				.bind('click', function(e){
					
					e.preventDefault();
									
					FM.close();
					
				});
			
			/* do not require double click on ipad */
			$(".mobile #" + ID + "_close_curtain")
				.bind('mouseover', function(e){
					
					e.preventDefault();
									
					FM.close();
					
				});
			
			$("#" + ID + "_close_curtain, #" + ID + "_wrap, #" + ID + "_wrap *")
				.bind('click', function(e){
					
					 e.stopPropagation();	
					 		
				});
				
			this.nextPrev
				.bind('click', function(e){
					
					e.preventDefault();
					
					if($(this).is(".FM_prev")) {
						
						FM.prev();
					
					} else if($(this).is(".FM_next"))  {
						
						FM.next();
					
					}
				
				});
											
			$("body")
				.bind('keyup', function(e){
					
					// 37, 39, 27 = left, right, esc
															
					if(FM.isOpen) {
						
						var code = (e.keyCode ? e.keyCode : e.which);
																	
						if(code == 37) { FM.prev(); } // left
						if(code == 39) { FM.next(); } // right
						if(code == 27) { FM.close(); } // esc
					
					}
					
				});
				
				
			this.isBound = true;
			
		}
	
	} //
	this.next = function() {
		
		var nextIdx = (this.currentIdx + 1) < this.count ? this.currentIdx + 1 : 0; // loops to first …
		
		this.show(nextIdx);
	
	} //
	this.prev = function() {
	
		var prevIdx = (this.currentIdx - 1) >= 0 ? this.currentIdx - 1 : this.count - 1; // loops to last …	
		
		this.show(prevIdx);
	
	} //
	this.showHideNav = function() {
		
		var FM = this,
			ID = this.ID;
				
		if(this.count > 1) {
		
			var subnav = '',
				currentIdx = this.currentIdx;
			
			// build subnav
			for(var i=0;i<this.media.length;i++) {
				
				var current = currentIdx == i ? 'active' : '';
				
				subnav += '<a id="FM_subnav_' + i + '" class="'  + ID + '_subnav_button FM_subnav_button ' + current + '" rel="' + i + '">' + (i + 1) + '</a>';
				
				if((i + 1) == FM.media.length) {
					
					$("#" + ID + "_subnav_wrap").html(subnav);
					
					$("." + ID + "_subnav_button")
						.bind('click', function(e) {
							
							e.preventDefault();
							
							var idx = $(this).attr('rel') * 1;
														
							FM.show(idx);
														
						});
						
					$("." + ID + "_nav_item").show();
					
				}
				
			}
					
		} else {
			
			$("." + ID + "_nav_item").hide();
		
		}
		
	} //
	this.show = function(idxOrSrc) {
				
		var me = this,
			ID = me.ID;
		
		this.isOpen = true;
		
		// bind it up, if it's not already
		if(!this.isBound)
			this.bind();
		
		var media = this.media[0];
		
		this.currentIdx = 0;
				
		if(idxOrSrc !== undefined) {
			
			media = typeof idxOrSrc == "number" ? this.media[idxOrSrc] : idxOrSrc;
			
			this.currentIdx = typeof idxOrSrc == "number" ? idxOrSrc : this.media.indexOf(idxOrSrc);
						
		}
		
		if(!this.loaded || this.clearContent)		
			this.load(media);
		
		this.showHideNav();
		
		this.center();
		
		this.mainPieces
			.not("#" + ID + "_uber_wrap")
			.fadeIn(500, function(){
			
				me.blur();
			
			});
			
		$("#" + ID + "_uber_wrap")
			.delay(500)
			.fadeIn(500, function() {
				
				me.doCallback(me.showCallback);
				
			});
		
		var pageMarker = (this.currentIdx + 1) + ' / ' + this.count;	
			
		$("#" + ID + "_pagemarker").html(pageMarker);
			
											
	} //
	this.close = function() {
		
		var me = this,
			ID = me.ID;
		
		me.unBlur();
		
		this.mainPieces	
			.not("#" + ID + "_uber_wrap")
			.fadeOut("fast", function(){
				
				$("#" + ID + "_layer")
					.css({
						top : '-9999px',
						left : '-9999px',
						display : 'block'
					});
				
			});	
			
		$("#" + ID + "_uber_wrap")
			.fadeOut("fast", function() {
				
				me.doCallback(me.hideCallback);
				
			});
			
		this.isOpen = false;
	
	} //
	this.requireHTML = function() {
	
		var ID = this.ID;
			this.closeHTML = '<a id="' + ID + '_close_curtain" class="FM_close_curtain" href="#">X</a>';
			windowClosePos = this.closePos == 'window' ? this.closeHTML : '',
			modalClosePos = this.closePos == 'modal' ? this.closeHTML : '';
		
		var HTML = '<div id="' + ID + '_loading" class="FM_loading"></div>'
					+ '<div id="' + ID + '_curtain" class="FM_curtain"></div>'
					+ '<div id="' + ID + '_layer" class="FM_layer">'
						+ '<div id="' + ID + '_uber_wrap" class="FM_uber_wrap">'
							+ windowClosePos
							+ '<div id="' + ID + '_wrap" class="FM_wrap">'
								+ modalClosePos
							+ '</div>'
							+ '<a id="' + ID + '_prev" class="FM_prev FM_nav ' + ID + '_nav_item" href="#" rel="prev"></a>'
							+ '<a id="' + ID + '_next" class="FM_next FM_nav ' + ID + '_nav_item" href="#" rel="next"></a>'
							+ '<div id="' + ID + '_nav_wrap" class="FM_nav_wrap">'
								+ '<div id="' + ID + '_caption" class="FM_caption"></div>'
								+ '<div class="FM_subnav_wrap ' + ID + '_nav_item"></div>'
								+ '<div class="FM_pagemarker ' + ID + '_nav_item"></div>'
							+ '</div>'
						+ '</div>'
					+ '</div>';
				
		$("body").append(HTML);
		
		this.HTMLadded = true;
		
	} //
	this.addCallback = function(at, newCallback) {
				
		var me = this;
		
		if(at == 'showCallback' || at == 'hideCallback') { // only for allowed callback points 
		
			var callback,
				current = this[at];
								
			switch(true) {
				
				case (current === undefined):
					callback = newCallback;
					break;
				
				case ((typeof current == 'array' || typeof callback == 'object') && !me.inArray(newCallback, current)):
					current.push(newCallback);
					callback = current;
					break;
					
				case (typeof current == 'function' && ('' + newCallback != '' + current)):
					callback = [];
					callback.push(current);
					callback.push(newCallback);
					break;
				
				default:
					callback = current;
					break;
				
			}
			this[at] = callback;

		}
		
	} //
	this.doCallback = function(callback) {
						
		switch(true) {
			
			case(typeof callback == 'function'):
				callback();
				break;
			
			case(typeof callback == 'array' || typeof callback == 'object'):
				for(var i=0; i<callback.length; i++){
					var cb =  callback[i];
					if(typeof cb == 'function') {
						cb();
					}
				}
				break;
			
		}
		
	} //
	this.inArray = function(needle, haystack) {
				
		if(typeof haystack == 'array' || typeof haystack == 'object') {
			
			var needle = '' + needle,
				len = haystack.length,
				count = 0;
				
			for(var i in haystack) {
				
				count++;
				
				var test = '' + haystack[i];
								
				if(test == needle) return true;
				
				if(count == len && test != needle) return false;	
				
			}
			
		} else {return false;}	
		
	} //
	this.blur = function() {
		
		if(this.doBlur)
			$("body").children().not('.FM_curtain, .FM_close_curtain, .FM_layer').addClass("blurry");	
		
	} //
	this.unBlur = function() {
		
		if(this.doBlur)
			$("body").children().not('.FM_curtain, .FM_close_curtain, .FM_layer').removeClass("blurry");	
		
	} //
	

} // FlexiModal
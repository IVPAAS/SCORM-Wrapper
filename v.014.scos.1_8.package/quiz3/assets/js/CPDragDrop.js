(function(){

	var DD = {};

	/*
	Snap behaviour position Enum
	*/
	DD.SnapBehaviourPos={};
	DD.SnapBehaviourPos.kCPSBPNone = 0;
	DD.SnapBehaviourPos.kCPSBPAbsolute = 1;
	DD.SnapBehaviourPos.kCPSBPAnchorTopLeft = 2;
	DD.SnapBehaviourPos.kCPSBPAnchorTopCenter = 3;
	DD.SnapBehaviourPos.kCPSBPAnchorTopRight = 4;
	DD.SnapBehaviourPos.kCPSBPAnchorCenterLeft = 5;
	DD.SnapBehaviourPos.kCPSBPAnchorCenterCenter = 6;
	DD.SnapBehaviourPos.kCPSBPAnchorCenterRight = 7;
	DD.SnapBehaviourPos.kCPSBPAnchorBottomLeft = 8;
	DD.SnapBehaviourPos.kCPSBPAnchorBottomCenter = 9;
	DD.SnapBehaviourPos.kCPSBPAnchorBottomRight = 10;
	DD.SnapBehaviourPos.kCPSBPStackHorizonatally = 11;
	DD.SnapBehaviourPos.kCPSBPStackVertically = 12;
	DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingTop = 13;
	DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingBottom = 14;
	DD.SnapBehaviourPos.kCPSBPTileBottomTopStartingLeft = 15;
	DD.SnapBehaviourPos.kCPSBPTileTopBottomStartingLeft = 16;


	/*
	Common Utility functions
	*/
	DD.getAttribute = function(elId, name)
	{
		var x = cp.model.data[elId];
		if (!x)
			return null;
		return x[name];
	};

	DDch = function( div )
	{
		var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
		if( ddInt === null )
			return;

		if(ddInt.m_questionObj)
		{
			if(ddInt.m_questionObj.isDisabled)
				return;
		}
		else
		{
			if(ddInt.m_InteractionCompleted)
				return;
		}
		if(ddInt.m_maxAttempts > 0 && ddInt.m_CurrentAttempt >= ddInt.m_maxAttempts)
			return;
		var divdata = cp.model.data[div.id];
		if(divdata.type === cp.kCPOTDDSubmitButton )
			ddInt.OnSubmitButtonClicked();
		else if( divdata.type === cp.kCPOTUndoButton )
			ddInt.OnUndoButtonClicked();
		else if( divdata.type === cp.kCPOTResetButton )
			ddInt.OnResetButtonClicked();
		
	};

	DD.AnimationState = function( x, y, w, h, opac)
	{
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.opac = opac;		
	}

	DD.GetRectFromBounds = function( left, top, width, height)
	{
		var retVal = {};
		retVal.left = left;
		retVal.right = left + width;
		retVal.top = top;
		retVal.bottom = top + height;
		return retVal;
	};

	DD.doRectangleIntersect = function  (r1, r2)
	{
		if(r2.left > r1.right ||
			r2.right < r1.left ||
			r2.top > r1.bottom ||
			r2.bottom < r1.top)
			return false;
		else
			return true;
	};

	DD.getMidPoint = function (x, y, width, height, angle_degrees)
	{
		var angle_rad = angle_degrees * 3.1415 / 180;
		var cosa = Math.cos(angle_rad);
		var sina = Math.sin(angle_rad);
		var wp = width/2;
		var hp = height/2;
		return { x: ( x + wp * cosa - hp * sina ),
			y: ( y + wp * sina + hp * cosa ) };
	};

	DD.getEndPointsAfterRotation = function (left,top,width,height,angle_degrees){
		var center = DD.getMidPoint(left,top,width,height,angle_degrees);

		var endPoints =[];
		var left_top = {x:left,y:top};
		var right_top = {x:left+width,y:top};
		var right_bottom = {x:left+width,y:top+height};
		var left_bottom = {x:left,y:top+height};

		left_top = DD.Rotate(left_top.x,left_top.y,center.x,center.y,angle_degrees);
		right_top = DD.Rotate(right_top.x,right_top.y,center.x,center.y,angle_degrees);
		right_bottom = DD.Rotate(right_bottom.x,right_bottom.y,center.x,center.y,angle_degrees);
		left_bottom = DD.Rotate(left_bottom.x,left_bottom.y,center.x,center.y,angle_degrees);

		endPoints = [left_top,right_top,right_bottom,right_top];

		return endPoints;
	};

	DD.getEndPointsAfterRotation2 = function (left,top,width,height,angle_degrees){
		var center = { x:left + width/2, y:top + height/2 };

		var endPoints =[];
		var left_top = {x:left,y:top};
		var right_top = {x:left+width,y:top};
		var right_bottom = {x:left+width,y:top+height};
		var left_bottom = {x:left,y:top+height};

		left_top = DD.Rotate(left_top.x,left_top.y,center.x,center.y,angle_degrees);
		right_top = DD.Rotate(right_top.x,right_top.y,center.x,center.y,angle_degrees);
		right_bottom = DD.Rotate(right_bottom.x,right_bottom.y,center.x,center.y,angle_degrees);
		left_bottom = DD.Rotate(left_bottom.x,left_bottom.y,center.x,center.y,angle_degrees);

		endPoints = [left_top,right_top,right_bottom,left_bottom];

		return endPoints;
	};

	DD.GetDimensionsAfterRotation = function(left,top,width,height,angle_degrees)
	{
		if( left === null || left === undefined ||
			top === null || top === undefined ||
			width === null || width === undefined ||
			height === null || height === undefined ||
			angle_degrees === null || angle_degrees === undefined )
			return null;
		var endPointsAfterRotation = DD.getEndPointsAfterRotation2(left,top,width,height,angle_degrees);
		var boundingRect = DD.GetBoundingRectForTransformedPoints(endPointsAfterRotation);
		return boundingRect;
	}


	DD.GetBoundingRectForTransformedPoints = function( inEndPointsArray )
	{
		if(4 != inEndPointsArray.length)
			return null;

		var point1 = inEndPointsArray[0];
		var minX = point1.x;
		var minY = point1.y;
		var maxX = point1.x;
		var maxY = point1.y;

		for(var index = 1 ; index < inEndPointsArray.length; index++)
		{
			var currPoint = inEndPointsArray[index];

			if(minX > currPoint.x)
			{
				minX = currPoint.x;
			}
			if(minY > currPoint.y)
			{
				minY = currPoint.y;
			}
			if(maxX < currPoint.x)
			{
				maxX = currPoint.x;
			}
			if(maxY < currPoint.y)
			{
				maxY = currPoint.y;
			}
		}

		return { minX:minX, minY:minY, maxX:maxX, maxY:maxY };
	}

	DD.Rotate = function (pointX, pointY, centerX, centerY, angle) {
		// convert angle to radians
		angle = angle * Math.PI / 180.0;
		var dx = pointX - centerX;
		var dy = pointY - centerY;
		var a = Math.atan2(dy, dx);
		var dist = Math.sqrt(dx * dx + dy * dy);
		// calculate new angle
		var a2 = a + angle;
		// calculate new coordinates
		var dx2 = Math.cos(a2) * dist;
		var dy2 = Math.sin(a2) * dist;
		// return coordinates relative to top left corner
		return { x: dx2 + centerX, y: dy2 + centerY };
	};

	DD.getRotationAngle = function (element){
		var tr = element.style.getPropertyValue("-webkit-transform");
		if(tr === null)
			return 0;
		var val = getAngleFromRotateStr(tr);
		if(isNaN(val))
			return 0;
	//	cp.log('Matrix: ' + val);
		return val;
	};

	DD.ChangeMouseCursor = function ( cursorType)
	{
		var parentSlideDivElement = cp.movie.stage.getSlideDiv();
		parentSlideDivElement.style.cursor = cursorType;
	};


	DD.DefaultDocumentTouchStart = function(event)
	{
	};

	DD.DefaultDocumentTouchMove = function(event)
	{
		var doc = document.documentElement, body = document.body;
		var mainContainer = document.getElementById("cpDocument");
		var contentWidth = cp.model.data['project'].w;
		var contentHeight = cp.model.data['project'].h;
		var isScaledContent = cp.model.data['project'].shc;
		//window.alert("contentWidth = " + contentWidth + " contentHeight = " + contentHeight + " doc.clientWidth = " + doc.clientWidth + "doc.clientHeight = " + doc.clientHeight + " isScaledContent = " + isScaledContent);
		if( contentWidth <= doc.clientWidth && contentHeight <= doc.clientHeight )
			event.preventDefault();
		if( contentWidth <= doc.clientHeight && contentHeight <= doc.clientWidth )
			event.preventDefault();
		if( isScaledContent )
			event.preventDefault();
	};

	DD.DefaultDocumentTouchEnd = function(event)
	{
	};

	DD.CustomDivStruct = function()
	{
		this.posleft = null;
		this.postop = null;
		this.Width = null;
		this.Height = null;
	};

	DD.CustomCanvasStruct = function()
	{
		this.posleft = null;
		this.postop = null;
		this.Width = null;
		this.Height = null;
		this.MarginLeft = null;
		this.MarginTop = null;
	};

	DD.DragSourcePropertiesObject = function(objectID)
	{
		this.objectID = objectID;
		this.fset = document.getElementById(objectID);
		this.div = document.getElementById("re-"+objectID+"c");
		this.canvas = document.getElementById(objectID+"c");

		this.DropTargetId = null;
		this.Opacity = null;
		this.Index  = null;

		this.posleft = null;
		this.postop = null;
		this.Width = null;
		this.Height = null;

		this.divStruct = null;
		this.canvasStruct = null;
	};
	DD.UpdateDragSourceStatePropertiesObject = function(object, index, posLeft, posTop, inWidth, inHeight, inOpacity , div, canvas)
	{
		if(object)
		{
			if(index!==null)
			{
				object.Index = index;
			}

			if( posLeft !== null )
			{
				object.posleft = posLeft;
			}
			if( posTop !== null )
			{
				object.postop = posTop;
			}
			if( inWidth !== null )
			{
				object.Width = inWidth;
			}
			if( inHeight !== null )
			{
				object.Height = inHeight;
			}
			if( inOpacity !== null )
			{
				object.Opacity = inOpacity;
			}
			if(div !== null)
			{
				object.divStruct = div;
			}
			if(canvas !== null)
			{
				object.canvasStruct = canvas;
			}
		}
	};
	DD.ClearDragSourcePropertiesList = function(dragSourceList)
	{
		if(dragSourceList)
		{
			for(i=0;i<dragSourceList.length;++i)
			{
				DD.UpdateDragSourceStatePropertiesObject(dragSourceList[i], null, null, null, null, null, null,null,null);
			}
		}
	};
	DD.DragSourceLMSPropertiesObject = function(objectID)
	{
		this.objectID = objectID;
		this.posleft = null;
		this.postop = null;
		this.previousDTID = null;
		this.currentDTID = null;
	};
	DD.DropTargetLMSPropertiesObject = function(objectID)
	{
		this.objectID = objectID;
		this.dsWidth = null;
		this.dsHeight = null;
		this.acceptedDragSources = [];
		this.acceptedSourceObjects = [];
	};

	DD.UpdateDivStructure = function(dragSourceList)
	{
		var i;
		var divList = [];
		var parent = document.getElementById('div_Slide');
		var divsOnSlide = parent.getElementsByClassName('cp-frameset');
		var dragSourceObject = null;
		var localCopyDragSourceList = [];
		//remove all the drag source divs and framesets.
		for(i=0;i<dragSourceList.length;++i)
		{
			dragSourceObject = dragSourceList[i];
			localCopyDragSourceList.push(dragSourceObject);

			//Updating dragSourceObject
			dragSourceObject.fset = document.getElementById(dragSourceObject.objectID);
			dragSourceObject.div = document.getElementById('re-'+dragSourceObject.objectID+'c');
			dragSourceObject.canvas = document.getElementById(dragSourceObject.objectID+'c');

			parent.removeChild(dragSourceObject.fset);
			divsOnSlide[0].removeChild(dragSourceObject.div);
		}
		//sort the drag source list by the index.
		localCopyDragSourceList.sort(DD.DragSourceSortFunction);
		//insert the divs and framesets in the order of the index.
		var canvasDivs = divsOnSlide[0].getElementsByClassName('cp-rewrap');
		for(i=0;i<localCopyDragSourceList.length;++i)
		{
			dragSourceObject = localCopyDragSourceList[i];
			var index = dragSourceObject.Index;
			if(index === null)
				continue;
			if(dragSourceObject.posleft !== null)
				dragSourceObject.fset.style.left = parseFloat(dragSourceObject.posleft) + "px";
			if(dragSourceObject.postop !== null)
				dragSourceObject.fset.style.top = parseFloat(dragSourceObject.postop) + "px";

			if(cp.MSIE == cp.browser)
			{
				parent.insertBefore(DD.UpdateDivProperties(dragSourceObject.fset,dragSourceObject,null),divsOnSlide[index+1]);
			}
			else
			{
				parent.insertBefore(DD.UpdateDivProperties(dragSourceObject.fset,dragSourceObject,dragSourceObject.Opacity),divsOnSlide[index+1]);
			}
			divsOnSlide[0].insertBefore(DD.UpdateDivProperties(dragSourceObject.div,dragSourceObject.divStruct,dragSourceObject.Opacity),canvasDivs[index]);
			var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
			if( ddInt !== null )
			{
				var dsCanvas = document.getElementById(cp.model.data[dragSourceObject.fset.id].mdi);
				dsCanvas.style.visibility = 'hidden';
				var dummyCanvas = DD.CreateDummyCanvas(dsCanvas);
				if(dummyCanvas!== null && dragSourceObject.divStruct !== null)
				{
					dummyCanvas.element.style.visibility = 'visible';
					DD.AnimateObjectGliding(dsCanvas,dummyCanvas,parseFloat(dragSourceObject.div.style.left),parseFloat(dragSourceObject.div.style.top),
					parseFloat(dragSourceObject.divStruct.posleft),parseFloat(dragSourceObject.divStruct.postop),20);
				}
			}
			dragSourceObject.canvas.style.opacity = dragSourceObject.Opacity;
			var divStruct = dragSourceObject.divStruct;
			if(divStruct !== null)
			{
				if(divStruct.posleft !== null)
					dragSourceObject.div.style.left = parseFloat(divStruct.posleft) + "px";
				if(divStruct.postop !== null)
					dragSourceObject.div.style.top = parseFloat(divStruct.postop) + "px";
				if(divStruct.Width !== null)
					dragSourceObject.div.style.width = parseFloat(divStruct.Width) + "px";
				if(divStruct.Height !== null)
					dragSourceObject.div.style.height = parseFloat(divStruct.Height) + "px";
			}
			var canvasStruct = dragSourceObject.canvasStruct;
			if(canvasStruct !== null)
			{
				if(canvasStruct.posleft !== null)
					dragSourceObject.canvas.style.left = parseFloat(canvasStruct.posleft) + "px";
				if(canvasStruct.postop !== null)
					dragSourceObject.canvas.style.top = parseFloat(canvasStruct.postop) + "px";
				if(canvasStruct.Width !== null)
					dragSourceObject.canvas.style.width = parseFloat(canvasStruct.Width) + "px";
				if(canvasStruct.Height !== null)
					dragSourceObject.canvas.style.height = parseFloat(canvasStruct.Height) + "px";
				if(canvasStruct.MarginLeft !== null)
					dragSourceObject.canvas.style.marginLeft = parseFloat(canvasStruct.MarginLeft) + "px";
				if(canvasStruct.MarginTop !== null)
					dragSourceObject.canvas.style.marginTop = parseFloat(canvasStruct.MarginTop) + "px";
			}
		}
	};
	DD.AnimateObjectGliding = function (element,dummy,initialposleft,initialpostop,finalposleft,finalpostop,time)
	{
		var topindent = (finalpostop - initialpostop) / time;
		var leftindent = (finalposleft - initialposleft) / time;
		function timeoutFunc()
		{
						if(time === 0)
						{
							var parentEl = document.getElementById('div_Slide');
							parentEl.removeChild(dummy.element);
							element.style.visibility = 'visible';
							return;
						}
						dummy.element.style.left = parseFloat(dummy.element.style.left) + leftindent + 'px';
						dummy.element.style.top = parseFloat(dummy.element.style.top) + topindent + 'px';
						time = time -1;
						cp.log("time: " + time.toString());
						setTimeout(timeoutFunc,20);
					
		}
		setTimeout(timeoutFunc,20);
	};

	DD.CreateDummyCanvas = function(sourceCanvas, insertBeforeElement)
	{
		var width = 0,height = 0;
		if( sourceCanvas.style && parseFloat(sourceCanvas.style.width) )
			width = parseFloat(sourceCanvas.style.width);
		else
			width = sourceCanvas.width;
		if( sourceCanvas.style && parseFloat(sourceCanvas.style.height) )
			height = parseFloat(sourceCanvas.style.height);
		else
			height = sourceCanvas.height;

			var dummyCanvas = cp.createCanvas(0, 0, width , height,document.createElement('canvas'));
			dummyCanvas.element.style.display = "block";
			dummyCanvas.element.style.position = "absolute";
			dummyCanvas.element.style.visibility = "hidden";
			dummyCanvas.element.style.marginLeft = 0 + "px";
			dummyCanvas.element.style.marginTop = 0 + "px";
			if( sourceCanvas.style.opacity !== "")
				dummyCanvas.element.style.opacity = sourceCanvas.style.opacity;

			gc = dummyCanvas.gc;
			if(sourceCanvas.className === "cp-animationItem")
			{
				var img = new Image();
				var modelData = cp.model.data[sourceCanvas.id];
				img.src = modelData.ip;
				gc.drawImage(img,0,0,width,height);
			}
			else
			gc.drawImage(sourceCanvas,0,0,width,height);
			if(insertBeforeElement === undefined )
				document.getElementById('div_Slide').appendChild(dummyCanvas.element);
			else
			{
				if(insertBeforeElement.parentNode && insertBeforeElement.parentNode.id === "div_Slide")
				{
					document.getElementById('div_Slide').insertBefore(dummyCanvas.element, insertBeforeElement);
				}
				else
				{
					document.getElementById('div_Slide').appendChild(dummyCanvas.element);
				}
			}

			parentEl = sourceCanvas.parentElement;
			dummyCanvas.element.style.left = parseFloat(parentEl.style.left) + parseFloat(sourceCanvas.style.marginLeft) + "px" ;
			dummyCanvas.element.style.top = parseFloat(parentEl.style.top) + parseFloat(sourceCanvas.style.marginTop) + "px";

			return dummyCanvas;
	};

	DD.UpdateDivProperties = function(div,customStruct,opacity)
	{
		if(div)
		{
			if( customStruct.Width !== null )
			{
				div.style.width = parseFloat(customStruct.Width) + "px";
			}
			if( customStruct.Height !== null )
			{
				div.style.height = parseFloat(customStruct.Height) + "px";
			}
			if( opacity !== null )
			{
				div.style.opacity = opacity;
			}
		}
		return div;
	};

	DD.SortDragSourceList = function(dragSourceList)
	{

	};

	DD.CurrInteractionManager = null;

	cp.CreateInteractionManager = function (elId) {
        var im;
        im = new DD.InteractionManager(elId);
        return im;
    };

    cp.SetCurrentInteractionManager = function (iDDInteractionManager) {
		DD.CurrInteractionManager = iDDInteractionManager;
    };

	/*
	class for Interaction Manager
	@constructor
	*/

	DD.InteractionManager = function(intrArr)
	{
		this.m_ActiveInteraction = null;
		this.m_InteractionList = intrArr;
		if(this.m_InteractionList !== null && this.m_InteractionList.length > 0 )
		{
			this.m_ActiveInteraction = new DD.Interaction(this.m_InteractionList[0].n);
			this.m_ActiveInteractionIndex = 0;
		}
	};
	DD.InteractionManager.prototype.changeActiveInteraction = function()
	{
		var ddInt = this.m_ActiveInteraction;
		if( ddInt === null )
			return;
		//set the mouse handlers of current drag sources to null
		if(ddInt.m_dsList.length > 0)
		{
			for( var i=0; i<ddInt.m_dsList.length; ++i)
			{
				dsDiv = document.getElementById(ddInt.m_dsList[i].n);
				//dsDiv.setAttribute( 'draggable', "false");
				if(cp.device == cp.IDEVICE)
				{
					dsDiv.ontouchstart = null;
					dsDiv.ontouchmove = null;
					dsDiv.ontouchend = null;
				}
				else
				{
					dsDiv.onmousedown = null;
					dsDiv.onmouseover = null;
					dsDiv.onmouseout = null;
				}
			}
		}
		ddInt.clearAnswerList();
		//load the next interaction
		this.m_ActiveInteractionIndex +=1;
		if(this.m_InteractionList !== null && this.m_InteractionList.length > this.m_ActiveInteractionIndex )
		{
			this.m_ActiveInteraction = new DD.Interaction(this.m_InteractionList[this.m_ActiveInteractionIndex].n);
		}
	};

	DD.InteractionManager.prototype.PauseAtFrame = function()
	{
		if(this.m_ActiveInteraction)
			return this.m_ActiveInteraction.m_PauseAt;
		else
			return -1;
	};
	
	DD.InteractionManager.prototype.CheckInteractionPause = function( frame )
	{
		var ddInt = this.m_ActiveInteraction;
		if(ddInt.m_questionObj)
		{
			if(ddInt.m_questionObj.isDisabled === true)
				return false;
		}
		else
		{
			if(ddInt.m_InteractionCompleted)
			 return false;
		}
		if(ddInt.m_maxAttempts > 0 && (ddInt.m_CurrentAttempt >= ddInt.m_maxAttempts))
			return false;
		if( ddInt.m_PauseAt === frame )
			return true;
		return false;
	};

	DD.InteractionManager.prototype.registerDisplayObject = function( canvasID )
	{
		if(this.m_ActiveInteraction !== null)
		{
			var ddInt = this.m_ActiveInteraction;
			var framesetId = canvasID.substr(0,canvasID.length - 1);
			var divId = "re-" + canvasID;

			var modelData = cp.model.data[framesetId];
			if(modelData.isDD === true)
			{
				ddInt.m_buttonIDList.push(divId);
				if((ddInt.m_questionObj && ddInt.m_questionObj.isDisabled) || (ddInt.m_maxAttempts > 0 && (ddInt.m_CurrentAttempt >= ddInt.m_maxAttempts)))
				{
					var buttonDiv = document.getElementById(divId);
					buttonDiv.style.visibility = "hidden";
				}
			}
			var isPartOfInteraction = false;
			var dsID,dtID,dsDiv,dtDiv;
			for( var i=0; i<ddInt.m_dsList.length && !isPartOfInteraction; ++i)
			{
				dsID = ddInt.m_dsList[i].n;
				dsDiv = document.getElementById(dsID);
				if(dsID === framesetId)
				{
					isPartOfInteraction = true;
					break;
				}
			}
			for(i=0; i<ddInt.m_dtList.length && !isPartOfInteraction; ++i)
			{
				dtID = ddInt.m_dtList[i].n;
				dsDiv = document.getElementById(dtID);
				if(dtID === framesetId)
				{
					isPartOfInteraction = true;
					break;
				}
			}
			if(!isPartOfInteraction)
				return;

			if(ddInt.m_resumeItemsMap[framesetId] === 1)
			{
				ddInt.m_resumeItemsMap[framesetId] = 0;
				ddInt.m_resumeItemsToBeDrawn = ddInt.m_resumeItemsToBeDrawn - 1;
			}

			for( var k=0; k<ddInt.m_dtList.length; ++k)
			{
				dtID = ddInt.m_dtList[k].n;

				dtObj = ddInt.GetDTObjFromDTID(dtID);
				dtDiv = document.getElementById(dtID);
				if( dtObj !== null && dtDiv !== null )
				{

					var depList = dtObj.dep;
					if( !(depList === undefined || depList === null || depList.length <= 0) && cp.device != cp.IDEVICE)
					{
						dtDiv.setAttribute('onmouseover','cp.showHint("' + dtObj.dep[0] + '",this)');
						dtDiv.setAttribute('onmouseout','cp.hideHint("' + dtObj.dep[0] + '",this)');
					}
				}
			}

			var currInteraction = this.m_ActiveInteraction;
			var dragSourceIndex = currInteraction.DSMap[framesetId];
			var dragSourceFrameset = document.getElementById(framesetId);
			var dragSourceCanvas = document.getElementById(canvasID);
			var dragSourceDiv = document.getElementById(divId);
			if(dragSourceIndex === null || dragSourceIndex === undefined)
			{
				return;
			}

			var dsFramesetCurrentStatePropsObject = currInteraction.DragSourceCurrentStateList[dragSourceIndex];
			var dsFramesetInitialStatePropsObject = currInteraction.DragSourceInitialStateList[dragSourceIndex];

			var divStruct = new DD.CustomDivStruct();
			divStruct.posleft = dragSourceDiv.style.left;
			divStruct.postop = dragSourceDiv.style.top;
			divStruct.Width = dragSourceDiv.style.width;
			divStruct.Height = dragSourceDiv.style.height;

			var canvasStruct = new DD.CustomCanvasStruct();
			canvasStruct.posleft = dragSourceCanvas.style.left;
			canvasStruct.postop = dragSourceCanvas.style.top;
			canvasStruct.Width = dragSourceCanvas.style.width;
			canvasStruct.Height = dragSourceCanvas.style.height;
			canvasStruct.MarginLeft = dragSourceCanvas.style.marginLeft;
			canvasStruct.MarginTop = dragSourceCanvas.style.marginTop;


			if(dsFramesetCurrentStatePropsObject!==undefined && dsFramesetInitialStatePropsObject !== undefined)
			{
			//	var modelData = cp.model.data[this.m_dsList[i].n;
			if(ddInt.registeredMap[framesetId] === 0)
			{
				dsFramesetInitialStatePropsObject.posleft = dragSourceFrameset.style.left;
				dsFramesetInitialStatePropsObject.postop = dragSourceFrameset.style.top;
				dsFramesetInitialStatePropsObject.Width = dragSourceFrameset.style.width;
				dsFramesetInitialStatePropsObject.Height = dragSourceFrameset.style.height;
				dsFramesetInitialStatePropsObject.divStruct = divStruct;
				dsFramesetInitialStatePropsObject.canvasStruct = canvasStruct;
				dsFramesetInitialStatePropsObject.DropTargetId = null;
				ddInt.registeredMap[framesetId] = 1;
			}
				dsFramesetCurrentStatePropsObject.posleft = dragSourceFrameset.style.left;
				dsFramesetCurrentStatePropsObject.postop = dragSourceFrameset.style.top;
				dsFramesetCurrentStatePropsObject.Width = dragSourceFrameset.style.width;
				dsFramesetCurrentStatePropsObject.Height = dragSourceFrameset.style.height;
				dsFramesetCurrentStatePropsObject.divStruct = divStruct;
				dsFramesetCurrentStatePropsObject.canvasStruct = canvasStruct;
				dsFramesetCurrentStatePropsObject.DropTargetId = null;
			}


			//LMS
			ddInt.DSLMSMap[framesetId] = new DD.DragSourceLMSPropertiesObject(framesetId);

			if(ddInt.m_questionObj)
			{
				if(ddInt.m_questionObj.isDisabled)
					return;
			}
			for(i=0; i<ddInt.m_dsList.length; ++i)
			{
				dsID = ddInt.m_dsList[i].n;
				dsDiv = document.getElementById(dsID);
				if(dsID === framesetId)
				{
					if(cp.device == cp.IDEVICE)
					{
						dsDiv.ontouchstart = ddInt.ItemOnMouseDown;
					}
					else
					{
						dsDiv.onmousedown = ddInt.ItemOnMouseDown;
					}	
					if( DD.getAttribute(ddInt.m_elId, 'hc') === true )
					{
						dsDiv.onmouseover = ddInt.ItemOnMouseOver;
						dsDiv.onmouseout = ddInt.ItemOnMouseOut;
					}
					break;
				}
			}
		}
	};

	DD.DragSourceSortFunction = function (a,b)
	{
		if(a.Index > b.Index)
			return 1;
		else if( a.Index < b.Index )
			return -1;
		return 0;
	};

	DD.DropTargetSortFunction = function( a,b)
	{
		if(a.t > b.t)
			return 1;
		else if( a.t < b.t )
			return -1;
		return 0;
	};

	/*
	class for Drag Drop Interaction
	@constructor
	*/

	DD.Interaction = function(elId)
	{
		this.m_elId = elId;
		this.m_dsList = DD.getAttribute(this.m_elId, 'ds');
		this.m_dtList = DD.getAttribute(this.m_elId, 'dt');
		this.m_dtList.sort(DD.DropTargetSortFunction);
		this.m_dsCanvasList = [];

		this.m_buttonIDList = [];

		this.DSMap = {};
		this.DTMap = {};

		//LMS
		this.DSLMSMap = {};
		this.DTLMSList = [];

		this.DragSourceCurrentStateList = [];
		this.DragSourcePreviousStateList = [];
		this.DragSourceInitialStateList = [];

		this.registeredMap = {};

		if(this.m_dsList.length > 0)
		{
			for( var i=0; i<this.m_dsList.length; ++i)
			{
				var dsID = this.m_dsList[i].n;
				dsDiv = document.getElementById(dsID);
				var dsCurrentStatePropsObject = new DD.DragSourcePropertiesObject(dsID);
				var dsPreviousStatePropsObject = new DD.DragSourcePropertiesObject(dsID);
				var dsFramesetInitialStatePropsObject = new DD.DragSourcePropertiesObject(dsID);
				this.DragSourceCurrentStateList.push(dsCurrentStatePropsObject);
				this.DragSourcePreviousStateList.push(dsPreviousStatePropsObject);
				this.DragSourceInitialStateList.push(dsFramesetInitialStatePropsObject);
				this.DSMap[dsID] = this.DragSourceCurrentStateList.length-1;
				this.registeredMap[dsID] = 0;
			}
		}

		var frameSetsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');
		var prevNonDs = null; var prevNonDsDepth = -1;
		for(var j=1;j<frameSetsOnSlide.length;++j)
		{
			var framesetId = frameSetsOnSlide[j].id;
			if(this.DSMap[framesetId] !== undefined && this.DSMap[framesetId] !== null)
			{
				var dragSourceCurrentStateObject = this.DragSourceCurrentStateList[this.DSMap[framesetId]];
				dragSourceCurrentStateObject.Index = j-1;
				var dragSourceInitialStateObject = this.DragSourceInitialStateList[this.DSMap[framesetId]];
				dragSourceInitialStateObject.Index = j-1;
				dragSourceInitialStateObject.prevNonDs = prevNonDs;
				dragSourceInitialStateObject.relDepth = j-1 - prevNonDsDepth;
			}
			else
			{
				prevNonDs = framesetId;
				prevNonDsDepth = j-1;
			}
		}

		this.m_DTtoSnapBehaviourAudioMap = {};
		if(this.m_dtList.length > 0)
		{
			for( var k=0; k<this.m_dtList.length; ++k)
			{
				dtID = this.m_dtList[k].n;

				this.DTMap[dtID] = new DD.DropTargetLMSPropertiesObject(dtID);

				dtObj = this.GetDTObjFromDTID(dtID);
				dsDiv = document.getElementById(dtID);
				if( dtObj !== null && dsDiv !== null )
				{

					var depList = dtObj.dep;
					if( dtObj.sba )
					{
						this.m_DTtoSnapBehaviourAudioMap[dtID] = dtObj.sba;
					}
				}
			}
		}
		this.m_autoSubmit = DD.getAttribute(this.m_elId,'as');
		var submitBtnName = DD.getAttribute(this.m_elId, 'sb');
		if( submitBtnName !== undefined && submitBtnName !== null && submitBtnName.length > 0 )
			cp.show( submitBtnName );
		var showUndo = DD.getAttribute(this.m_elId,'sub');
		var undoBtnName = DD.getAttribute(this.m_elId, 'ub');
		if( showUndo && undoBtnName !== undefined && undoBtnName !== null && undoBtnName.length > 0 )
			cp.show( undoBtnName );
		var showReset = DD.getAttribute(this.m_elId,'srb');
		var resetBtnName = DD.getAttribute(this.m_elId, 'rb');
		if( showReset && resetBtnName !== undefined && resetBtnName !== null && resetBtnName.length > 0 )
			cp.show( resetBtnName );
		this.m_PauseAt = DD.getAttribute(this.m_elId, 'pa');
		this.m_successAction = DD.getAttribute(this.m_elId, 'oca');
		this.m_failureAction = DD.getAttribute(this.m_elId, 'ofa');
		this.m_maxAttempts = DD.getAttribute(this.m_elId, 'ma');
		this.m_CurrentAttempt = 0;
		this.m_dragSourceCanvas = null;
		this.m_dummyCanvas = null;
		this.m_DummyCanvasWithoutEffect = null;
		this.m_dummyCanvasOffset = {x:0,y:0};
		this.m_DsFrameSetDataID = null;
		this.m_previousmouseleft = 0;
		this.m_previousmousetop = 0;
		this.m_InitialMouseLeft = 0;
		this.m_InitialMouseTop = 0;
		this.m_isItemBeingDragged = false;
		this.m_attemptedAnswerString = [];
		this.m_correctAnswerList = DD.getAttribute(this.m_elId, 'cal');
		this.m_tempFrameSetPos = {x:0,y:0,w:0,h:0};
		this.m_DragSourceInitialFsPos = {x:0,y:0,w:0,h:0};
		this.m_SendDragSourceBack = DD.getAttribute(this.m_elId, 'sdc2op');
		this.m_ReturnDragSourceAudio = DD.getAttribute(this.m_elId, 'plaud');
		//this.shouldRedragSource = DD.getAttribute(this.m_elId,'reds')
		this.m_ReplacedDragSourceCanvas = null;
		this.m_ReplacedDragSourceDummyCanvas = null;
		this.m_DTFsIdToDTEffectCanvasMap = {};

		this.m_shouldIncludeInQuiz = DD.getAttribute(this.m_elId, 'siq');

        this.undoAvailable = false;
        this.resetAvailable = false;
        this.m_StoredSuspendDataString = "";

        this.m_resumeItemsToBeDrawn = 0;
        this.m_resumeItemsMap = {};

        this.m_InteractionCompleted = false;

        var that = this;
        var lSlideEnterEventHandler = function(e)
        							{
        								that.Init();
        							};
		cp.em.addEventListener(lSlideEnterEventHandler,cp.SLIDEENTEREVENT);
		
		
		//this code should be in the end of the constructor
		if (this.m_shouldIncludeInQuiz) {
            this.m_questionObj = getQuestionObject(this.m_elId);
            if (this.m_questionObj instanceof cp.DragDropQuestion)
                this.m_questionObj.setDDInteraction(this);
			else
				this.m_questionObj = undefined;
        }

        if(cp.device == cp.IDEVICE)
		{
			document.ontouchmove = DD.DefaultDocumentTouchMove;
			document.ontouchend = DD.DefaultDocumentTouchEnd;
			document.ontouchstart = DD.DefaultDocumentTouchStart;
		}
	};

	DD.Interaction.prototype.Init = function()
	{
		this.m_buttonIDList = [];
		this.m_dragSourceCanvas = null;
		this.m_dummyCanvas = null;
		this.m_DummyCanvasWithoutEffect = null;
		this.m_InteractionCompleted = false;
		this.m_dummyCanvasOffset = {x:0,y:0};
		this.m_DsFrameSetDataID = null;
		this.m_previousmouseleft = 0;
		this.m_previousmousetop = 0;
		this.m_InitialMouseLeft = 0;
		this.m_InitialMouseTop = 0;
		this.m_isItemBeingDragged = false;
		
		if (!this.m_shouldIncludeInQuiz)
		{
			this.m_attemptedAnswerString = [];
			this.m_CurrentAttempt = 0;
			for( var k = 0; k < this.m_dtList.length; ++k)
			{
				var dtObj = this.DTMap[this.m_dtList[k].n];
				if(dtObj)
				{
					dtObj.acceptedDragSources.length = 0;
				}
			}
		}
		this.m_tempFrameSetPos = {x:0,y:0,w:0,h:0};
		this.m_DragSourceInitialFsPos = {x:0,y:0,w:0,h:0};
		//this.shouldRedragSource = DD.getAttribute(this.m_elId,'reds')
		this.m_ReplacedDragSourceCanvas = null;
		this.m_ReplacedDragSourceDummyCanvas = null;
		this.m_DTFsIdToDTEffectCanvasMap = {};
		this.undoAvailable = false;
		this.resetAvailable = false;
	};

	DD.Interaction.prototype.ItemOnMouseDown = function( event )
	{
		var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
		if( ddInt === null )
			return;
		if( ddInt.m_dummyCanvas )
			return;

		var dsFrameset = event.target;

		ddInt.m_DsFrameSetDataID = dsFrameset.id;
		var lFrameSetData = cp.model.data[ddInt.m_DsFrameSetDataID];

		ddInt.m_dragSourceCanvas = document.getElementById(lFrameSetData.mdi);

		if(cp.device == cp.IDEVICE)
		{
			dsFrameset.ontouchmove = null;
		}
		else
		{
			dsFrameset.onmousemove = null;
		}

		if(lFrameSetData.type === cp.kCPOTAutoShape)
		{
			var lCanvasData = cp.model.data[lFrameSetData.mdi];
			if(lCanvasData.ss !== undefined && lCanvasData.ss === 0 )
			{
				var lBool = ddInt.isPointInPath(getPageX(event),getPageY(event));
				if(!lBool)
				{
					cp.log("mouse down isinpath = "+lBool);
					return;
				}
			}
		}

		var scaledPos = getScaledPosition(getPageX(event), getPageY(event));
		if(!ddInt.m_isItemBeingDragged)
		{
			ddInt.m_InitialMouseLeft = scaledPos.X;
			ddInt.m_InitialMouseTop = scaledPos.Y;
		}

		ddInt.m_tempFrameSetPos.x = parseFloat(dsFrameset.style.left);
		ddInt.m_tempFrameSetPos.y = parseFloat(dsFrameset.style.top);
		ddInt.m_tempFrameSetPos.w = parseFloat(dsFrameset.style.width);
		ddInt.m_tempFrameSetPos.h = parseFloat(dsFrameset.style.height);
		ddInt.m_DragSourceInitialFsPos.x = parseFloat(dsFrameset.style.left);
		ddInt.m_DragSourceInitialFsPos.y = parseFloat(dsFrameset.style.top);
		ddInt.m_DragSourceInitialFsPos.w = parseFloat(dsFrameset.style.width);
		ddInt.m_DragSourceInitialFsPos.h = parseFloat(dsFrameset.style.height);

		ddInt.CreateDragSourceDummyCanvasAndShowEffects();

		if(cp.device == cp.IDEVICE)
		{
			document.ontouchmove = DD.CurrInteractionManager.m_ActiveInteraction.ItemOnMouseMove;
			document.ontouchend = DD.CurrInteractionManager.m_ActiveInteraction.ItemOnMouseUp;
		}
		else
		{
			document.onmousemove = DD.CurrInteractionManager.m_ActiveInteraction.ItemOnMouseMove;
			document.onmouseup = DD.CurrInteractionManager.m_ActiveInteraction.ItemOnMouseUp;
		}
		document.onselectstart = function(){ return false; };

	};
	DD.Interaction.prototype.isPointInPath = function(X,Y)
	{
		var canvasId = this.m_DsFrameSetDataID + "c";
		var lcanvas = document.getElementById(canvasId);
		var lgc = lcanvas.getContext('2d');
		if(lgc && lcanvas)
		{
			var lScaledPosition = getScaledPosition(X,Y);
			var lParentOffsetL = lcanvas.parentElement.offsetLeft;
			var lParentOffsetT = lcanvas.parentElement.offsetTop;
			var lElemL = parseFloat(lcanvas.style.left);
			var lElemT = parseFloat(lcanvas.style.top);
			var lElemMarginL = parseFloat(lcanvas.style.marginLeft);
			var lElemMarginT = parseFloat(lcanvas.style.marginTop);
			var newX = lScaledPosition.X - (lElemMarginL < 0 ? lElemL : lParentOffsetL);
			var newY = lScaledPosition.Y - (lElemMarginT < 0 ? lElemT : lParentOffsetT);
				
			return lgc.isPointInPath(newX,newY);
		}
		return false;
	};

	DD.Interaction.prototype.CreateDragSourceDummyCanvasAndShowEffects = function()
	{
		var dsModelData = this.GetDSObjFromDSID(this.m_DsFrameSetDataID);
		if(!dsModelData)
			return;
		var dragSourceEff = dsModelData.ef;
		var dummyCanvasWidth,dummyCanvasHeight,gc,draggedItemParentEl;

		dummyCanvasWidth = parseFloat(this.m_dragSourceCanvas.style.width);
		dummyCanvasHeight = parseFloat(this.m_dragSourceCanvas.style.height);
		this.m_DummyCanvasWithoutEffect = cp.createCanvas(0, 0, dummyCanvasWidth , dummyCanvasHeight,document.createElement('canvas'));
		this.m_DummyCanvasWithoutEffect.element.style.display = "block";
		this.m_DummyCanvasWithoutEffect.element.style.position = "absolute";
		this.m_DummyCanvasWithoutEffect.element.style.visibility = "hidden";
		this.m_DummyCanvasWithoutEffect.element.style.marginLeft = 0 + "px";
		this.m_DummyCanvasWithoutEffect.element.style.marginTop = 0 + "px";

		gc = this.m_DummyCanvasWithoutEffect.gc;
		if(this.m_dragSourceCanvas.className === "cp-animationItem")
		{
			var img = new Image();
			var modelData = cp.model.data[this.m_dragSourceCanvas.id];
			img.src = modelData.ip;
			gc.drawImage(img,0,0,dummyCanvasWidth,dummyCanvasHeight);
		}
		else
		gc.drawImage(this.m_dragSourceCanvas,0,0,dummyCanvasWidth,dummyCanvasHeight);
		document.getElementById('div_Slide').appendChild(this.m_DummyCanvasWithoutEffect.element);

		if( dragSourceEff === 2 )
			dragSourceEff = 0;

		if( dragSourceEff === 0 )
		{
			this.m_dummyCanvasOffset.x = 0;
			this.m_dummyCanvasOffset.y = 0;
			dummyCanvasWidth = parseFloat(this.m_dragSourceCanvas.style.width);
			dummyCanvasHeight = parseFloat(this.m_dragSourceCanvas.style.height);
			this.m_dummyCanvas = cp.createCanvas(0, 0, dummyCanvasWidth , dummyCanvasHeight,document.createElement('canvas'));
			this.m_dummyCanvas.element.style.display = "block";
			this.m_dummyCanvas.element.style.position = "absolute";
			this.m_dummyCanvas.element.style.visibility = "hidden";
			this.m_dummyCanvas.element.style.marginLeft = 0 + "px";
			this.m_dummyCanvas.element.style.marginTop = 0 + "px";
			this.m_dummyCanvas.id = "dummy";

			gc = this.m_dummyCanvas.gc;
			if(this.m_dragSourceCanvas.className === "cp-animationItem")
			{
				var img = new Image();
				var modelData = cp.model.data[this.m_dragSourceCanvas.id];
				img.src = modelData.ip;
				gc.drawImage(img,0,0,dummyCanvasWidth,dummyCanvasHeight);
			}
			else
			gc.drawImage(this.m_dragSourceCanvas,0,0,dummyCanvasWidth,dummyCanvasHeight);
			document.getElementById('div_Slide').appendChild(this.m_dummyCanvas.element);

			draggedItemParentEl = this.m_dragSourceCanvas.parentElement;
			this.m_dummyCanvas.element.style.left = parseFloat(draggedItemParentEl.style.left) + parseFloat(this.m_dragSourceCanvas.style.marginLeft) + "px" ;
			this.m_dummyCanvas.element.style.top = parseFloat(draggedItemParentEl.style.top) + parseFloat(this.m_dragSourceCanvas.style.marginTop) + "px";
		}
		if( dragSourceEff === 1 )
		{
			var zoom = 1.2;
			draggedItemParentEl = this.m_dragSourceCanvas.parentElement;
			var dsItemModelData = cp.model.data[this.m_DsFrameSetDataID];
			var dsCanvasData = cp.model.data[dsItemModelData.mdi];
			var lHasShadowOrReflection = dsCanvasData.re || (dsCanvasData.sh && !dsCanvasData.sh.i);
			if(lHasShadowOrReflection)
			{
				this.m_dummyCanvasOffset.x = this.m_InitialMouseLeft*(zoom-1);
				this.m_dummyCanvasOffset.y = this.m_InitialMouseTop*(zoom-1);
			}
			else
			{
				this.m_dummyCanvasOffset.x = (this.m_InitialMouseLeft - parseFloat(draggedItemParentEl.style.left))*(zoom-1);
				this.m_dummyCanvasOffset.y = (this.m_InitialMouseTop - parseFloat(draggedItemParentEl.style.top))*(zoom-1);
			}
			dummyCanvasWidth = parseFloat(this.m_dragSourceCanvas.style.width) * zoom;
			dummyCanvasHeight = parseFloat(this.m_dragSourceCanvas.style.height) * zoom;
			this.m_dummyCanvas = cp.createCanvas(0, 0, dummyCanvasWidth , dummyCanvasHeight,document.createElement('canvas'));
			this.m_dummyCanvas.element.style.display = "block";
			this.m_dummyCanvas.element.style.position = "absolute";
			this.m_dummyCanvas.element.style.visibility = "hidden";
			this.m_dummyCanvas.element.style.marginLeft = 0 + "px";
			this.m_dummyCanvas.element.style.marginTop = 0 + "px";
			this.m_dummyCanvas.id = "dummy";

			gc = this.m_dummyCanvas.gc;
			if(this.m_dragSourceCanvas.className === "cp-animationItem")
			{
				var img = new Image();
				var modelData = cp.model.data[this.m_dragSourceCanvas.id];
				img.src = modelData.ip;
				gc.drawImage(img,0,0,dummyCanvasWidth,dummyCanvasHeight);
			}
			else
			gc.drawImage(this.m_dragSourceCanvas,0,0,dummyCanvasWidth,dummyCanvasHeight);
			document.getElementById('div_Slide').appendChild(this.m_dummyCanvas.element);

			
			this.m_dummyCanvas.element.style.left = parseFloat(draggedItemParentEl.style.left) + parseFloat(this.m_dragSourceCanvas.style.marginLeft) -
			this.m_dummyCanvasOffset.x + "px" ;
			this.m_dummyCanvas.element.style.top = parseFloat(draggedItemParentEl.style.top) + parseFloat(this.m_dragSourceCanvas.style.marginTop) -
			this.m_dummyCanvasOffset.y + "px";
		}
		if( dragSourceEff == 2 )
		{
			var dsItemModelData = cp.model.data[this.m_DsFrameSetDataID];
			var dsCanvasData = cp.model.data[dsItemModelData.mdi];
			var lHasShadowOrReflection = dsCanvasData.re || (dsCanvasData.sh && !dsCanvasData.sh.i);
			this.m_dummyCanvasOffset.x = 10;
			this.m_dummyCanvasOffset.y = 10;
			dummyCanvasWidth = parseFloat(this.m_dragSourceCanvas.style.width) + this.m_dummyCanvasOffset.x*2;
			dummyCanvasHeight = parseFloat(this.m_dragSourceCanvas.style.height) + this.m_dummyCanvasOffset.y*2;
			var gradientLeft = 0;
			var gradientTop = 0;
			var gradientWidth = this.m_dummyCanvasOffset.x;
			var gradientHeight = this.m_dummyCanvasOffset.y;
			if( lHasShadowOrReflection )
			{
				this.m_dummyCanvasOffset.x = 0;
				this.m_dummyCanvasOffset.y = 0;
				gradientLeft = (-parseFloat(this.m_dragSourceCanvas.style.marginLeft)) - gradientWidth;
				gradientTop = (-parseFloat(this.m_dragSourceCanvas.style.marginTop)) - gradientHeight;
				dummyCanvasWidth = parseFloat(this.m_dragSourceCanvas.style.width);
				dummyCanvasHeight = parseFloat(this.m_dragSourceCanvas.style.height);
			}
			this.m_dummyCanvas = cp.createCanvas(0, 0, dummyCanvasWidth , dummyCanvasHeight,document.createElement('canvas'));
			this.m_dummyCanvas.element.style.display = "block";
			this.m_dummyCanvas.element.style.position = "absolute";
			this.m_dummyCanvas.element.style.visibility = "hidden";
			this.m_dummyCanvas.element.style.marginLeft = 0 + "px";
			this.m_dummyCanvas.element.style.marginTop = 0 + "px";
			this.m_dummyCanvas.id = "dummy";

			gc = this.m_dummyCanvas.gc;
			//gc.shadowBlur = 30;
			//gc.shadowColor = "black";
			//gc.shadowOffsetX = 0;
  			//gc.shadowOffsetY = 0;
			//gc.shadowOffset = 0;
			if(this.m_dragSourceCanvas.className === "cp-animationItem")
			{
				var img = new Image();
				var modelData = cp.model.data[this.m_dragSourceCanvas.id];
				img.src = modelData.ip;
				gc.drawImage(img,0,0,dummyCanvasWidth,dummyCanvasHeight);
			}
			else
			gc.drawImage(this.m_dragSourceCanvas,this.m_dummyCanvasOffset.x,this.m_dummyCanvasOffset.y,parseFloat(this.m_dragSourceCanvas.style.width),parseFloat(this.m_dragSourceCanvas.style.height));
			document.getElementById('div_Slide').appendChild(this.m_dummyCanvas.element);

			// top row gradient
			var lingrad = gc.createLinearGradient( gradientLeft + 0, gradientTop + gradientHeight, gradientLeft + 0, gradientTop + 0);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect(gradientLeft + gradientWidth, gradientTop + 0, this.m_DragSourceInitialFsPos.w, gradientHeight);

			//bottom row gradient
			lingrad = gc.createLinearGradient( gradientLeft + 0, gradientTop + gradientHeight + this.m_DragSourceInitialFsPos.h, gradientLeft + 0, gradientTop + gradientHeight*2 + this.m_DragSourceInitialFsPos.h);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect( gradientLeft + gradientWidth, gradientTop + gradientHeight + this.m_DragSourceInitialFsPos.h,this.m_DragSourceInitialFsPos.w ,gradientHeight);

			// left row
			lingrad = gc.createLinearGradient( gradientLeft + gradientWidth, gradientTop + 0, gradientLeft + 0, gradientTop + 0);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect( gradientLeft + 0, gradientTop + gradientHeight,gradientWidth, this.m_DragSourceInitialFsPos.h);

		 	// right row glow
			lingrad = gc.createLinearGradient( gradientLeft +  gradientWidth + this.m_DragSourceInitialFsPos.w,  gradientTop + 0, gradientLeft +  2*gradientWidth + this.m_DragSourceInitialFsPos.w, gradientTop + 0);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect( gradientLeft + gradientWidth + this.m_DragSourceInitialFsPos.w,  gradientTop + gradientHeight, gradientWidth, this.m_DragSourceInitialFsPos.h);

			// top-left corner gradient
			lingrad = gc.createLinearGradient( gradientLeft + gradientWidth, gradientTop + gradientHeight, gradientLeft + 0, gradientTop + 0);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect( gradientLeft + 0, gradientTop + 0,gradientWidth,gradientHeight);

			// top-right corner gradient
			lingrad = gc.createLinearGradient( gradientLeft + gradientWidth + this.m_DragSourceInitialFsPos.w, gradientTop + gradientHeight,  gradientLeft + 2*gradientWidth + this.m_DragSourceInitialFsPos.w, gradientTop + 0);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect( gradientLeft + gradientWidth + this.m_DragSourceInitialFsPos.w, gradientTop + 0,gradientWidth,gradientHeight);

			// bottom-left corner gradient
			lingrad = gc.createLinearGradient( gradientLeft + gradientWidth, gradientTop + gradientHeight + this.m_DragSourceInitialFsPos.h, gradientLeft + 0,  gradientTop + 2*gradientHeight + this.m_DragSourceInitialFsPos.h);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect( gradientLeft + 0, gradientTop + gradientHeight + this.m_DragSourceInitialFsPos.h, gradientWidth, gradientHeight);

			// bottom-right corner gradient
			lingrad = gc.createLinearGradient(  gradientLeft + gradientWidth + this.m_DragSourceInitialFsPos.w,  gradientTop + gradientHeight + this.m_DragSourceInitialFsPos.h,  gradientLeft + 2*gradientWidth + this.m_DragSourceInitialFsPos.w,  gradientTop + 2*gradientHeight + this.m_DragSourceInitialFsPos.h);
			lingrad.addColorStop(0, '#ffff00');
			lingrad.addColorStop(1, '#ffffff');
			gc.fillStyle = lingrad;
			gc.fillRect( gradientLeft + gradientWidth + this.m_DragSourceInitialFsPos.w,  gradientTop + this.m_DragSourceInitialFsPos.h + gradientHeight, gradientWidth, gradientHeight);
			
			draggedItemParentEl = this.m_dragSourceCanvas.parentElement;
			this.m_dummyCanvas.element.style.left = parseFloat(draggedItemParentEl.style.left) + parseFloat(this.m_dragSourceCanvas.style.marginLeft) - this.m_dummyCanvasOffset.x + "px" ;
			this.m_dummyCanvas.element.style.top = parseFloat(draggedItemParentEl.style.top) + parseFloat(this.m_dragSourceCanvas.style.marginTop)  - this.m_dummyCanvasOffset.y + "px";
		}
		this.m_dummyCanvas.element.style.visibility = "visible";
		this.m_dragSourceCanvas.style.visibility = "hidden";
	};

	DD.Interaction.prototype.ItemOnMouseMove = function( event )
	{
		var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
		if( ddInt === null )
			return;

		if( ddInt.m_dummyCanvas === null || ddInt.m_dragSourceCanvas === null)
			return;

		ddInt.m_dragSourceCanvas.style.visibility = "hidden";
		ddInt.m_dummyCanvas.element.style.visibility = "visible";

		var scaledPos = getScaledPosition(getPageX(event), getPageY(event));
		if(!ddInt.m_isItemBeingDragged)
		{
			ddInt.m_previousmouseleft = scaledPos.X;
			ddInt.m_previousmousetop = scaledPos.Y;
		}

		ddInt.m_dummyCanvas.element.style.left = parseInt(ddInt.m_dummyCanvas.element.style.left,10) + (scaledPos.X - ddInt.m_previousmouseleft) + "px";
		ddInt.m_dummyCanvas.element.style.top = parseInt(ddInt.m_dummyCanvas.element.style.top,10)  + (scaledPos.Y - ddInt.m_previousmousetop) + "px";

		DD.ChangeMouseCursor('pointer');

		ddInt.m_previousmouseleft = scaledPos.X;
		ddInt.m_previousmousetop = scaledPos.Y;

		ddInt.m_isItemBeingDragged = true;

		ddInt.m_tempFrameSetPos.x = ddInt.m_DragSourceInitialFsPos.x  + (parseFloat(ddInt.m_dummyCanvas.element.style.left) + ddInt.m_dummyCanvasOffset.x) - (parseFloat(ddInt.m_dragSourceCanvas.style.marginLeft)
					+ parseFloat(ddInt.m_dragSourceCanvas.parentElement.style.left) );
		ddInt.m_tempFrameSetPos.y = ddInt.m_DragSourceInitialFsPos.y  + (parseFloat(ddInt.m_dummyCanvas.element.style.top) + ddInt.m_dummyCanvasOffset.y) - (parseFloat(ddInt.m_dragSourceCanvas.style.marginTop)
					+ parseFloat(ddInt.m_dragSourceCanvas.parentElement.style.top));

		var itemsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');
		var dsFrameset = document.getElementById(ddInt.m_DsFrameSetDataID);

		var overlap = false;

		//bounds of the drag source.
		var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,ddInt.m_tempFrameSetPos.w,ddInt.m_tempFrameSetPos.h,DD.getRotationAngle(dsFrameset));
		var dsFsRect = DD.GetRectFromBounds(ddInt.m_tempFrameSetPos.x+dimAfterRot.minX,ddInt.m_tempFrameSetPos.y+dimAfterRot.minY,dimAfterRot.maxX - dimAfterRot.minX,dimAfterRot.maxY - dimAfterRot.minY);

		for(var i=itemsOnSlide.length - 1;i>=1 && overlap===false;--i)
		{
			var currEl = itemsOnSlide[i];
			if(dsFrameset.id == itemsOnSlide[i].id)
				continue;
			//bounds of the drop target
			var dtFrameSetID = itemsOnSlide[i].id;
			var dtObj = ddInt.GetDTObjFromDTID( dtFrameSetID );
			if(!dtObj)
				continue;
			var haPadd = 0;
			if( dtObj.ha )
				haPadd = dtObj.ha;
			var dtDimAfterRot = DD.GetDimensionsAfterRotation(0,0,parseFloat(currEl.style.width),parseFloat(currEl.style.height),DD.getRotationAngle(itemsOnSlide[i]));
			var l = parseFloat(currEl.style.left)+dtDimAfterRot.minX - haPadd;
			var t = parseFloat(currEl.style.top)+dtDimAfterRot.minY - haPadd;
			var w = dtDimAfterRot.maxX - dtDimAfterRot.minX + 2*haPadd;
			var h = dtDimAfterRot.maxY - dtDimAfterRot.minY + 2*haPadd;

			//check if the drag source and the drop target intersect
			var dtFsRect = DD.GetRectFromBounds(l,t,w,h);
			overlap = DD.doRectangleIntersect( dsFsRect, dtFsRect);
			var depList = dtObj.dep;
			var hintCap = null;
			if( !(depList === undefined || depList === null || depList.length <= 0) && cp.device != cp.IDEVICE)
				hintCap = dtObj.dep[0];
			if( overlap )
			{
			/*	cp.log("Overlap = true");
				cp.log("l1 = " + l.toString() + "t1 = " + t.toString() + "w1 = " + w.toString() + "h1 = " + h.toString() );
				cp.log("l2 = " + ddInt.m_tempFrameSetPos.x.toString() + "t2 = " + ddInt.m_tempFrameSetPos.y.toString() + "w1 = " + ddInt.m_tempFrameSetPos.w.toString() + "h2 = " + ddInt.m_tempFrameSetPos.h.toString() );
				cp.log(currEl.id);*/
				ddInt.ShowDropTargetEffect(dtFrameSetID);
				if(hintCap != null && hintCap != undefined)
					cp.showHint(hintCap,DD.CurrInteractionManager)
				//show Hint Here
			}
			else
			{
			/*	cp.log("Overlap = false");
				cp.log("l1 = " + l.toString() + "t1 = " + t.toString() + "w1 = " + w.toString() + "h1 = " + h.toString() );
				cp.log("l2 = " + ddInt.m_tempFrameSetPos.x.toString() + "t2 = " + ddInt.m_tempFrameSetPos.y.toString() + "w1 = " + ddInt.m_tempFrameSetPos.w.toString() + "h2 = " + ddInt.m_tempFrameSetPos.h.toString() );
				cp.log(currEl.id);*/
				ddInt.HideDropTargetEffect(dtFrameSetID, false);
				if(hintCap != null && hintCap != undefined)
					cp.hideHint(hintCap,DD.CurrInteractionManager)
			}
		}

		event.preventDefault();
	};

	DD.Interaction.prototype.ShowDropTargetEffect = function( dtFramesetId )
	{
		var dtModelObj = this.GetDTObjFromDTID(dtFramesetId);
		if( !dtModelObj )
			return;
		var dtEffect = dtModelObj.ef;
		var dtCanvas;
		if( dtEffect === 1 )
		{
			if(!this.m_DTFsIdToDTEffectCanvasMap[dtFramesetId])
			{
				var dtFs = document.getElementById(dtFramesetId);
				dtCanvas = document.getElementById(cp.model.data[dtFramesetId].mdi);
				var dtDiv = dtCanvas.parentElement;
				var dtItemModelData = cp.model.data[dtFramesetId];
				var dtCanvasData = cp.model.data[dtItemModelData.mdi];
				var lHasShadowOrReflection = dtCanvasData.re || (dtCanvasData.sh && !dtCanvasData.sh.i);

				var zoom = 1.2;
				var newWidth = parseFloat(dtCanvas.style.width)*zoom;
				var xOffset = (newWidth - parseFloat(dtCanvas.style.width))/2;
				var newHeight = parseFloat(dtCanvas.style.height)*zoom;
				var yOffset = (newHeight - parseFloat(dtCanvas.style.height))/2;
				var dtEffectCanvas = cp.createCanvas(0, 0, newWidth, newHeight,document.createElement('canvas'));
				dtEffectCanvas.element.style.display = "block";
				dtEffectCanvas.element.style.position = "absolute";
				dtEffectCanvas.element.style.visibility = "visible";
				dtCanvas.style.visibility = "hidden";
				dtEffectCanvas.element.style.marginLeft = 0 + "px";
				dtEffectCanvas.element.style.marginTop = 0 + "px";
				dtEffectCanvas.element.style.opacity = 1;

				var gc = dtEffectCanvas.gc;
				if(dtCanvas.className === "cp-animationItem")
				{
					var img = new Image();
					var modelData = cp.model.data[dtCanvas.id];
					img.src = modelData.ip;
					gc.drawImage(img,0,0,newWidth,newHeight);
				}
				else
				gc.drawImage(dtCanvas,0,0,newWidth,newHeight);
				try
				{
					var itemsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');
					var slideFs = itemsOnSlide[0];
					var nxtSibling = dtDiv.nextSibling;
					slideFs.insertBefore(dtEffectCanvas.element, nxtSibling);
				}
				catch(e)
				{
				}
				//document.getElementById('div_Slide').appendChild(dtEffectCanvas.element);//, dtCanvas.parentElement.nextSibling);
				if(lHasShadowOrReflection)
				{
					xOffset = (parseInt(dtFs.style.left) + parseInt(dtFs.style.width)/2)*(zoom-1);
					yOffset = (parseInt(dtFs.style.top) + parseInt(dtFs.style.height)/2)*(zoom-1);
					dtEffectCanvas.element.style.left = (parseFloat(dtDiv.style.left) + parseFloat(dtCanvas.style.marginLeft) - xOffset) + "px" ;
					dtEffectCanvas.element.style.top = (parseFloat(dtDiv.style.top) + parseFloat(dtCanvas.style.marginTop) - yOffset) + "px";
				}
				else
				{
					dtEffectCanvas.element.style.left = (parseFloat(dtDiv.style.left) - xOffset) + "px" ;
					dtEffectCanvas.element.style.top = (parseFloat(dtDiv.style.top) - yOffset) + "px";	
				}
				
				dtEffectCanvas.element.style.width = newWidth + "px" ;
				dtEffectCanvas.element.style.height = newHeight + "px";
				this.m_DTFsIdToDTEffectCanvasMap[dtFramesetId] = dtEffectCanvas;
			}
			else
			{
				dtCanvas = document.getElementById(cp.model.data[dtFramesetId].mdi);
				dtCanvas.style.visibility = "hidden";
				this.m_DTFsIdToDTEffectCanvasMap[dtFramesetId].element.style.visibility = "visible";
			}
		}
	};

	DD.Interaction.prototype.HideDropTargetEffect = function( dtFramesetId, shouldRemove )
	{
		if( this.m_DTFsIdToDTEffectCanvasMap[dtFramesetId] )
		{
			if(shouldRemove)
			{
				var dtCanvas = document.getElementById(cp.model.data[dtFramesetId].mdi);
				dtCanvas.style.visibility = "visible";
				var itemsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');
				var slideFs = itemsOnSlide[0];
				slideFs.removeChild(this.m_DTFsIdToDTEffectCanvasMap[dtFramesetId].element);
				this.m_DTFsIdToDTEffectCanvasMap[dtFramesetId] = null;
			}
			else
			{
				var dtCanvas = document.getElementById(cp.model.data[dtFramesetId].mdi);
				dtCanvas.style.visibility = "visible";
				this.m_DTFsIdToDTEffectCanvasMap[dtFramesetId].element.style.visibility = "hidden";
			}
		}
	};

	DD.Interaction.prototype.GetDTObjFromDTID = function( dropTargetID )
	{
		if(this.m_dtList.length > 0)
		{
			for( var j=0; j<this.m_dtList.length; ++j)
			{
				if(this.m_dtList[j].n === dropTargetID )
					return this.m_dtList[j];
			}
		}
		return null;
	};

	DD.Interaction.prototype.GetDSObjFromDSID = function( dragSourceID )
	{
		if(this.m_dsList.length > 0)
		{
			for( var j=0; j<this.m_dsList.length; ++j)
			{
				if(this.m_dsList[j].n === dragSourceID )
					return this.m_dsList[j];
			}
		}
		return null;
	};


	DD.Interaction.prototype.checkAccepts = function(dragSourceID,dropTargetID)
	{
		var doesAccept = false;
		var dtModelObj = this.GetDTObjFromDTID( dropTargetID );
		if( dtModelObj !== null )
		{
			var acceptsString = dtModelObj.ac;
			if(acceptsString === "" || acceptsString === "*" )
			{
				doesAccept = true;
			}
			else if(acceptsString === "\\b()\\b")
			{
				doesAccept = false;
			}
			else
			{
				var acceptsRegExp = new RegExp(acceptsString);
				doesAccept = acceptsRegExp.test(dragSourceID);
			}
			if(doesAccept)
			{
				var acceptCount = dtModelObj.acc;
				if( acceptCount < 0)
					doesAccept = true;
				else
				{
					var dtObj = this.DTMap[dropTargetID];
					if( dtObj )
					{
						if( dtObj.acceptedDragSources.length < acceptCount)
							doesAccept = true;
						else
						{
							if(dtModelObj.rgo === false)
								doesAccept = false;
							else
							{
								//this.ReplaceDragSource(dropTargetID);
								this.shouldReplaceDragSource = true;
								doesAccept = true;
							}
						}
					}
				}
			}
		}
		return doesAccept;
	};
	DD.Interaction.prototype.ItemOnMouseOver = function( event )
	{
		var lFrameset = event.target;
		var dsId = lFrameset.id;
		var dsItemModelData = cp.model.data[dsId];

		function isInsideCanvas(e){
					var lBool;
					if(that.lCanvas && that.lgc){
						var lScaledPosition = getScaledPosition(getPageX(e),getPageY(e));
						var lParentOffsetL = that.lCanvas.parentElement.offsetLeft;
						var lParentOffsetT = that.lCanvas.parentElement.offsetTop;
						var lElemL = parseFloat(that.lCanvas.style.left);
						var lElemT = parseFloat(that.lCanvas.style.top);
						var lElemMarginL = parseFloat(that.lCanvas.style.marginLeft);
						var lElemMarginT = parseFloat(that.lCanvas.style.marginTop);
						var newX = lScaledPosition.X - (lElemMarginL < 0 ? lElemL : lParentOffsetL);
						var newY = lScaledPosition.Y - (lElemMarginT < 0 ? lElemT : lParentOffsetT);
						lBool = that.lgc.isPointInPath(newX,newY);
						//cp.log("insidecanvas "+lBool);
						return lBool;
					}
					cp.log(lBool);
					return false;
				}

		if(dsItemModelData)
		{
			if( dsItemModelData.type === cp.kCPOTAutoShape )
			{
				this.lCanvas = document.getElementById(lFrameset.id + "c");
				this.lgc = this.lCanvas.getContext("2d");
				var that = this;

				
				lFrameset.onmousemove = function(e){
					if( this.lCanvas.ss !== undefined && this.lCanvas.ss === 0 )
					{
						if(isInsideCanvas(e))
						{
							DD.ChangeMouseCursor('pointer');
						}
						else
						{
							DD.ChangeMouseCursor('default');
						}
					}
					else
					{
						DD.ChangeMouseCursor('pointer');							
					}
				};
			}
			else
			{
				DD.ChangeMouseCursor('pointer');
			}
		}
	};
	DD.Interaction.prototype.ItemOnMouseOut = function( event )
	{
		var frameset = event.target;
		frameset.onmousemove = null;
		DD.ChangeMouseCursor('default');
	};

	DD.Interaction.prototype.ItemOnMouseUp = function( event )
	{
		var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
		if( ddInt === null )
			return;

		var temp = ddInt.m_dummyCanvas;
		ddInt.m_DummyCanvasWithoutEffect.id = "dummy";

		draggedItemParentEl = ddInt.m_dragSourceCanvas.parentElement;
		ddInt.m_DummyCanvasWithoutEffect.element.style.left = parseFloat(ddInt.m_dummyCanvas.element.style.left) + ddInt.m_dummyCanvasOffset.x + "px" ;
		ddInt.m_DummyCanvasWithoutEffect.element.style.top = parseFloat(ddInt.m_dummyCanvas.element.style.top) + ddInt.m_dummyCanvasOffset.y + "px";
		ddInt.m_DummyCanvasWithoutEffect.element.style.visibility = "visible";
		ddInt.m_dummyCanvas = ddInt.m_DummyCanvasWithoutEffect;

		var parentEl = document.getElementById('div_Slide');
		parentEl.removeChild(temp.element);

		ddInt.m_dummyCanvasOffset.x = 0;
		ddInt.m_dummyCanvasOffset.y = 0;

		DD.ChangeMouseCursor('default');

		ddInt.m_isItemBeingDragged = false;

		if(cp.device == cp.IDEVICE)
		{
			document.ontouchmove = DD.DefaultDocumentTouchMove;
			document.ontouchend = DD.DefaultDocumentTouchEnd;
			document.ontouchstart = DD.DefaultDocumentTouchStart;
		}
		else
		{
			document.onmouseup = null;
			document.onmousemove = null;
		}
		document.onselectstart = null;

		if(ddInt.m_dragSourceCanvas !== null && ddInt.m_dummyCanvas !== null)
		{
			ddInt.appendDragSourceToOverlappingDropTarget();
		}
	};
	DD.Interaction.prototype.deleteDummyCanvas = function()
	{
		var parentEl = document.getElementById('div_Slide');
		parentEl.removeChild(this.m_dummyCanvas.element);
	};
	DD.Interaction.prototype.appendDragSourceToOverlappingDropTarget = function()
	{
			var itemsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');
			var dsFrameset = document.getElementById(this.m_DsFrameSetDataID);

			var overlap = false;
			var accepts = false;

			var rejectedDropTargetID = null;

			//bounds of the drag source.
			var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,this.m_tempFrameSetPos.w,this.m_tempFrameSetPos.h,DD.getRotationAngle(dsFrameset));
			var dsFsRect = DD.GetRectFromBounds(this.m_tempFrameSetPos.x+dimAfterRot.minX,this.m_tempFrameSetPos.y+dimAfterRot.minY,dimAfterRot.maxX - dimAfterRot.minX,dimAfterRot.maxY - dimAfterRot.minY);
			//var dsHitPoints = DD.getEndPointsAfterRotation(this.m_tempFrameSetPos.x,this.m_tempFrameSetPos.y,this.m_tempFrameSetPos.w,this.m_tempFrameSetPos.h,DD.getRotationAngle(dsFrameset));

			//iterate through all the items on stage till you find a overlap, starting from the item with least depth.
			for(var i=itemsOnSlide.length - 1;i>=1;--i)
			{
				var currEl = itemsOnSlide[i];
				if(dsFrameset.id == itemsOnSlide[i].id)
					continue;
				//bounds of the drop target
				var dtFrameSetID = itemsOnSlide[i].id;
				var dtObj = this.GetDTObjFromDTID( dtFrameSetID );
				if(!dtObj)
					continue;
				var haPadd = 0;
				if( dtObj.ha )
					haPadd = dtObj.ha;
				var dtDimAfterRot = DD.GetDimensionsAfterRotation(0,0,parseFloat(currEl.style.width),parseFloat(currEl.style.height),DD.getRotationAngle(itemsOnSlide[i]));
				var l = parseFloat(currEl.style.left)+dtDimAfterRot.minX - haPadd;
				var t = parseFloat(currEl.style.top)+dtDimAfterRot.minY - haPadd;
				var w = dtDimAfterRot.maxX - dtDimAfterRot.minX + 2*haPadd;
				var h = dtDimAfterRot.maxY - dtDimAfterRot.minY + 2*haPadd;

				//check if the drag source and the drop target intersect

				var dtFsRect = DD.GetRectFromBounds(l,t,w,h);
				overlap = DD.doRectangleIntersect( dsFsRect, dtFsRect);

				if(overlap)
				{
					if(this.m_dtList.length > 0)
					{
						for( var k=0; k<this.m_dtList.length; ++k)
						{
							dtID = this.m_dtList[k].n;
							this.HideDropTargetEffect(dtID, true);
						}
					}
					var dsObj = this.GetDSObjFromDSID( this.m_DsFrameSetDataID );
					if( dtObj === null || dsObj === null )
					{
						return;
					}
					var dsPropObj = this.DragSourceCurrentStateList[this.DSMap[this.m_DsFrameSetDataID]];
					this.shouldReplaceDragSource = false;
					if( dsPropObj.DropTargetId === dtFrameSetID )
						accepts = true;
					else
					{
						accepts = this.checkAccepts(dsObj.t,dtFrameSetID);	
					}
					if(accepts)
					{
						this.undoAvailable = true;
						this.resetAvailable = true;
						this.UpdateDragSourcePreviousStatePropertiesObjects();
						if(this.shouldReplaceDragSource)
						{
							this.ReplaceDragSource(dtFrameSetID);
						}
						this.DoOnMouseUpNAccept(dsObj,dtObj,dtFrameSetID);
						break;		

					}
					else
					{
						if(rejectedDropTargetID === null)
							rejectedDropTargetID = dtFrameSetID;
					}			
				}
			}
			//If accepts is false, animate the drag source back to its original position.
			if(accepts === false)
			{
				if(rejectedDropTargetID !== null)
				{
					this.DoOnDropTargetRejects(rejectedDropTargetID);
					this.MoveDragSourceOnDropTargetReject(dsFrameset,true);
				}
				else
				{
					this.MoveDragSourceOnDropTargetReject(dsFrameset,false);
				}
			}
	};

	DD.Interaction.prototype.PlayReturnDragSourceAudio = function()
	{
		if( !this.m_ReturnDragSourceAudio )
			return;
		var am = cp.movie.am;
		cp.playAudio(this.m_ReturnDragSourceAudio, false);
	};

	DD.Interaction.prototype.MoveDragSourceOnDropTargetReject = function(dsFrameset,isOverlap)
	{
		var leftEdge = parseFloat(this.m_dummyCanvas.element.style.left);
		var rightEdge = parseFloat(this.m_dummyCanvas.element.style.left) + parseFloat(this.m_dummyCanvas.element.style.width);
		var topEdge = parseFloat(this.m_dummyCanvas.element.style.top);
		var bottomEdge = parseFloat(this.m_dummyCanvas.element.style.top) + parseFloat(this.m_dummyCanvas.element.style.height);
		var slideWidth = parseFloat(this.m_dummyCanvas.element.parentElement.style.width);
		var slideHeight = parseFloat(this.m_dummyCanvas.element.parentElement.style.height);
		var canStay = true;
		if( leftEdge > slideWidth || rightEdge < 0 || topEdge > slideHeight || bottomEdge < 0 )
			canStay = false;
		if( isOverlap === true || this.m_SendDragSourceBack || !canStay )
		{
				this.AnimateObjectGliding(	this.m_dummyCanvas.element,
											new DD.AnimationState( parseFloat(this.m_dummyCanvas.element.style.left), parseFloat(this.m_dummyCanvas.element.style.top),null,null,null),
											new DD.AnimationState( parseFloat(this.m_dragSourceCanvas.style.marginLeft) + parseFloat(this.m_dragSourceCanvas.parentElement.style.left) - this.m_dummyCanvasOffset.x,
																	parseFloat(this.m_dragSourceCanvas.style.marginTop) + parseFloat(this.m_dragSourceCanvas.parentElement.style.top) - this.m_dummyCanvasOffset.y, null,null,null ),
											10, this.ReturnDragSourceAnimationCallback);
				if(isOverlap === true)
					this.PlayReturnDragSourceAudio();
		}
		else
		{
			this.undoAvailable = true;
			this.resetAvailable = true;
			this.UpdateDragSourcePreviousStatePropertiesObjects();
			var dsFramesetId = dsFrameset.id;
			var dsDiv = this.m_dragSourceCanvas.parentElement;
			// ===========================================================================================================================
			// restore original size that may have been changed due to Snap behaviour Size =======================

			var dragSourceObject = null;
			for( var ii = 0; ii < this.DragSourceInitialStateList.length; ++ii )
			{
				var lDsPropObj = this.DragSourceInitialStateList[ii];
				if(lDsPropObj.objectID == dsFramesetId)
					dragSourceObject = lDsPropObj;
			}
			if(dragSourceObject==null)
				return;

			if(dragSourceObject.Width !== null)
				dsFrameset.style.width = parseFloat(dragSourceObject.Width) + "px";
			if(dragSourceObject.Height !== null)
				dsFrameset.style.height = parseFloat(dragSourceObject.Height) + "px";
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetId]], null,
				null, null, dsFrameset.style.width, dsFrameset.style.height, null,null,null);

			var divStruct = dragSourceObject.divStruct;
			if(divStruct !== null)
			{
				if(divStruct.Width !== null)
					dsDiv.style.width = parseFloat(divStruct.Width) + "px";
				if(divStruct.Height !== null)
					dsDiv.style.height = parseFloat(divStruct.Height) + "px";
				DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetId]], null,
				null, null, null, null, null,divStruct,null);
			}
			var canvasStruct = dragSourceObject.canvasStruct;
			if(canvasStruct !== null)
			{
				if(canvasStruct.Width !== null)
					this.m_dragSourceCanvas.style.width = parseFloat(canvasStruct.Width) + "px";
				if(canvasStruct.Height !== null)
					this.m_dragSourceCanvas.style.height = parseFloat(canvasStruct.Height) + "px";
				if(canvasStruct.MarginLeft !== null)
					this.m_dragSourceCanvas.style.marginLeft = parseFloat(canvasStruct.MarginLeft) + "px";
				if(canvasStruct.MarginTop !== null)
					this.m_dragSourceCanvas.style.marginTop = parseFloat(canvasStruct.MarginTop) + "px";
				DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetId]], null,
				null, null, null, null, null,null,canvasStruct);
			}

			// Restore the original position
			this.SetDsFramesetAndCanvasDivPos(dsFramesetId, this.m_tempFrameSetPos.x, this.m_tempFrameSetPos.y );
			// Restore the original opacity
			this.m_dragSourceCanvas.style.opacity = 1;
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetId]], null,
				null, null, null, null, 1,null,null);
			// Restore the original depth
			this.RestoreOriginalIndexOfDsFramesetId( dsFramesetId );

			// restore Draggable behaviour
			if(cp.device == cp.IDEVICE)
			{
				dsFrameset.ontouchstart = this.ItemOnMouseDown;
			}
			else
			{
				dsFrameset.onmousedown = this.ItemOnMouseDown;
			}
			if( DD.getAttribute(this.m_elId, 'hc') === true && cp.device != cp.IDEVICE)
			{
				dsFrameset.onmouseover = this.ItemOnMouseOver;
				dsFrameset.onmouseout = this.ItemOnMouseOut;
			}

			// update lms object
			var dslmsobj = this.DSLMSMap[dsFrameset.id];
			dslmsobj.posleft = dsFrameset.style.left;
			dslmsobj.postop = dsFrameset.style.top;
			dslmsobj.previousDTID = dslmsobj.currentDTID;

			if(dslmsobj.currentDTID !== null)
			{
				var dtlmsobj = this.DTMap[dslmsobj.currentDTID];

				for( var j = 0; j < dtlmsobj.acceptedSourceObjects.length; ++j )
				{
					if( dtlmsobj.acceptedSourceObjects[j].objectID === dslmsobj.objectID )
					{
						dtlmsobj.acceptedSourceObjects.splice(j,1);
						break;
					}
				}

			}
			dslmsobj.currentDTID = null;

			// update drop Targets accepted source list
			var prevDropTargetId = this.DragSourceCurrentStateList[this.DSMap[this.m_DsFrameSetDataID]].DropTargetId;
			if(  prevDropTargetId )
			{
				for( var i = 0; i < this.DTMap[prevDropTargetId].acceptedDragSources.length; ++i )
				{
					if( this.DTMap[prevDropTargetId].acceptedDragSources[i] === this.m_DsFrameSetDataID )
					{
						this.DTMap[prevDropTargetId].acceptedDragSources.splice(i,1);
						break;
					}
				}
				for(var j = 0; j < this.DTMap[prevDropTargetId].acceptedSourceObjects.length; ++j )
					{
						if( this.DTMap[prevDropTargetId].acceptedSourceObjects[j].objectID === this.m_DsFrameSetDataID )
						{
							this.DTMap[prevDropTargetId].acceptedSourceObjects.splice(j,1);
							break;
						}
					}
				var prevDtModelObj = this.GetDTObjFromDTID( prevDropTargetId );
				var snapPosType = prevDtModelObj.sbp;
				if(	snapPosType == 	DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingTop ||
					snapPosType ==	DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingBottom ||
					snapPosType ==	DD.SnapBehaviourPos.kCPSBPTileBottomTopStartingLeft ||
					snapPosType ==	DD.SnapBehaviourPos.kCPSBPTileTopBottomStartingLeft )
				{
					this.SetSnapPosition( prevDropTargetId, null );
				}
			}
			this.DragSourceCurrentStateList[this.DSMap[this.m_DsFrameSetDataID]].DropTargetId = null;

			// ===========================================================================================================================
			this.m_dragSourceCanvas.style.visibility = 'visible';

			this.deleteDummyCanvas();

			this.m_dragSourceCanvas = null;
			this.m_dummyCanvas = null;
		}		
	};

	DD.Interaction.prototype.DoOnMouseUpNAccept = function(dsObj,dtObj,dtFrameSetID)
	{

			var prevDropTargetId = this.DragSourceCurrentStateList[this.DSMap[this.m_DsFrameSetDataID]].DropTargetId;
			if(  prevDropTargetId )
			{
				for( var i = 0; i < this.DTMap[prevDropTargetId].acceptedDragSources.length; ++i )
				{
					if( this.DTMap[prevDropTargetId].acceptedDragSources[i] === this.m_DsFrameSetDataID )
					{
						this.DTMap[prevDropTargetId].acceptedDragSources.splice(i,1);
						break;
					}
				}
				for(var j = 0; j < this.DTMap[prevDropTargetId].acceptedSourceObjects.length; ++j )
						{
							if( this.DTMap[prevDropTargetId].acceptedSourceObjects[j].objectID === this.m_DsFrameSetDataID )
							{
								this.DTMap[prevDropTargetId].acceptedSourceObjects.splice(j,1);
								break;
							}
						}

			}

			this.appendDivAsChildOfAnotherDiv(dtFrameSetID,this.m_DsFrameSetDataID);
			var dsItemModelData = cp.model.data[this.m_DsFrameSetDataID];
			var dsCanvasData = cp.model.data[dsItemModelData.mdi];
			var lHasShadowOrReflection = dsCanvasData.re || (dsCanvasData.sh && !dsCanvasData.sh.i);

			if(lHasShadowOrReflection)
			{
				this.AnimateObjectGliding(	this.m_dummyCanvas.element,
											new DD.AnimationState( parseFloat(this.m_dummyCanvas.element.style.left), parseFloat(this.m_dummyCanvas.element.style.top),parseFloat(this.m_dummyCanvas.element.style.width),parseFloat(this.m_dummyCanvas.element.style.height),1),
											new DD.AnimationState( parseFloat(this.m_dragSourceCanvas.style.marginLeft) + parseFloat(this.m_dragSourceCanvas.parentElement.style.left) - this.m_dummyCanvasOffset.x,
																	parseFloat(this.m_dragSourceCanvas.style.marginTop) + parseFloat(this.m_dragSourceCanvas.parentElement.style.top) - this.m_dummyCanvasOffset.y, parseFloat(this.m_dragSourceCanvas.style.width) + this.m_dummyCanvasOffset.x*2,parseFloat(this.m_dragSourceCanvas.style.height) + this.m_dummyCanvasOffset.y*2,parseFloat(this.m_dragSourceCanvas.style.opacity) ),
											10, this.ReturnDragSourceAnimationCallback);
			}
			else
			{
				this.AnimateObjectGliding(	this.m_dummyCanvas.element,
											new DD.AnimationState( parseFloat(this.m_dummyCanvas.element.style.left), parseFloat(this.m_dummyCanvas.element.style.top),parseFloat(this.m_dummyCanvas.element.style.width),parseFloat(this.m_dummyCanvas.element.style.height),1),
											new DD.AnimationState( parseFloat(this.m_dragSourceCanvas.style.marginLeft) + parseFloat(this.m_dragSourceCanvas.parentElement.style.left) - this.m_dummyCanvasOffset.x,
																	parseFloat(this.m_dragSourceCanvas.style.marginTop) + parseFloat(this.m_dragSourceCanvas.parentElement.style.top) - this.m_dummyCanvasOffset.y, parseFloat(this.m_dragSourceCanvas.parentElement.style.width) + this.m_dummyCanvasOffset.x*2,parseFloat(this.m_dragSourceCanvas.parentElement.style.height) + this.m_dummyCanvasOffset.y*2,parseFloat(this.m_dragSourceCanvas.style.opacity) ),
											10, this.ReturnDragSourceAnimationCallback);
			}

			
			this.DTMap[dtFrameSetID].acceptedDragSources.push(this.m_DsFrameSetDataID);
			this.DragSourceCurrentStateList[this.DSMap[this.m_DsFrameSetDataID]].DropTargetId = dtFrameSetID;


			//LMS
			if(this.DSLMSMap[this.m_DsFrameSetDataID].currentDTID !== dtFrameSetID)
			{
				var dragSource = document.getElementById(this.m_DsFrameSetDataID);
				this.DTMap[dtFrameSetID].acceptedSourceObjects.push(this.DSLMSMap[this.m_DsFrameSetDataID]);
				this.DSLMSMap[this.m_DsFrameSetDataID].posleft = dragSource.style.left;
				this.DSLMSMap[this.m_DsFrameSetDataID].postop = dragSource.style.top;
				this.DSLMSMap[this.m_DsFrameSetDataID].previousDTID = this.DSLMSMap[this.m_DsFrameSetDataID].currentDTID;
				this.DSLMSMap[this.m_DsFrameSetDataID].currentDTID = dtFrameSetID;
				this.DTLMSList.push(this.DTMap[dtFrameSetID]);
			}

			this.appendToAnswerList(dsObj.t,dtObj.t);

			this.DoOnDropTargetAccepts(dtFrameSetID);

			DD.ChangeMouseCursor('default');

	};
	DD.Interaction.prototype.UpdateDragSourcePreviousStatePropertiesObjects = function()
	{
		for(var i = 0; i < this.DragSourceCurrentStateList.length;++i)
		{
			var dsObject = this.DragSourceCurrentStateList[i];
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourcePreviousStateList[i],dsObject.Index,dsObject.posleft,dsObject.postop,
				dsObject.Width,dsObject.Height,dsObject.Opacity,dsObject.divStruct,dsObject.canvasStruct);
			this.DragSourcePreviousStateList[i].DropTargetId = dsObject.DropTargetId;
		}
	};

	DD.Interaction.prototype.UpdateDragSourceCurrentStatePropertiesObjects = function(newDragSourceCurrentList)
	{
		for(var i = 0; i < newDragSourceCurrentList.length;++i)
		{
			var dsObject = newDragSourceCurrentList[i];
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[i],dsObject.Index,dsObject.posleft,dsObject.postop,
				dsObject.Width,dsObject.Height,dsObject.Opacity,dsObject.divStruct,dsObject.canvasStruct);
			this.DragSourceCurrentStateList[i].DropTargetId = dsObject.DropTargetId;
		}
	};

	DD.Interaction.prototype.ReplaceDragSource = function( dtFramesetId )
	{
		// If Replace option is selected && number of accepted drag sources in the drop target is more than the count
		// then send the dragSource that came first back to its original position
		var dtModelObj = this.GetDTObjFromDTID(dtFramesetId);
		if(!dtModelObj)
			return;
		var shouldReplace = dtModelObj.rgo;
		if(!shouldReplace)
			return;

		var dtPropObj = this.DTMap[dtFramesetId];
		var replacedDsFsId = dtPropObj.acceptedDragSources[0];
		var dsItemData = cp.model.data[replacedDsFsId];
		var dsCanvasData = cp.model.data[dsItemData.mdi];
		var replacedDSFrameset = document.getElementById(replacedDsFsId);
		var replacedDSCanvas = document.getElementById(dsItemData.mdi);
		if( !replacedDSFrameset || !replacedDSCanvas )
			return;
		var replacedDsDiv = replacedDSCanvas.parentElement;
		if(!replacedDsDiv)
			return;

		// Create the dummy canvas which will be animated back to the original position
		this.m_ReplacedDragSourceDummyCanvas = DD.CreateDummyCanvas(replacedDSCanvas, this.m_dummyCanvas.element);
		this.m_ReplacedDragSourceDummyCanvas.element.style.visibility = "visible";

		// cache the canvas to be replaced. This has to be made visible when the animation ends
		this.m_ReplacedDragSourceCanvas = replacedDSCanvas;
		this.m_ReplacedDragSourceCanvas.style.visibility = "hidden";

		// restore original size that may have been changed due to Snap behaviour Size =======================

		var dragSourceObject = null;
		for( var ii = 0; ii < this.DragSourceInitialStateList.length; ++ii )
		{
			var lDsPropObj = this.DragSourceInitialStateList[ii];
			if(lDsPropObj.objectID == replacedDsFsId)
				dragSourceObject = lDsPropObj;
		}
		if(dragSourceObject==null)
			return;

		if(dragSourceObject.Width !== null)
			replacedDSFrameset.style.width = parseFloat(dragSourceObject.Width) + "px";
		if(dragSourceObject.Height !== null)
			replacedDSFrameset.style.height = parseFloat(dragSourceObject.Height) + "px";
		DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[replacedDsFsId]], null,
			null, null, replacedDSFrameset.style.width, replacedDSFrameset.style.height, null,null,null);

		var divStruct = dragSourceObject.divStruct;
		if(divStruct !== null)
		{
			if(divStruct.Width !== null)
				replacedDsDiv.style.width = parseFloat(divStruct.Width) + "px";
			if(divStruct.Height !== null)
				replacedDsDiv.style.height = parseFloat(divStruct.Height) + "px";
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[replacedDsFsId]], null,
			null, null, null, null, null,divStruct,null);
		}
		var canvasStruct = dragSourceObject.canvasStruct;
		if(canvasStruct !== null)
		{
			if(canvasStruct.Width !== null)
				replacedDSCanvas.style.width = parseFloat(canvasStruct.Width) + "px";
			if(canvasStruct.Height !== null)
				replacedDSCanvas.style.height = parseFloat(canvasStruct.Height) + "px";
			if(canvasStruct.MarginLeft !== null)
				replacedDSCanvas.style.marginLeft = parseFloat(canvasStruct.MarginLeft) + "px";
			if(canvasStruct.MarginTop !== null)
				replacedDSCanvas.style.marginTop = parseFloat(canvasStruct.MarginTop) + "px";
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[replacedDsFsId]], null,
			null, null, null, null, null,null,canvasStruct);
		}

		var replacedDsItemModelData = cp.model.data[replacedDsFsId];
		var replacedDsCanvasData = cp.model.data[replacedDsItemModelData.mdi];
		var lHasShadowOrReflection = replacedDsCanvasData.re || (replacedDsCanvasData.sh && !replacedDsCanvasData.sh.i);
		//========================================================================================================================

		var initialopac = 1;
		if(replacedDSCanvas.style.opacity !== "" )
			initialopac = replacedDSCanvas.style.opacity;

		// Restore the original position
		this.SetDsFramesetAndCanvasDivPos(replacedDsFsId, dsCanvasData.b[0], dsCanvasData.b[1] );
		// Restore the original opacity
		replacedDSCanvas.style.opacity = 1;
		DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[replacedDsFsId]], null,
			null, null, null, null, 1,null,null);
		// Restore the original depth
		this.RestoreOriginalIndexOfDsFramesetId( replacedDsFsId );

		//Animate the dummy canvas
		if(lHasShadowOrReflection)
		{
			this.AnimateObjectGliding(	this.m_ReplacedDragSourceDummyCanvas.element,
										new DD.AnimationState( parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.left),parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.top),parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.width),parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.height),initialopac ),
										new DD.AnimationState( parseFloat(replacedDSCanvas.style.marginLeft) + parseFloat(replacedDSCanvas.parentElement.style.left) , parseFloat(replacedDSCanvas.style.marginTop) + parseFloat(replacedDSCanvas.parentElement.style.top),parseFloat(replacedDSCanvas.style.width),parseFloat(replacedDSCanvas.style.height),1 ),
										20, this.ReplaceDragSourceAnimationCallback);
		}
		else
		{
			this.AnimateObjectGliding(	this.m_ReplacedDragSourceDummyCanvas.element,
										new DD.AnimationState( parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.left),parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.top),parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.width),parseFloat(this.m_ReplacedDragSourceDummyCanvas.element.style.height),initialopac ),
										new DD.AnimationState( parseFloat(replacedDSCanvas.style.marginLeft) + parseFloat(replacedDSCanvas.parentElement.style.left) , parseFloat(replacedDSCanvas.style.marginTop) + parseFloat(replacedDSCanvas.parentElement.style.top),parseFloat(replacedDSCanvas.parentElement.style.width),parseFloat(replacedDSCanvas.parentElement.style.height),1 ),
										20, this.ReplaceDragSourceAnimationCallback);
		}

		// restore Draggable behaviour
		if(cp.device == cp.IDEVICE)
		{
			replacedDSFrameset.ontouchstart = this.ItemOnMouseDown;
		}
		else
		{
			replacedDSFrameset.onmousedown = this.ItemOnMouseDown;
		}
		if( DD.getAttribute(this.m_elId, 'hc') === true && cp.device != cp.IDEVICE)
		{
			replacedDSFrameset.onmouseover = this.ItemOnMouseOver;
			replacedDSFrameset.onmouseout = this.ItemOnMouseOut;
		}

		// update lms object
		var dslmsobj = this.DSLMSMap[replacedDsFsId];
		dslmsobj.posleft = replacedDSFrameset.style.left;
		dslmsobj.postop = replacedDSFrameset.style.top;
		dslmsobj.previousDTID = dslmsobj.currentDTID;
		dslmsobj.currentDTID = null;

		// update drop Targets accepted source list
		dtPropObj.acceptedSourceObjects.splice(0,1);
		dtPropObj.acceptedDragSources.splice(0,1);
		this.DragSourceCurrentStateList[this.DSMap[replacedDsFsId]].DropTargetId = null;
	};

	DD.Interaction.prototype.ReplaceDragSourceAnimationCallback = function()
	{
		var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
		if( ddInt === null )
			return;
		if( ddInt.m_ReplacedDragSourceCanvas && ddInt.m_ReplacedDragSourceDummyCanvas)
		{
			ddInt.m_ReplacedDragSourceCanvas.style.visibility = "visible";
			var parentEl = document.getElementById('div_Slide');
			parentEl.removeChild(ddInt.m_ReplacedDragSourceDummyCanvas.element);
			ddInt.m_ReplacedDragSourceCanvas = null;
			ddInt.m_ReplacedDragSourceDummyCanvas = null;
		}

	};

	DD.Interaction.prototype.RestoreOriginalIndexOfDsFramesetId = function( dsFramesetId )
	{
		var dsInitPropObj = this.DragSourceInitialStateList[this.DSMap[dsFramesetId]];
		if(!dsInitPropObj)
			return;

		var prevNonDs = dsInitPropObj.prevNonDs;
		var relDepth = dsInitPropObj.relDepth;
		var frameSetsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');
		var framesetId = null;
		var prevNonDsFound = false;
		if( prevNonDs === null )
			prevNonDsFound = true;
		for(j=1;j<frameSetsOnSlide.length;++j)
		{
			framesetId = frameSetsOnSlide[j].id;
			if(!prevNonDsFound)
			{
				if(framesetId === prevNonDs)
				{
					prevNonDsFound = true;
				}
				else
					continue;
			}
			else
			{
				if(!(this.DSMap[framesetId] !== undefined && this.DSMap[framesetId] !== null) )
				{
					// this means that this framesetId is not a Drag Source
					break;
				}
				else
				{
					if(framesetId!==dsFramesetId)
					{
						relDepth--;
						if(relDepth <= 0)
						{
							break
						}
					}
				}
			}
		}
		this.SetFramesetDepth(dsFramesetId, framesetId);
		for(j=1;j<frameSetsOnSlide.length;++j)
		{
			framesetId = frameSetsOnSlide[j].id;
			if(this.DSMap[framesetId] !== undefined && this.DSMap[framesetId] !== null)
			{
				DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[framesetId]], j-1, null, null, null,null, null, null, null);
			}
		}
	}

	DD.Interaction.prototype.SetFramesetDepth = function( dsFramesetId, refFramesetId )
	{
		var refFrameset = null;
		var refDiv = null;
		if(refFramesetId)
		{
			refFrameset = document.getElementById(refFramesetId);
			refDiv = document.getElementById(cp.model.data[refFrameset.id].mdi).parentElement;
		}
		var dsFrameset = document.getElementById(dsFramesetId);
		var dsDiv = document.getElementById(cp.model.data[dsFramesetId].mdi).parentElement;

		refFrameset.parentNode.insertBefore(dsFrameset, refFrameset);
		refDiv.parentNode.insertBefore(dsDiv, refDiv);
	}

	DD.Interaction.prototype.PerformOnDropActions = function(dtID)
	{
		var dtObj = this.GetDTObjFromDTID( dtID );
		var dsObj = this.GetDSObjFromDSID( this.m_DsFrameSetDataID );
		if( dtObj === null || dsObj === null )
			return;
		var onDropProperty = "oda_" + dsObj.t;
		var oda = dtObj[onDropProperty];
		if( oda===undefined || oda === null )
			return;
		cp.movie.executeAction(oda);
	};

	DD.Interaction.prototype.CheckAutoSubmit = function()
	{
		if(this.m_autoSubmit)
		{
			var lQuestionStatus = this.CheckIfCorrect();
			var interactionAnsweredCorrectly = false;
		
			//SubmitInteractions(this.m_elId, lQuestionStatus, ++this.m_CurrentAttempt, DD.getAttribute(this.m_elId, 'cal'), this.convertAnswerListToString(false));
			
			if (lQuestionStatus == cp.QuestionStatusEnum.CORRECT || lQuestionStatus == cp.QuestionStatusEnum.PARTIAL_CORRECT)
			{
				SubmitInteractions(this.m_elId, lQuestionStatus, this.m_CurrentAttempt);
				this.m_CurrentAttempt++;
				cp.movie.executeAction(this.m_successAction);
				this.m_InteractionCompleted = true;
				interactionAnsweredCorrectly = true;
			}

			if((this.m_maxAttempts > 0 && this.m_CurrentAttempt >= this.m_maxAttempts) || interactionAnsweredCorrectly)
			{
				this.disableInteraction();
			}
		}
	};

	DD.Interaction.prototype.getCorrectAnswersArray = function()
	{
		var lRetArr = [];
		var lCorrectAnswerObjectsArray = DD.getAttribute(this.m_elId, 'cal');
		for(var i = 0; i < lCorrectAnswerObjectsArray.length; ++i)
		{
			var lObj = lCorrectAnswerObjectsArray[i];
			if(lObj.a)
				lRetArr.push(lObj.a);
		}
		
		return lRetArr;
	};
	
	DD.Interaction.prototype.OnSubmitButtonClicked = function()
	{
		if( this.m_maxAttempts > 0 && (this.m_CurrentAttempt >= this.m_maxAttempts) )
			return;

		if(this.m_questionObj)
		this.storeSuspendData();
		
		var lQuestionStatus = this.CheckIfCorrect();

		var interactionAnsweredCorrectly = false;
		
		//DO NOT SEND CORRECT ANSWER AND CURRENT ANSWER PARAMETERS AS OF NOW BECAUSE CURRENTLY DRAG DROP QUESTION IS CONSIDERED AS CHOICE QUESTION.
		//SubmitInteractions(this.m_elId, lQuestionStatus, ++this.m_CurrentAttempt, this.getCorrectAnswersArray(), this.convertAnswerListToString(false));
		SubmitInteractions(this.m_elId, lQuestionStatus, this.m_CurrentAttempt);		
        this.m_CurrentAttempt++;
        if (lQuestionStatus == cp.QuestionStatusEnum.CORRECT || lQuestionStatus == cp.QuestionStatusEnum.PARTIAL_CORRECT)
		{
			cp.movie.executeAction(this.m_successAction);
			this.m_InteractionCompleted = true;
			interactionAnsweredCorrectly = true;
		}
		else
		{
			// For an unlikely use case where the correct answer is not set at all, the following code is written.
			var correctAnsList = DD.getAttribute(this.m_elId, 'cal');
			if((correctAnsList === undefined) || (correctAnsList === null) || (correctAnsList.length <= 0))
			{
				//cp.movie.executeAction('cp.jumpToNextSlide();'); // Do Nothing
				this.m_InteractionCompleted = true;
			}
			else if( this.m_maxAttempts > 0 && (this.m_CurrentAttempt === this.m_maxAttempts) )
			{
				this.ShowInteractionFailureCaption();
				cp.movie.executeAction(this.m_failureAction);
				this.m_InteractionCompleted = true;
			}
			else
			{
				this.ShowInteractionFailureCaption();
				if( DD.getAttribute(this.m_elId, 're' ) === true )
					this.ResetEverythingOnFailure();
				else if( DD.getAttribute(this.m_elId, 'ri' ) === true )
					this.ResetOnlyInCorrectOnFailure();
			}
		}

		if((this.m_maxAttempts > 0 && this.m_CurrentAttempt >= this.m_maxAttempts) || interactionAnsweredCorrectly)
		{
			this.disableInteraction();
		}
	};

	DD.Interaction.prototype.OnUndoButtonClicked = function()
	{
		var i,j;
		if(this.undoAvailable === true)
		{
			DD.UpdateDivStructure(this.DragSourcePreviousStateList);

			if(this.m_dsList.length > 0)
			{
				for(i=0; i<this.m_dsList.length; ++i)
				{
					var currState = this.DragSourceCurrentStateList[this.DSMap[this.m_dsList[i].n]];
					var prevState = this.DragSourcePreviousStateList[this.DSMap[this.m_dsList[i].n]];

					var prevDropTargetId = currState.DropTargetId;
					var currDropTargetId = prevState.DropTargetId;

					var dslmsobj = this.DSLMSMap[this.m_dsList[i].n];

					if(prevDropTargetId === null && currDropTargetId === null)
					{
						if(dslmsobj)
						{
							var frameset = document.getElementById(this.m_dsList[i].n);
							dslmsobj.posleft = frameset.style.left;
							dslmsobj.postop = frameset.style.top;
							dslmsobj.currentDTID = null;
							dslmsobj.previousDTID = null;
						}
					}
					if(prevDropTargetId === currDropTargetId)
						continue;

					if(  prevDropTargetId )
					{
						for(j = 0; j < this.DTMap[prevDropTargetId].acceptedDragSources.length; ++j )
						{
							if( this.DTMap[prevDropTargetId].acceptedDragSources[j] === this.m_dsList[i].n )
							{
								this.DTMap[prevDropTargetId].acceptedDragSources.splice(j,1);
								break;
							}
						}
						for(j = 0; j < this.DTMap[prevDropTargetId].acceptedSourceObjects.length; ++j )
						{
							if( this.DTMap[prevDropTargetId].acceptedSourceObjects[j].objectID === this.m_dsList[i].n )
							{
								this.DTMap[prevDropTargetId].acceptedSourceObjects.splice(j,1);
								break;
							}
						}
					}
					if(  currDropTargetId )
					{
						this.DTMap[currDropTargetId].acceptedDragSources.push(this.m_dsList[i].n);
						this.DTMap[currDropTargetId].acceptedSourceObjects.push(this.DSLMSMap[this.m_dsList[i].n]);
						this.DTLMSList.push(this.DTMap[currDropTargetId]);
						if(dslmsobj)
						{
							dslmsobj.posleft = null;
							dslmsobj.postop = null;
							dslmsobj.currentDTID = currDropTargetId;
							dslmsobj.previousDTID = prevDropTargetId;
						}
					}
					else
					{
						
						if(dslmsobj)
						{
							var frameset = document.getElementById(this.m_dsList[i].n);
							dslmsobj.posleft = frameset.style.left;
							dslmsobj.postop = frameset.style.top;
							dslmsobj.currentDTID = null;
							dslmsobj.previousDTID = prevDropTargetId;
						}
					}
				}
				
			}
			this.UpdateDragSourceCurrentStatePropertiesObjects(this.DragSourcePreviousStateList);



			if(this.m_dsList.length > 0)
			{
				for(i=0; i<this.m_dsList.length; ++i)
				{
					var dsID = this.m_dsList[i].n;
					var currState = this.DragSourceCurrentStateList[this.DSMap[this.m_dsList[i].n]];
					var currDropTargetId = currState.DropTargetId;
					dsDiv = document.getElementById(dsID);
					var canRedragSource = DD.getAttribute(this.m_elId, 'reds');
					if(currDropTargetId == null || ((currDropTargetId!==null)&&canRedragSource))
					{
						if(cp.device == cp.IDEVICE)
						{
							dsDiv.ontouchstart = this.ItemOnMouseDown;
						}
						else
						{
							dsDiv.onmousedown = this.ItemOnMouseDown;
						}
				
						if( DD.getAttribute(this.m_elId, 'hc') === true && cp.device != cp.IDEVICE)
						{
							dsDiv.onmouseover = this.ItemOnMouseOver;
							dsDiv.onmouseout = this.ItemOnMouseOut;
						}
					}
				}
			}

			this.DTLMSList.pop();
			this.m_attemptedAnswerString.pop();

			this.undoAvailable = false;
		}
	};

	DD.Interaction.prototype.OnResetButtonClicked = function()
	{
		if(this.resetAvailable === true)
		{
		DD.UpdateDivStructure(this.DragSourceInitialStateList);

		this.UpdateDragSourceCurrentStatePropertiesObjects(this.DragSourceInitialStateList);

		DD.ClearDragSourcePropertiesList(this.DragSourcePreviousStateList);

		if(this.m_dsList.length > 0)
		{
			for( var i=0; i<this.m_dsList.length; ++i)
			{
				var dsID = this.m_dsList[i].n;
				dsDiv = document.getElementById(dsID);
				if(cp.device == cp.IDEVICE)
				{
					dsDiv.ontouchstart = this.ItemOnMouseDown;
				}
				else
				{
					dsDiv.onmousedown = this.ItemOnMouseDown;
				}
				
				if( DD.getAttribute(this.m_elId, 'hc') === true && cp.device != cp.IDEVICE)
				{
					dsDiv.onmouseover = this.ItemOnMouseOver;
					dsDiv.onmouseout = this.ItemOnMouseOut;
				}

				var dslmsobj = this.DSLMSMap[this.m_dsList[i].n];
				if(dslmsobj)
				{
					dslmsobj.posleft = null;
					dslmsobj.postop = null;
					dslmsobj.currentDTID = null;
					dslmsobj.previousDTID = null;
				}
			}
		}

		for( var j = 0; j < this.m_dtList.length; ++j)
			{
				var dtObj = this.DTMap[this.m_dtList[j].n];
				if(dtObj)
				{
					dtObj.acceptedDragSources.length = 0;
					dtObj.acceptedSourceObjects.length = 0;
				}
			}

		this.clearAnswerList();
		this.DTLMSList = [];
		this.resetAvailable = false;
		this.undoAvailable = false;
	}
	};

	DD.Interaction.prototype.ResetEverythingOnFailure = function()
	{
		this.OnResetButtonClicked();
	};

	DD.Interaction.prototype.ResetOnlyInCorrectOnFailure = function()
	{

	};

	DD.Interaction.prototype.CheckIfCorrect = function()
	{
		var correctAnsList = DD.getAttribute(this.m_elId, 'cal');
		if( (correctAnsList === undefined) || (correctAnsList === null) || (correctAnsList.length <= 0) )
		{
			var attemptedAnswer = this.convertAnswerListToString(true);
			if(attemptedAnswer === "" )
				return cp.QuestionStatusEnum.CORRECT;
			else
				return cp.QuestionStatusEnum.INCORRECT;
		}
		for( var i = 0; i < correctAnsList.length; ++i )
		{
			var correctAns = correctAnsList[i];
			var isCorrect = this.checkCorrectAnswers(correctAns.a, correctAns.isSeq);
			if( isCorrect )
				return cp.QuestionStatusEnum.CORRECT;
		}
		return cp.QuestionStatusEnum.INCORRECT;
	};

	DD.Interaction.prototype.DoOnDropTargetAccepts = function( dtID )
	{
		this.ShowDropTargetAcceptCaption(dtID);
		this.PerformOnDropActions(dtID);
		this.SetRedrag();
		this.CheckAutoSubmit();
	};

	DD.Interaction.prototype.SetRedrag = function()
	{
		var redrag = DD.getAttribute(this.m_elId, 'reds');
		if(!redrag)
		{
			dsFrameset = document.getElementById(this.m_DsFrameSetDataID);
			if(cp.device == cp.IDEVICE)
			{
				dsFrameset.ontouchstart = null;
			}
			else
			{
				dsFrameset.onmousedown = null;
				dsFrameset.onmouseover = null;
				dsFrameset.onmouseout = null;
			}
		}
	};

	DD.Interaction.prototype.DoOnDropTargetRejects = function( dtID )
	{
		this.ShowDropTargetRejectCaption( dtID );
	};

	DD.Interaction.prototype.ShowDropTargetAcceptCaption = function( dtID )
	{
		var dtObj = this.GetDTObjFromDTID(dtID);
		if( dtObj === null )
			return;
		var successCaptionToBeShown = dtObj.osct; 
		var successCaption = dtObj.osc; 
		var showfeedback = true;

        if (successCaption === undefined)
           showfeedback = false;

		if ((successCaption !== undefined) && (successCaption.length < 2))
			showfeedback = false;

		var feedback = null;
		if (showfeedback)
		{
			feedback = new cp.Feedback(successCaption, null, false, cp.FeedbackType.SUCCESS, null);
			feedback.show();
		}
		return true;		
	};

	DD.Interaction.prototype.ShowDropTargetRejectCaption = function( dtID )
	{
		var dtObj = this.GetDTObjFromDTID(dtID);
		if( dtObj === null )
			return;
		var rejectCaptionToBeShown = dtObj.ofct; 
		var rejectCaption = dtObj.ofc; 
		var showfeedback = true;

        if (rejectCaption === undefined)
           showfeedback = false;

		if ((rejectCaption !== undefined) && (rejectCaption.length < 2))
			showfeedback = false;

		var feedback = null;
		if (showfeedback)
		{
			feedback = new cp.Feedback(rejectCaption, null, false, cp.FeedbackType.FAILURE, null);
			feedback.show();
		}
		return true;		
	};

	DD.Interaction.prototype.ShowInteractionFailureCaption = function()
	{
		var failureCaptionToBeShown = DD.getAttribute(this.m_elId, 'ofct'); 
		var failureCaption = DD.getAttribute(this.m_elId, 'ofc'); 
		var showfeedback = true;

        if (failureCaption === undefined)
           showfeedback = false;

		if ((failureCaption !== undefined) && (failureCaption.length < 2))
			showfeedback = false;

		var feedback = null;
		if (showfeedback)
		{
			feedback = new cp.Feedback(failureCaption, null, false, cp.FeedbackType.FAILURE, null);
			feedback.show();
		}
		return true;		
	};

	DD.Interaction.prototype.SetDsFramesetAndCanvasDivPos = function( dsFramesetID, inX, inY)
	{
		var dsFrameset = document.getElementById(dsFramesetID);
		var dsCanvas = document.getElementById(cp.model.data[dsFramesetID].mdi);
		var dsDiv = dsCanvas.parentElement;

		var originalDSFsLeft = parseFloat(dsFrameset.style.left);
		var originalDSFsTop = parseFloat(dsFrameset.style.top);
		dsFrameset.style.left = inX + "px";
		dsFrameset.style.top = inY + "px";
		dsDiv.style.left = (parseFloat(dsFrameset.style.left) - ( originalDSFsLeft - parseFloat(dsDiv.style.left) )) + "px";
		dsDiv.style.top = (parseFloat(dsFrameset.style.top) - ( originalDSFsTop - parseFloat(dsDiv.style.top) )) + "px";

		var newDivStruct = new DD.CustomDivStruct();
		newDivStruct.posleft = dsDiv.style.left;
		newDivStruct.postop = dsDiv.style.top;
		var oldDivStruct = this.DragSourceCurrentStateList[this.DSMap[dsFramesetID]].divStruct;
		if(oldDivStruct)
		{
			newDivStruct.Width = oldDivStruct.Width;
			newDivStruct.Height = oldDivStruct.Height;
		}
		DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetID]], null,
			dsFrameset.style.left, dsFrameset.style.top, null, null, null,newDivStruct,null);
	};


	DD.Interaction.prototype.appendDivAsChildOfAnotherDiv = function(dtFrameSetID,dsFramesetID)
	{
		// Snap behaviour size
		this.SetSnapSize(dtFrameSetID, dsFramesetID);

		// Snap behaviour position
		this.SetSnapPosition( dtFrameSetID, dsFramesetID ); //do the below inside func
		var prevDropTargetFsId = this.DragSourceCurrentStateList[this.DSMap[this.m_DsFrameSetDataID]].DropTargetId;
		if(prevDropTargetFsId)
		{
			var prevDtModelObj = this.GetDTObjFromDTID( prevDropTargetFsId );
			var snapPosType = prevDtModelObj.sbp;
			if(	snapPosType == 	DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingTop ||
				snapPosType ==	DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingBottom ||
				snapPosType ==	DD.SnapBehaviourPos.kCPSBPTileBottomTopStartingLeft ||
				snapPosType ==	DD.SnapBehaviourPos.kCPSBPTileTopBottomStartingLeft )
			{
				this.SetSnapPosition( prevDropTargetFsId, null );
			}
		}


		// Snap behaviour opacity
		var dtModelObj = this.GetDTObjFromDTID( dtFrameSetID );
		if(dtModelObj)
		{
			var dsCanvas = document.getElementById(cp.model.data[dsFramesetID].mdi);
			dsCanvas.style.opacity = dtModelObj.sbo/100;
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetID]], null, null, null, null, null,
				dsCanvas.style.opacity,null,null);
		}

		// Snap behaviour depth
		this.SetSnapDepth( dtFrameSetID,dsFramesetID );

		this.PlaySnapBehaviourAudio(dtFrameSetID);
	};

	DD.Interaction.prototype.PlaySnapBehaviourAudio = function(dtFrameSetID)
	{
		var dtModelObj = this.GetDTObjFromDTID( dtFrameSetID );
		if(!dtModelObj)
			return;
		var sbaData = dtModelObj.sba;
		if(!sbaData)
			return;
		var sba = this.m_DTtoSnapBehaviourAudioMap[dtFrameSetID];
		if(sba)
		{
			cp.playAudio(sba, false);
		}
	};

	DD.Interaction.prototype.SetSnapDepth = function(dtFramesetID, dsFramesetID)
	{
		var dtModelObj = this.GetDTObjFromDTID( dtFramesetID );
		if(!dtModelObj)
			return;
		var snapSizeDepth = dtModelObj.sbd;

		var curDtFsDepth = null;
		var curDsFsDepth = null;

		var refFrameset = null;
		if( this.DTMap[dtFramesetID].acceptedDragSources.length )
		{
			refFrameset = document.getElementById(this.DTMap[dtFramesetID].acceptedDragSources[this.DTMap[dtFramesetID].acceptedDragSources.length - 1]);
		}
		else
		{
			refFrameset = document.getElementById(dtFramesetID);
		}
		var refDiv = document.getElementById(cp.model.data[refFrameset.id].mdi).parentElement;
		var dsFrameset = document.getElementById(dsFramesetID);
		var dsDiv = document.getElementById(cp.model.data[dsFramesetID].mdi).parentElement;

		var frameSetsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');

		for(var i=1;i<frameSetsOnSlide.length;++i)
		{
			var framesetId = frameSetsOnSlide[i].id;
			if( framesetId === dtFramesetID )
				curDtFsDepth = i;
			if( framesetId === dsFramesetID )
				curDsFsDepth = i;
			if( curDtFsDepth !== null && curDsFsDepth !== null )
				break;
		}

		if( snapSizeDepth === 0 ) // front
		{
			refFrameset.parentNode.insertBefore(dsFrameset, refFrameset.nextSibling);
			refDiv.parentNode.insertBefore(dsDiv, refDiv.nextSibling);
		}
		else if( snapSizeDepth === 1 )
		{
			refFrameset.parentNode.insertBefore(dsFrameset, refFrameset);
			refDiv.parentNode.insertBefore(dsDiv, refDiv);
		}
		var frameSetsOnSlide = document.getElementById('div_Slide').getElementsByClassName('cp-frameset');

		for(var j=1;j<frameSetsOnSlide.length;++j)
		{
			var framesetId = frameSetsOnSlide[j].id;
			if(this.DSMap[framesetId] !== undefined && this.DSMap[framesetId] !== null)
			{
				DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[framesetId]], j-1, null, null, null,null, null, null, null);
			}
		}


	};

	DD.Interaction.prototype.SetSnapSize = function(dtFramesetID, dsFramesetID)
	{
		var dtModelObj = this.GetDTObjFromDTID( dtFramesetID );
		if(!dtModelObj)
			return;
		if(!this.m_dragSourceCanvas)
			return;

		var dsDiv = this.m_dragSourceCanvas.parentElement;
		var snapSizePercent = dtModelObj.sbs;

		var initialState = this.DragSourceInitialStateList[this.DSMap[dsFramesetID]];
		var initialFSWidth = initialState.Width;
		var initialFSHeight = initialState.Height;

		// change div size
		dsDiv.style.width = (parseFloat(initialState.divStruct.Width)*snapSizePercent/100) + "px";
		dsDiv.style.height = (parseFloat(initialState.divStruct.Height)*snapSizePercent/100) + "px";

		// change canvas size
		var oldWidth = parseFloat(initialState.canvasStruct.Width);
		var newWidth = oldWidth*snapSizePercent/100;
		var oldHeight = parseFloat(initialState.canvasStruct.Height);
		var newHeight = oldHeight*snapSizePercent/100;
		this.m_dragSourceCanvas.style.width = newWidth + "px";
		this.m_dragSourceCanvas.style.height = newHeight + "px";
		this.m_dragSourceCanvas.style.marginLeft = (parseFloat(initialState.canvasStruct.MarginLeft)*snapSizePercent/100) + "px";
		this.m_dragSourceCanvas.style.marginTop = (parseFloat(initialState.canvasStruct.MarginTop)*snapSizePercent/100) + "px";

		var newDivStruct = new DD.CustomDivStruct();
		var newCanvasStruct = new DD.CustomCanvasStruct();

		var oldDivStruct = this.DragSourceCurrentStateList[this.DSMap[dsFramesetID]].divStruct;
		if(oldDivStruct)
		{
			newDivStruct.posleft = oldDivStruct.posleft;
			newDivStruct.postop = oldDivStruct.postop;
		}
		else
		{
			var framesetDiv = document.getElementById(dsFramesetID);
			newDivStruct.posleft = framesetDiv.style.left;
			newDivStruct.postop = framesetDiv.style.top;
		}
		newDivStruct.Width = newWidth + "px";
		newDivStruct.Height = newHeight + "px";

		var oldCanvasStruct = this.DragSourceCurrentStateList[this.DSMap[dsFramesetID]].canvasStruct;
		if(oldCanvasStruct)
		{
			newCanvasStruct.posleft = oldCanvasStruct.posleft;
			newCanvasStruct.postop = oldCanvasStruct.postop;
		}
		else
		{
			newCanvasStruct.posleft = this.m_dragSourceCanvas.style.left;
			newCanvasStruct.posleft = this.m_dragSourceCanvas.style.top;
		}
		newCanvasStruct.Width = newWidth + "px";
		newCanvasStruct.Height = newHeight + "px";
		newCanvasStruct.MarginTop = this.m_dragSourceCanvas.style.marginTop;
		newCanvasStruct.MarginLeft = this.m_dragSourceCanvas.style.marginLeft;

		DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetID]], null, null, null, null,
		null, null,newDivStruct,newCanvasStruct);

		var dsFrameset = document.getElementById(dsFramesetID);
		if( dsFrameset )
		{
			newWidth = (parseFloat(initialFSWidth)*snapSizePercent/100);
			newHeight = (parseFloat(initialFSHeight)*snapSizePercent/100);
			dsFrameset.style.width = newWidth + "px";
			dsFrameset.style.height = newHeight + "px";
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dsFramesetID]], null, null, null,
			dsFrameset.style.width, dsFrameset.style.height, null, null, null);
		}
	};

	DD.Interaction.prototype.SetSnapPosition = function( dtFramesetID, dsFramesetID )
	{
		var dtFrameset = document.getElementById(dtFramesetID);
		var dtModelObj = this.GetDTObjFromDTID( dtFramesetID );
		if(!dtFrameset || !dtModelObj)
			return retVal;

		var dtFsX = parseFloat(dtFrameset.style.left);
		var dtFsY = parseFloat(dtFrameset.style.top);
		var dtFsWidth = parseFloat(dtFrameset.style.width);
		var dtFsHeight = parseFloat(dtFrameset.style.height);

		var dsFs = null, dsFsWidth = 0, dsFsHeight = 0;
		if( dsFramesetID )
		{
			dsFs = document.getElementById(dsFramesetID);
			dsFsWidth = parseFloat(dsFs.style.width);
			dsFsHeight = parseFloat(dsFs.style.height);
		}

		var dtObj = this.DTMap[dtFramesetID];

		var x,y,i,j;

		var snapPosType = dtModelObj.sbp;

		var curDsFsId = null,curDsFrameset = null,prevDsFsId = null,prevDsFrameset = null;
		var curDsFsWidth,curDsFsHeight,maxHeight,curHeight;
		var prevDsFsX,prevDsFsY,prevDsFsWidth,prevDsFsHeight,curDsFsX,curDsFsY;

		switch(snapPosType)
		{
			case DD.SnapBehaviourPos.kCPSBPNone: // the drag dourse stays where it is dropped
				{
					//x = parseFloat(this.m_dummyCanvas.element.style.left);
					//y = parseFloat(this.m_dummyCanvas.element.style.top);
					x = this.m_tempFrameSetPos.x;
					y = this.m_tempFrameSetPos.y;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAbsolute: // the drag source is snapped to the specified X and Y
				{
					//x = parseFloat(this.m_dummyCanvas.element.style.left);
					//y = parseFloat(this.m_dummyCanvas.element.style.top);
					x = this.m_tempFrameSetPos.x;
					y = this.m_tempFrameSetPos.y;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
					// x = dtModelObj.sbpx + dtFsX;
					// y = dtModelObj.sbpy + dtFsY;
					// this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorTopLeft:
				{
					x = dtFsX;
					y = dtFsY;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorTopCenter:
				{
					x = dtFsX + dtFsWidth/2 - dsFsWidth/2;
					y = dtFsY;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorTopRight:
				{
					x = dtFsX + dtFsWidth - dsFsWidth;
					y = dtFsY;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorCenterLeft:
				{
					x = dtFsX;
					y = dtFsY + dtFsHeight/2 - dsFsHeight/2;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorCenterCenter:
				{
					x = dtFsX + dtFsWidth/2 - dsFsWidth/2;
					y = dtFsY + dtFsHeight/2 - dsFsHeight/2;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorCenterRight:
				{
					x = dtFsX + dtFsWidth - dsFsWidth;
					y = dtFsY + dtFsHeight/2 - dsFsHeight/2;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorBottomLeft:
				{
					x = dtFsX;
					y = dtFsY + dtFsHeight - dsFsHeight;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorBottomCenter:
				{
					x = dtFsX + dtFsWidth/2 - dsFsWidth/2;
					y = dtFsY + dtFsHeight - dsFsHeight;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorBottomRight:
				{
					x = dtFsX + dtFsWidth - dsFsWidth;
					y = dtFsY + dtFsHeight - dsFsHeight;
					this.SetDsFramesetAndCanvasDivPos( dsFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPStackHorizonatally:
				{
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPStackVertically:
				break;
			case DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingTop:
				{
					for( i = 0; i <= dtObj.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						if( i !== dtObj.acceptedDragSources.length)
						{
							curDsFsId = dtObj.acceptedDragSources[i];
						}
						else
						{
							curDsFsId = dsFramesetID;
						}
						if( !curDsFsId )
							continue;
						curDsFrameset = document.getElementById(curDsFsId);
						if( i !== 0 )
						{
							prevDsFsId = dtObj.acceptedDragSources[i-1];
						}
						if( prevDsFsId )
							prevDsFrameset = document.getElementById(prevDsFsId);

						curDsFsWidth = parseFloat(curDsFrameset.style.width);
						curDsFsHeight = parseFloat(curDsFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(curDsFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(prevDsFrameset)
						{
							prevDsFsX = parseFloat(prevDsFrameset.style.left);
							prevDsFsY = parseFloat(prevDsFrameset.style.top);
							prevDsFsWidth = parseFloat(prevDsFrameset.style.width);
							prevDsFsHeight = parseFloat(prevDsFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(prevDsFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (prevDsFrameset !== null) ? prevDsFsX + prevDsFsWidth : dtFsX;
						curDsFsY = (prevDsFrameset !== null) ? prevDsFsY : dtFsY;
						if( prevDsFrameset!== null && (curDsFsX + curDsFsWidth) > (dtFsX + dtFsWidth) )
						{
							maxHeight = prevDsFsHeight;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dtObj.acceptedDragSources[j]);
								var acceptedDragSourceTop = parseFloat(acceptedDragSource.style.top);
								if( prevDsFsY === acceptedDragSourceTop )
								{
									curHeight = parseFloat(acceptedDragSource.style.height);
									maxHeight = (curHeight > maxHeight) ? curHeight : maxHeight;
								}
								else
								{
									break;
								}

							}
							curDsFsX = dtFsX;
							curDsFsY = (prevDsFrameset !== null) ? prevDsFsY + maxHeight : dtFsY;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( curDsFsId, curDsFsX, curDsFsY);
					}
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingBottom:
				{
					for( i = 0; i <= dtObj.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						curDsFsId = null;
						curDsFrameset = null;
						prevDsFsId = null;
						prevDsFrameset = null;
						if( i !== dtObj.acceptedDragSources.length)
						{
							curDsFsId = dtObj.acceptedDragSources[i];
						}
						else
						{
							curDsFsId = dsFramesetID;
						}
						if( !curDsFsId )
							continue;
						curDsFrameset = document.getElementById(curDsFsId);
						if( i !== 0 )
						{
							prevDsFsId = dtObj.acceptedDragSources[i-1];
						}
						if( prevDsFsId )
							prevDsFrameset = document.getElementById(prevDsFsId);

						curDsFsWidth = parseFloat(curDsFrameset.style.width);
						curDsFsHeight = parseFloat(curDsFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(curDsFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(prevDsFrameset)
						{
							prevDsFsX = parseFloat(prevDsFrameset.style.left);
							prevDsFsY = parseFloat(prevDsFrameset.style.top);
							prevDsFsWidth = parseFloat(prevDsFrameset.style.width);
							prevDsFsHeight = parseFloat(prevDsFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(prevDsFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (prevDsFrameset !== null) ? prevDsFsX + prevDsFsWidth: dtFsX;
						curDsFsY = (prevDsFrameset !== null) ? prevDsFsY + prevDsFsHeight - curDsFsHeight : dtFsY + dtFsHeight - curDsFsHeight;
						if( prevDsFrameset !== null && ((curDsFsX + curDsFsWidth) > (dtFsX + dtFsWidth)) )
						{
							maxHeight = prevDsFsHeight;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dtObj.acceptedDragSources[j]);
								var acceptedDragSourceBottom = parseFloat(acceptedDragSource.style.top) + parseFloat(acceptedDragSource.style.height);
								if( ( prevDsFsY + prevDsFsHeight ) === acceptedDragSourceBottom )
								{
									curHeight = parseFloat(acceptedDragSource.style.height);
									maxHeight = (curHeight > maxHeight) ? curHeight : maxHeight;
								}
								else
								{
									break;
								}

							}
							curDsFsX = dtFsX;
							curDsFsY = (prevDsFrameset !== null) ? prevDsFsY + prevDsFsHeight - maxHeight - curDsFsHeight : dtFsHeight - curDsFsHeight;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( curDsFsId, curDsFsX, curDsFsY);
					}
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPTileBottomTopStartingLeft:
				{
					for( i = 0; i <= dtObj.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						curDsFsId = null;
						curDsFrameset = null;
						prevDsFsId = null;
						prevDsFrameset = null;
						if( i !== dtObj.acceptedDragSources.length)
						{
							curDsFsId = dtObj.acceptedDragSources[i];
						}
						else
						{
							curDsFsId = dsFramesetID;
						}
						if( !curDsFsId )
							continue;
						curDsFrameset = document.getElementById(curDsFsId);
						if( i !== 0 )
						{
							prevDsFsId = dtObj.acceptedDragSources[i-1];
						}
						if( prevDsFsId )
							prevDsFrameset = document.getElementById(prevDsFsId);

						curDsFsWidth = parseFloat(curDsFrameset.style.width);
						curDsFsHeight = parseFloat(curDsFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(curDsFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(prevDsFrameset)
						{
							prevDsFsX = parseFloat(prevDsFrameset.style.left);
							prevDsFsY = parseFloat(prevDsFrameset.style.top);
							prevDsFsWidth = parseFloat(prevDsFrameset.style.width);
							prevDsFsHeight = parseFloat(prevDsFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(prevDsFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (prevDsFrameset !== null) ? prevDsFsX : dtFsX;
						curDsFsY = (prevDsFrameset !== null) ? prevDsFsY - curDsFsHeight : dtFsY + dtFsHeight - curDsFsHeight;
						if( prevDsFrameset !== null && curDsFsY < dtFsY )
						{
							maxWidth = prevDsFsWidth;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dtObj.acceptedDragSources[j]);
								var acceptedDragSourceLeft = parseFloat(acceptedDragSource.style.left);
								if( prevDsFsX === acceptedDragSourceLeft )
								{
									curWidth = parseFloat(acceptedDragSource.style.width);
									maxWidth = (curWidth > maxWidth) ? curWidth : maxWidth;
								}
								else
								{
									break;
								}

							}
							curDsFsX = (prevDsFrameset !== null) ? prevDsFsX + maxWidth : dtFsX;
							curDsFsY = dtFsY + dtFsHeight - curDsFsHeight;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( curDsFsId, curDsFsX, curDsFsY);
					}
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPTileTopBottomStartingLeft:
				{
					for( i = 0; i <= dtObj.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						curDsFsId = null;
						curDsFrameset = null;
						prevDsFsId = null;
						prevDsFrameset = null;
						if( i !== dtObj.acceptedDragSources.length)
						{
							curDsFsId = dtObj.acceptedDragSources[i];
						}
						else
						{
							curDsFsId = dsFramesetID;
						}
						if( !curDsFsId )
							continue;
						curDsFrameset = document.getElementById(curDsFsId);
						if( i !== 0 )
						{
							prevDsFsId = dtObj.acceptedDragSources[i-1];
						}
						if( prevDsFsId )
							prevDsFrameset = document.getElementById(prevDsFsId);

						curDsFsWidth = parseFloat(curDsFrameset.style.width);
						curDsFsHeight = parseFloat(curDsFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(curDsFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(prevDsFrameset)
						{
							prevDsFsX = parseFloat(prevDsFrameset.style.left);
							prevDsFsY = parseFloat(prevDsFrameset.style.top);
							prevDsFsWidth = parseFloat(prevDsFrameset.style.width);
							prevDsFsHeight = parseFloat(prevDsFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(prevDsFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (prevDsFrameset !== null) ? prevDsFsX : dtFsX;
						curDsFsY = (prevDsFrameset !== null) ? prevDsFsY + prevDsFsHeight : dtFsY;
						var curWidth,maxWidth;
						if( prevDsFrameset !== null && ((curDsFsY + curDsFsHeight) > (dtFsY + dtFsHeight)) )
						{
							var maxWidth = prevDsFsWidth;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dtObj.acceptedDragSources[j]);
								var acceptedDragSourceLeft = parseFloat(acceptedDragSource.style.left);
								if( prevDsFsX === acceptedDragSourceLeft )
								{
									curWidth = parseFloat(acceptedDragSource.style.width);
									maxWidth = (curWidth > maxWidth) ? curWidth : maxWidth;
								}
								else
								{
									break;
								}

							}
							curDsFsX = (prevDsFrameset !== null) ? prevDsFsX + maxWidth : dtFsX ;
							curDsFsY = dtFsY;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( curDsFsId, curDsFsX, curDsFsY);
					}
				}
				break;
			default:
					retVal.x = dtDivX;
					retVal.y = dtDivY;
				break;
		}
	};
					
	DD.Interaction.prototype.ReturnDragSourceAnimationCallback = function()
	{
		var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
		if( ddInt === null )
			return;
		if( ddInt.m_dragSourceCanvas && ddInt.m_dummyCanvas)
		{
			ddInt.m_dragSourceCanvas.style.visibility = 'visible';

			ddInt.deleteDummyCanvas();
			ddInt.m_dragSourceCanvas = null;
			ddInt.m_dummyCanvas = null;
		}
	};
					
	DD.Interaction.prototype.AnimateObjectGliding = function (element,initialState,finalState,time, callbackFunc)
	{
		var ddInt = DD.CurrInteractionManager.m_ActiveInteraction;
		if( ddInt === null )
			return;
		var xIndent = 0, yIndent = 0, wIndent = 0, hIndent = 0, opacIndent = 0;
		if( initialState.x !== null && initialState.x !== undefined && finalState.x !== undefined && finalState.x !== null )
		{
			xIndent = (finalState.x - initialState.x)/time;
		}
		if( initialState.y !== null && initialState.y !== undefined && finalState.y !== undefined && finalState.y !== null )
		{
			yIndent = (finalState.y - initialState.y)/time;
		}
		if( initialState.w !== null && initialState.w !== undefined && finalState.w !== undefined && finalState.w !== null )
		{
			wIndent = (finalState.w - initialState.w)/time;
		}
		if( initialState.h !== null && initialState.h !== undefined && finalState.h !== undefined && finalState.h !== null )
		{
			hIndent = (finalState.h - initialState.h)/time;
		}
		if( initialState.opac !== null && initialState.opac !== undefined && finalState.opac !== undefined && finalState.opac !== null )
		{
			opacIndent = (finalState.opac - initialState.opac)/time;
		}
		function timeoutFunc()
		{
			if(time === 0)
			{
				if(callbackFunc)
					callbackFunc.call();
				return;
			}
			if(xIndent !== 0)
				element.style.left = parseFloat(element.style.left) + xIndent + 'px';
			if(yIndent !== 0)
				element.style.top = parseFloat(element.style.top) + yIndent + 'px';
			if(wIndent !== 0)
				element.style.width = parseFloat(element.style.width) + wIndent + 'px';
			if(hIndent !== 0)
				element.style.height = parseFloat(element.style.height) + hIndent + 'px';
			if(opacIndent !== 0)
			{
				if( element.style.opacity === "" )
					element.style.opacity = 1 + opacIndent;
				else
					element.style.opacity = parseFloat(element.style.opacity) + opacIndent;
			}
			time = time -1;
			setTimeout(timeoutFunc,20);
					
		}
		setTimeout(timeoutFunc,20);
	};
	DD.Interaction.prototype.convertAnswerListToString = function(isSequence)
	{
		var answerList = this.m_attemptedAnswerString;
		var answerString = "";
		var i=0,j;
		if(isSequence)
		{
			while(i<answerList.length)
			{
				answerString += answerList[i];
				++i;
			}	
		}
		else
		{
			var sortedDSTypes = [];
			var prevDtTypeName = null;
			var curDtTypeName = null;
			for( i = 0; i < this.m_dtList.length; ++i)
			{
				var dtModelObj = this.GetDTObjFromDTID(this.m_dtList[i].n);
				prevDtTypeName = curDtTypeName;
				curDtTypeName = dtModelObj.t;
				if(prevDtTypeName===null || prevDtTypeName === curDtTypeName)
				{

				}
				else
				{
					sortedDSTypes.sort();
					for(j = 0; j < sortedDSTypes.length; ++j)
					{
						answerString = answerString + "t:" + sortedDSTypes[j] + "-t:" + this.m_dtList[i-1].t;
					}
					sortedDSTypes = [];
				}
				var dtObj = this.DTMap[this.m_dtList[i].n];
				if(dtObj)
				{
					var acceptedSrcs = dtObj.acceptedDragSources;
					for(j = 0; j < acceptedSrcs.length; ++j)
					{
						var dsModelObj = this.GetDSObjFromDSID(acceptedSrcs[j]);
						sortedDSTypes.push(dsModelObj.t);
					}
				}
			}
			sortedDSTypes.sort();
			for(j = 0; j < sortedDSTypes.length; ++j)
			{
				answerString = answerString + "t:" + sortedDSTypes[j] + "-t:" + this.m_dtList[this.m_dtList.length-1].t;
			}
		}
		return answerString;
	};

	DD.Interaction.prototype.getSuspendData = function()
	{
		return m_StoredSuspendDataString;
	};

	DD.Interaction.prototype.storeSuspendData = function()
	{
		var lState = new cp.QuizState();
		lState.init();
		lState.writeNumber(this.DTLMSList.length);
		var i,j,dragSourceModelObject, dsItemData,dsCanvasData;
		var modelLeft,modelTop;
		var dslmsobj;
		var handledSources = {};
		for(i = 0;i< this.DTLMSList.length; ++i)
		{
			var dtlmsobj = this.DTLMSList[i];
			lState.writeString(dtlmsobj.objectID);
			lState.writeNumber(dtlmsobj.acceptedSourceObjects.length);
			var dtModelObj = this.GetDTObjFromDTID( dtlmsobj.objectID );
			var hasAbsolutePos = false;
			if(dtModelObj.sbp === DD.SnapBehaviourPos.kCPSBPAbsolute)
				hasAbsolutePos = true;
			for(j = 0; j< dtlmsobj.acceptedSourceObjects.length;++j)
			{
				dslmsobj = dtlmsobj.acceptedSourceObjects[j];
				lState.writeString(dslmsobj.objectID);
				handledSources[dslmsobj.objectID] = 1;
				if(hasAbsolutePos)
				{
					lState.writeNumber(parseFloat(dslmsobj.posleft));
					lState.writeNumber(parseFloat(dslmsobj.postop));
				}
			}
		}
		var numExtraDragSources = 0;
		for( i = 0; i < this.m_dsList.length; ++i)
		{
			if(handledSources[this.m_dsList[i].n] === 1)
				continue;
			dslmsobj = this.DSLMSMap[this.m_dsList[i].n];
			dsItemData = cp.model.data[this.m_dsList[i].n];
			dsCanvasData = cp.model.data[dsItemData.mdi];
			modelLeft = dsCanvasData.b[0];
			modelTop = dsCanvasData.b[1];
			if(dslmsobj.postop!==null && dslmsobj.posleft !== null)
			{
				if(parseFloat(dslmsobj.postop)!== modelTop|| parseFloat(dslmsobj.posleft) !== modelLeft)
				{
				numExtraDragSources = numExtraDragSources + 1;
				}
			}
		}
		lState.writeNumber(numExtraDragSources);
		for( i = 0; i < this.m_dsList.length; ++i)
		{
			if(handledSources[this.m_dsList[i].n] === 1)
				continue;
			dslmsobj = this.DSLMSMap[this.m_dsList[i].n];
			dsItemData = cp.model.data[this.m_dsList[i].n];
			dsCanvasData = cp.model.data[dsItemData.mdi];
			modelLeft = dsCanvasData.b[0];
			modelTop = dsCanvasData.b[1];
			if(dslmsobj.postop!==null && dslmsobj.posleft !== null)
			{
				if(parseFloat(dslmsobj.postop)!== modelTop|| parseFloat(dslmsobj.posleft) !== modelLeft)
				{
					lState.writeString(dslmsobj.objectID);
					lState.writeNumber(parseFloat(dslmsobj.posleft));
					lState.writeNumber(parseFloat(dslmsobj.postop));
				}
			}
		}
		this.m_StoredSuspendDataString = lState.m_state;//toString();

	};

	DD.Interaction.prototype.resumeInteraction = function()
	{
		//This function is called only when all the objects in the drag and drop
		//interaction have appeared on stage and registered themselves with the
		//interaction manager.
		this.resetAvailable = true;
		if(this.m_questionObj)
			this.m_CurrentAttempt = this.m_questionObj.currentAttempt;
		for( var k = 0; k < this.m_dtList.length; ++k)
			{
				var dtObj = this.DTMap[this.m_dtList[k].n];
				if(dtObj)
				{
					dtObj.acceptedDragSources = [];
					dtObj.acceptedSourceObjects = [];
				}
			}
		this.clearAnswerList();
		var targetCounter = {};
		if(this.m_StoredSuspendDataString.length > 0)
		{
			var lState = new cp.QuizState();
			lState.init();
			var i,j,dragSourceName,dslmsobj,left,top;
			lState.fromString(this.m_StoredSuspendDataString);
			//lState = unescape(lState);
			var numDropTargets = lState.readNumber();
			this.DTLMSList = [];
			//Modify positions of drag sources which have been accepted by a target
			for(i=0;i<numDropTargets;++i)
			{
				var dropTargetName = lState.readString();
				if(targetCounter[dropTargetName] === undefined)
					targetCounter[dropTargetName] = 0;
				var dtModelObj = this.GetDTObjFromDTID( dropTargetName );
				var hasAbsolutePos =(dtModelObj.sbp === DD.SnapBehaviourPos.kCPSBPAbsolute);
				var numDragSources = lState.readNumber();
					for(j=0;j<numDragSources;++j)
					{
						
							dragSourceName = lState.readString();
							left = null;
							top = null;
							if(hasAbsolutePos)
							{
								left = lState.readNumber();
								top = lState.readNumber();
							}
						if(j==targetCounter[dropTargetName])
						{
							this.resumeAppendDragSourceToDropTarget(dropTargetName,dragSourceName,hasAbsolutePos,left,top);
							var dtObj = this.GetDTObjFromDTID( dropTargetName );
							var dsObj = this.GetDSObjFromDSID( dragSourceName );
							this.appendToAnswerList(dsObj.t,dtObj.t);
							this.DragSourceCurrentStateList[this.DSMap[dragSourceName]].DropTargetId = dropTargetName;
							targetCounter[dropTargetName] += 1;
						}
					}
			}
			//Modify positions of drag sources which have just been moved around.
			var extraDragSourcesNum = lState.readNumber();
			for(i=0;i<extraDragSourcesNum;++i)
			{
				dragSourceName = lState.readString();
				dslmsobj = this.DSLMSMap[dragSourceName];
				left = lState.readNumber();
				top = lState.readNumber();
				dslmsobj.posleft = left;
				dslmsobj.postop = top;
				this.resumeChangePositionsOfDragSources(dragSourceName,left,top);
			}
		}
	};

	DD.Interaction.prototype.resumeAppendDragSourceToDropTarget = function(dropTargetFramesetID,dragSourceFramesetID,hasAbsolutePos,left,top)
	{
			var canRedragSource = DD.getAttribute(this.m_elId, 'reds');
			if(!canRedragSource)
			{
				var dragSourceFrameset = document.getElementById(dragSourceFramesetID);
				if(cp.device == cp.IDEVICE)
				{
					dragSourceFrameset.ontouchstart = null;
					dragSourceFrameset.ontouchmove = null;
					dragSourceFrameset.ontouchend = null;
				}
				else
				{
					dragSourceFrameset.onmousedown = null;
					dragSourceFrameset.onmouseover = null;
					dragSourceFrameset.onmouseout = null;
				}
			}

		this.resumeSetSnapSize(dragSourceFramesetID,dropTargetFramesetID);
		this.resumeSetSnapPosition(dragSourceFramesetID,dropTargetFramesetID,hasAbsolutePos,left,top);
		this.resumeSetSnapOpacity(dropTargetFramesetID,dragSourceFramesetID);
		this.SetSnapDepth(dropTargetFramesetID,dragSourceFramesetID);

		var dragSource = document.getElementById(dragSourceFramesetID);
		var dtlmsobj = this.DTMap[dropTargetFramesetID];
		dtlmsobj.acceptedDragSources.push(dragSourceFramesetID);
		dtlmsobj.acceptedSourceObjects.push(this.DSLMSMap[dragSourceFramesetID]);
		this.DSLMSMap[dragSourceFramesetID].posleft = dragSource.style.left;
		this.DSLMSMap[dragSourceFramesetID].postop = dragSource.style.top;
		this.DSLMSMap[dragSourceFramesetID].previousDTID = null;
		this.DSLMSMap[dragSourceFramesetID].currentDTID = dropTargetFramesetID;
		this.DTLMSList.push(this.DTMap[dropTargetFramesetID]);

		var dragSourceDiv = document.getElementById("re-"+dragSourceFramesetID+"c");
		dragSourceDiv.style.display = "none";
		dragSourceDiv.offsetHeight;
		dragSourceDiv.style.display = "block";
	};

	DD.Interaction.prototype.resumeSetSnapSize = function(dragSourceFramesetID,dropTargetFramesetID)
	{

		var dropTargetModelObject = this.GetDTObjFromDTID( dropTargetFramesetID );
		if(!dropTargetModelObject)
			return;

		var dragSourceDiv = document.getElementById("re-"+dragSourceFramesetID + "c");
		var canvas = document.getElementById(dragSourceFramesetID + "c");
		var snapSizePercent = dropTargetModelObject.sbs;

		// change div size
		dragSourceDiv.style.width = (parseFloat(dragSourceDiv.style.width)*snapSizePercent/100) + "px";
		dragSourceDiv.style.height = (parseFloat(dragSourceDiv.style.height)*snapSizePercent/100) + "px";

		// change canvas size
		var oldWidth = parseFloat(canvas.style.width);
		var newWidth = oldWidth*snapSizePercent/100;
		var oldHeight = parseFloat(canvas.style.height);
		var newHeight = oldHeight*snapSizePercent/100;
		canvas.style.width = newWidth + "px";
		canvas.style.height = newHeight + "px";
		canvas.style.marginLeft = (parseFloat(canvas.style.marginLeft)*snapSizePercent/100) + "px";
		canvas.style.marginTop = (parseFloat(canvas.style.marginTop)*snapSizePercent/100) + "px";

		var newDivStruct = this.DragSourceCurrentStateList[this.DSMap[dragSourceFramesetID]].divStruct;

		if(newDivStruct)
		{
			newDivStruct.Width = dragSourceDiv.style.width;
			newDivStruct.Height = dragSourceDiv.style.height;
		}
		var newCanvasStruct = this.DragSourceCurrentStateList[this.DSMap[dragSourceFramesetID]].canvasStruct;
		if(newCanvasStruct)
		{
			newCanvasStruct.Width = newWidth;
			newCanvasStruct.Height = newHeight;
			newCanvasStruct.MarginTop = canvas.style.marginTop;
			newCanvasStruct.MarginLeft = canvas.style.marginLeft;
		}

		DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dragSourceFramesetID]], null, null, null, null,
		null, null,newDivStruct,newCanvasStruct);

		var dragSourceFrameset = document.getElementById(dragSourceFramesetID);
		if( dragSourceFrameset )
		{
			newWidth = (parseFloat(dragSourceFrameset.style.width)*snapSizePercent/100);
			newHeight = (parseFloat(dragSourceFrameset.style.height)*snapSizePercent/100);
			dragSourceFrameset.style.width = newWidth + "px";
			dragSourceFrameset.style.height = newHeight + "px";
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dragSourceFramesetID]], null, null, null,
			newWidth, newHeight, null, null, null);
		}
	};

	DD.Interaction.prototype.resumeSetSnapPosition = function(dragSourceFramesetID,dropTargetFramesetID,hasAbsolutePos,dragSourceAbsoluteLeft,dragSourceAbsoluteTop)
	{
		var dropTargetFrameset = document.getElementById(dropTargetFramesetID);
		var dragSourceFrameset = document.getElementById(dragSourceFramesetID);
		var dropTargetModelObject = this.GetDTObjFromDTID( dropTargetFramesetID );
		if(!dropTargetFrameset || !dropTargetModelObject || !dragSourceFrameset)
			return;

		var dropTargetFramesetX = parseFloat(dropTargetFrameset.style.left);
		var dropTargetFramesetY = parseFloat(dropTargetFrameset.style.top);
		var dropTargetFramesetWidth = parseFloat(dropTargetFrameset.style.width);
		var dropTargetFramesetHeight = parseFloat(dropTargetFrameset.style.height);

		
		var dragSourceFramesetWidth = parseFloat(dragSourceFrameset.style.width);
		var dragSourceFramesetHeight = parseFloat(dragSourceFrameset.style.height);
		var dragSourceFramesetX = parseFloat(dragSourceFrameset.style.left);
		var dragSourceFramesetY = parseFloat(dragSourceFrameset.style.top); 

		var dropTargetLMSObject = this.DTMap[dropTargetFramesetID];

		var x,y,i,j;

		var snapPosType = dropTargetModelObject.sbp;

		var currentDragSourceFramesetID = null,currentDragSourceFrameset = null,
		previousDragSourceFramesetID = null,previousDragSourceFrameset = null;

		var curDsFsWidth,curDsFsHeight,maxHeight,curHeight;
		var prevDsFsX,prevDsFsY,prevDsFsWidth,prevDsFsHeight,curDsFsX,curDsFsY;

		switch(snapPosType)
		{
			case DD.SnapBehaviourPos.kCPSBPNone:
			case DD.SnapBehaviourPos.kCPSBPAbsolute:
					if(hasAbsolutePos)
					{
						x = dragSourceAbsoluteLeft;
						y = dragSourceAbsoluteTop;
					}
					else
					{
						x = dragSourceFramesetX;
						y = dragSourceFramesetY;
					}
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
					break;
			case DD.SnapBehaviourPos.kCPSBPAnchorTopLeft:
				{
					x = dropTargetFramesetX;
					y = dropTargetFramesetY;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorTopCenter:
				{
					x = dropTargetFramesetX + dropTargetFramesetWidth/2 - dragSourceFramesetWidth/2;
					y = dropTargetFramesetY;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorTopRight:
				{
					x = dropTargetFramesetX + dropTargetFramesetWidth - dsFsWidth;
					y = dropTargetFramesetY;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorCenterLeft:
				{
					x = dropTargetFramesetX;
					y = dropTargetFramesetY + dropTargetFramesetHeight/2 - dragSourceFramesetHeight/2;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorCenterCenter:
				{
					x = dropTargetFramesetX + dropTargetFramesetWidth/2 - dragSourceFramesetWidth/2;
					y = dropTargetFramesetY + dropTargetFramesetHeight/2 - dragSourceFramesetHeight/2;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorCenterRight:
				{
					x = dropTargetFramesetX + dropTargetFramesetWidth - dragSourceFramesetWidth;
					y = dropTargetFramesetY + dropTargetFramesetHeight/2 - dragSourceFramesetHeight/2;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorBottomLeft:
				{
					x = dropTargetFramesetX;
					y = dropTargetFramesetY + dropTargetFramesetHeight - dragSourceFramesetHeight;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorBottomCenter:
				{
					x = dropTargetFramesetX + dropTargetFramesetWidth/2 - dragSourceFramesetWidth/2;
					y = dropTargetFramesetY + dropTargetFramesetHeight - dragSourceFramesetHeight;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPAnchorBottomRight:
				{
					x = dropTargetFramesetX + dropTargetFramesetWidth - dragSourceFramesetWidth;
					y = dropTargetFramesetY + dropTargetFramesetHeight - dragSourceFramesetHeight;
					this.SetDsFramesetAndCanvasDivPos( dragSourceFramesetID, x, y);
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingTop:
				{
					for( i = 0; i <= dropTargetLMSObject.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						if( i !== dropTargetLMSObject.acceptedDragSources.length)
						{
							currentDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i];
						}
						else
						{
							currentDragSourceFramesetID = dragSourceFramesetID;
						}
						currentDragSourceFrameset = document.getElementById(currentDragSourceFramesetID);
						if( i !== 0 )
						{
							previousDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i-1];
						}
						if( previousDragSourceFramesetID )
							previousDragSourceFrameset = document.getElementById(previousDragSourceFramesetID);

						curDsFsWidth = parseFloat(currentDragSourceFrameset.style.width);
						curDsFsHeight = parseFloat(currentDragSourceFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(currentDragSourceFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(previousDragSourceFrameset)
						{
							prevDsFsX = parseFloat(previousDragSourceFrameset.style.left);
							prevDsFsY = parseFloat(previousDragSourceFrameset.style.top);
							prevDsFsWidth = parseFloat(previousDragSourceFrameset.style.width);
							prevDsFsHeight = parseFloat(previousDragSourceFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(previousDragSourceFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (previousDragSourceFrameset !== null) ? prevDsFsX + prevDsFsWidth : dropTargetFramesetX;
						curDsFsY = (previousDragSourceFrameset !== null) ? prevDsFsY : dropTargetFramesetY;
						if(previousDragSourceFrameset!== null && ((curDsFsX + curDsFsWidth) > (dropTargetFramesetX + dropTargetFramesetWidth) ))
						{
							maxHeight = prevDsFsHeight;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dropTargetLMSObject.acceptedDragSources[j]);
								var acceptedDragSourceTop = parseFloat(acceptedDragSource.style.top);
								if( prevDsFsY === acceptedDragSourceTop )
								{
									curHeight = parseFloat(acceptedDragSource.style.height);
									maxHeight = (curHeight > maxHeight) ? curHeight : maxHeight;
								}
								else
								{
									break;
								}

							}
							curDsFsX = dropTargetFramesetX;
							curDsFsY = (previousDragSourceFrameset !== null) ? prevDsFsY + maxHeight : dropTargetFramesetY;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( currentDragSourceFramesetID, curDsFsX, curDsFsY);
					}
				}
				break;
				case DD.SnapBehaviourPos.kCPSBPTileLeftRightStartingBottom:
				{
					for( i = 0; i <= dropTargetLMSObject.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						currentDragSourceFramesetID = null;
						currentDragSourceFrameset = null;
						previousDragSourceFramesetID = null;
						previousDragSourceFrameset = null;
						if( i !== dropTargetLMSObject.acceptedDragSources.length)
						{
							currentDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i];
						}
						else
						{
							currentDragSourceFramesetID = dragSourceFramesetID;
						}
						currentDragSourceFrameset = document.getElementById(currentDragSourceFramesetID);
						if( i !== 0 )
						{
							previousDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i-1];
						}
						if( previousDragSourceFramesetID )
							previousDragSourceFrameset = document.getElementById(previousDragSourceFramesetID);

						curDsFsWidth = parseFloat(currentDragSourceFrameset.style.width);
						curDsFsHeight = parseFloat(currentDragSourceFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(currentDragSourceFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(previousDragSourceFrameset)
						{
							prevDsFsX = parseFloat(previousDragSourceFrameset.style.left);
							prevDsFsY = parseFloat(previousDragSourceFrameset.style.top);
							prevDsFsWidth = parseFloat(previousDragSourceFrameset.style.width);
							prevDsFsHeight = parseFloat(previousDragSourceFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(previousDragSourceFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (previousDragSourceFrameset !== null) ? prevDsFsX + prevDsFsWidth: dropTargetFramesetX;
						curDsFsY = (previousDragSourceFrameset !== null) ? prevDsFsY + prevDsFsHeight - curDsFsHeight : dropTargetFramesetY +
						dropTargetFramesetHeight - curDsFsHeight;
						if( previousDragSourceFrameset !== null && ((curDsFsX + curDsFsWidth) > (dropTargetFramesetX + dropTargetFramesetWidth)) )
						{
							maxHeight = prevDsFsHeight;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dropTargetLMSObject.acceptedDragSources[j]);
								var acceptedDragSourceBottom = parseFloat(acceptedDragSource.style.top) + parseFloat(acceptedDragSource.style.height);
								if( ( prevDsFsY + prevDsFsHeight ) === acceptedDragSourceBottom )
								{
									curHeight = parseFloat(acceptedDragSource.style.height);
									maxHeight = (curHeight > maxHeight) ? curHeight : maxHeight;
								}
								else
								{
									break;
								}

							}
							curDsFsX = dropTargetFramesetX;
							curDsFsY = (previousDragSourceFrameset !== null) ? prevDsFsY + prevDsFsHeight - maxHeight -
							curDsFsHeight : dropTargetFramesetHeight - curDsFsHeight;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( currentDragSourceFramesetID, curDsFsX, curDsFsY);
					}
				}
				break;
				case DD.SnapBehaviourPos.kCPSBPTileBottomTopStartingLeft:
				{
					for( i = 0; i <= dropTargetLMSObject.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						currentDragSourceFramesetID = null;
						currentDragSourceFrameset = null;
						previousDragSourceFramesetID = null;
						previousDragSourceFrameset = null;
						if( i !== dropTargetLMSObject.acceptedDragSources.length)
						{
							currentDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i];
						}
						else
						{
							currentDragSourceFramesetID = dragSourceFramesetID;
						}
						currentDragSourceFrameset = document.getElementById(currentDragSourceFramesetID);
						if( i !== 0 )
						{
							previousDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i-1];
						}
						if( previousDragSourceFramesetID )
							previousDragSourceFrameset = document.getElementById(previousDragSourceFramesetID);

						curDsFsWidth = parseFloat(currentDragSourceFrameset.style.width);
						curDsFsHeight = parseFloat(currentDragSourceFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(currentDragSourceFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(previousDragSourceFrameset)
						{
							prevDsFsX = parseFloat(previousDragSourceFrameset.style.left);
							prevDsFsY = parseFloat(previousDragSourceFrameset.style.top);
							prevDsFsWidth = parseFloat(previousDragSourceFrameset.style.width);
							prevDsFsHeight = parseFloat(previousDragSourceFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(previousDragSourceFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (previousDragSourceFrameset !== null) ? prevDsFsX : dropTargetFramesetX;
						curDsFsY = (previousDragSourceFrameset !== null) ? prevDsFsY - curDsFsHeight : dropTargetFramesetY +
						dropTargetFramesetHeight - curDsFsHeight;
						if( previousDragSourceFrameset !== null && curDsFsY < dropTargetFramesetY )
						{
							maxWidth = prevDsFsWidth;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dropTargetLMSObject.acceptedDragSources[j]);
								var acceptedDragSourceLeft = parseFloat(acceptedDragSource.style.left);
								if( prevDsFsX === acceptedDragSourceLeft )
								{
									curWidth = parseFloat(acceptedDragSource.style.width);
									maxWidth = (curWidth > maxWidth) ? curWidth : maxWidth;
								}
								else
								{
									break;
								}

							}
							curDsFsX = (previousDragSourceFrameset !== null) ? prevDsFsX + maxWidth : dropTargetFramesetX;
							curDsFsY = dropTargetFramesetY + dropTargetFramesetHeight - curDsFsHeight;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( currentDragSourceFramesetID, curDsFsX, curDsFsY);
					}
				}
				break;
				case DD.SnapBehaviourPos.kCPSBPTileTopBottomStartingLeft:
				{
					for( i = 0; i <= dropTargetLMSObject.acceptedDragSources.length; ++i ) // the <= is intentional
					{
						currentDragSourceFramesetID = null;
						currentDragSourceFrameset = null;
						previousDragSourceFramesetID = null;
						previousDragSourceFrameset = null;
						if( i !== dropTargetLMSObject.acceptedDragSources.length)
						{
							currentDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i];
						}
						else
						{
							currentDragSourceFramesetID = dragSourceFramesetID;
						}
						currentDragSourceFrameset = document.getElementById(currentDragSourceFramesetID);
						if( i !== 0 )
						{
							previousDragSourceFramesetID = dropTargetLMSObject.acceptedDragSources[i-1];
						}
						if( previousDragSourceFramesetID )
							previousDragSourceFrameset = document.getElementById(previousDragSourceFramesetID);

						curDsFsWidth = parseFloat(currentDragSourceFrameset.style.width);
						curDsFsHeight = parseFloat(currentDragSourceFrameset.style.height);
						var rotationOffsetX = 0, rotationOffsetY = 0, prevRotationOffsetX = 0, prevRotationOffsetY = 0;
						var dimAfterRot = DD.GetDimensionsAfterRotation(0,0,curDsFsWidth,curDsFsHeight,DD.getRotationAngle(currentDragSourceFrameset));
						if(dimAfterRot)
						{
							rotationOffsetX = -dimAfterRot.minX;
							rotationOffsetY = -dimAfterRot.minY;
							curDsFsWidth = dimAfterRot.maxX - dimAfterRot.minX;
							curDsFsHeight = dimAfterRot.maxY - dimAfterRot.minY;
						}
						prevDsFsX = 0,prevDsFsY = 0, prevDsFsWidth = 0, prevDsFsHeight = 0; 
						if(previousDragSourceFrameset)
						{
							prevDsFsX = parseFloat(previousDragSourceFrameset.style.left);
							prevDsFsY = parseFloat(previousDragSourceFrameset.style.top);
							prevDsFsWidth = parseFloat(previousDragSourceFrameset.style.width);
							prevDsFsHeight = parseFloat(previousDragSourceFrameset.style.height);
							var prevDimAfterRot = DD.GetDimensionsAfterRotation(0,0,prevDsFsWidth,prevDsFsHeight,DD.getRotationAngle(previousDragSourceFrameset));
							if(dimAfterRot)
							{
								prevRotationOffsetX = -prevDimAfterRot.minX;
								prevRotationOffsetY = -prevDimAfterRot.minY;
								prevDsFsX -= prevRotationOffsetX;
								prevDsFsY -= prevRotationOffsetY;
								prevDsFsWidth = prevDimAfterRot.maxX - prevDimAfterRot.minX;
								prevDsFsHeight = prevDimAfterRot.maxY - prevDimAfterRot.minY;
							}
						}
						curDsFsX = (previousDragSourceFrameset !== null) ? prevDsFsX : dropTargetFramesetX;
						curDsFsY = (previousDragSourceFrameset !== null) ? prevDsFsY + prevDsFsHeight : dropTargetFramesetY;
						var curWidth,maxWidth;
						if( previousDragSourceFrameset !== null && ((curDsFsY + curDsFsHeight) > (dropTargetFramesetY + dropTargetFramesetHeight)) )
						{
							var maxWidth = prevDsFsWidth;
							for( j = i - 1; j >= 0; --j )
							{
								var acceptedDragSource = document.getElementById(dropTargetLMSObject.acceptedDragSources[j]);
								var acceptedDragSourceLeft = parseFloat(acceptedDragSource.style.left);
								if( prevDsFsX === acceptedDragSourceLeft )
								{
									curWidth = parseFloat(acceptedDragSource.style.width);
									maxWidth = (curWidth > maxWidth) ? curWidth : maxWidth;
								}
								else
								{
									break;
								}

							}
							curDsFsX = (previousDragSourceFrameset !== null) ? prevDsFsX + maxWidth : dropTargetFramesetX ;
							curDsFsY = dropTargetFramesetY;
						}
						curDsFsX += rotationOffsetX;
						curDsFsY += rotationOffsetY;
						this.SetDsFramesetAndCanvasDivPos( currentDragSourceFramesetID, curDsFsX, curDsFsY);
					}
				}
				break;
			case DD.SnapBehaviourPos.kCPSBPStackHorizonatally:
			case DD.SnapBehaviourPos.kCPSBPStackVertically:
				break;
			default:
			break;
		}
	};

	DD.Interaction.prototype.resumeSetSnapOpacity = function(dropTargetFramesetID,dragSourceFramesetID)
	{
		var dropTargetModelObject = this.GetDTObjFromDTID( dropTargetFramesetID );
		if(dropTargetModelObject)
		{
			var dragSourceCanvas = document.getElementById(cp.model.data[dragSourceFramesetID].mdi);
			dragSourceCanvas.style.opacity = dropTargetModelObject.sbo/100;
			DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dragSourceFramesetID]], null, null, null, null, null,
				dragSourceCanvas.style.opacity,null,null);
		}
	};

	DD.Interaction.prototype.resumeSetSnapDepth = function()
	{

	};

	DD.Interaction.prototype.resumeChangePositionsOfDragSources = function(dragSourceFramesetID,left,top)
	{
		if(left === null || top === null)
			return;
	//	var dragSourceFramesetID = dragSourceInfo.objectID;
		var framesetDiv = document.getElementById(dragSourceFramesetID);
		var diffLeft = parseFloat(left) - parseFloat(framesetDiv.style.left);
		var diffTop = parseFloat(top) - parseFloat(framesetDiv.style.top);
		framesetDiv.style.left = parseFloat(left) + "px";
		framesetDiv.style.top = parseFloat(top) + "px";
		var objectDiv = document.getElementById("re-"+dragSourceFramesetID + "c");
		objectDiv.style.left = parseFloat(objectDiv.style.left)+diffLeft + "px";
		objectDiv.style.top = parseFloat(objectDiv.style.top)+diffTop + "px";
		var newDivStruct = this.DragSourceCurrentStateList[this.DSMap[dragSourceFramesetID]].divStruct;
		if(newDivStruct)
		{
			newDivStruct.posleft = objectDiv.style.left;
			newDivStruct.postop = objectDiv.style.top;
		}
		DD.UpdateDragSourceStatePropertiesObject(this.DragSourceCurrentStateList[this.DSMap[dragSourceFramesetID]], null, framesetDiv.style.left, framesetDiv.style.top,
		null, null, null,newDivStruct,null);
		objectDiv.style.display = "none";
		objectDiv.offsetHeight;
		objectDiv.style.display = "block";

		var dslmsobj = this.DSLMSMap[dragSourceFramesetID];
		dslmsobj.posleft = framesetDiv.style.left;
		dslmsobj.postop = framesetDiv.style.top;
		dslmsobj.previousDTID = null;
		dslmsobj.currentDTID = null;
	};
	
	
	DD.Interaction.prototype.appendToAnswerList = function(dragSourceID,dropTargetID)
	{
		this.m_attemptedAnswerString.push("t:"+dragSourceID+"-t:"+dropTargetID);
	};

	DD.Interaction.prototype.clearAnswerList = function()
	{
		while(this.m_attemptedAnswerString.length > 0)
			this.m_attemptedAnswerString.pop();
	};
	DD.Interaction.prototype.checkCorrectAnswers = function(correctAnswerString,isSequence)
	{
		var correctAnswerRegEx = new RegExp(correctAnswerString);
		var attemptedAnswer = this.convertAnswerListToString(isSequence);
		if(correctAnswerRegEx.test(attemptedAnswer))
			return true;
		else 
			return false;
	};

	//Added by Chinmay - Question related functions
	DD.Interaction.prototype.resetAnswers = function()
	{
		for(i=0; i<this.m_dsList.length; ++i)
			{
				dsID = this.m_dsList[i].n;
				dsDiv = document.getElementById(dsID);
				if(cp.device == cp.IDEVICE)
				{
					dsDiv.ontouchstart = null;
				}
				else
				{
					dsDiv.onmousedown = null;
				}	
				if( DD.getAttribute(this.m_elId, 'hc') === true )
				{
					dsDiv.onmouseover = null;
					dsDiv.onmouseout = null;
				}
				break;
			}
		for( var k = 0; k < this.m_dtList.length; ++k)
			{
				var dtObj = this.DTMap[this.m_dtList[k].n];
				if(dtObj)
				{
					dtObj.acceptedDragSources.length = 0;
				}
			}

		this.m_attemptedAnswerString = [];
		if(this.m_questionObj)
			this.m_CurrentAttempt = this.m_questionObj.currentAttempt;
	};
	
	DD.Interaction.prototype.disableInteraction = function()
	{
		for(i=0; i<this.m_dsList.length; ++i)
			{
				dsID = this.m_dsList[i].n;
				dsDiv = document.getElementById(dsID);
				if(cp.device == cp.IDEVICE)
				{
					dsDiv.ontouchstart = null;
				}
				else
				{
					dsDiv.onmousedown = null;
				}	
				if( DD.getAttribute(this.m_elId, 'hc') === true )
				{
					dsDiv.onmouseover = null;
					dsDiv.onmouseout = null;
				}
			}

			for(var i=0; i< this.m_buttonIDList.length; ++i)
			{
				var buttonDiv = document.getElementById(this.m_buttonIDList[i]);
				buttonDiv.style.visibility = "hidden";
			}
	};
	
	DD.Interaction.prototype.getStateToStore = function()
	{
		//TODO - return the current state of drag drop interaction in the form of string
		return this.m_StoredSuspendDataString;
	};
	DD.Interaction.prototype.setStateToStore = function(iStateStr)
	{
		//TODO - set the current state of drag drop interaction from string
		this.m_StoredSuspendDataString = unescape(iStateStr);
		if(this.m_StoredSuspendDataString === "")
		return;
		this.doResume();
	};
	DD.Interaction.prototype.ClearDropTargetLMSPropertiesObjects = function()
	{
		for( var k=0; k<this.m_dtList.length; ++k)
			{
				var dtlmsobj = this.DTMap[this.m_dtList[k].n];
				if(dtlmsobj !== null && dtlmsobj !== undefined)
				{
					dtlmsobj.dsWidth = null;
					dtlmsobj.dsHeight = null;
					dtlmsobj.acceptedDragSources = [];
					dtlmsobj.acceptedSourceObjects = [];
				}
			}
	};
	DD.Interaction.prototype.doResume = function()
	{

		if(this.m_StoredSuspendDataString.length > 0)
		{
			var lState = new cp.QuizState();
			lState.init();
			var i,j,dragSourceName,dslmsobj,left,top;
			lState.fromString(this.m_StoredSuspendDataString);
			var numDropTargets = lState.readNumber();
			for(i=0;i<numDropTargets;++i)
			{
				var dropTargetName = lState.readString();
				if(this.m_resumeItemsMap[dropTargetName] !== 1)
				{
					this.m_resumeItemsMap[dropTargetName] = 1;
					this.m_resumeItemsToBeDrawn +=1;
				}
				var dtModelObj = this.GetDTObjFromDTID( dropTargetName );
				var hasAbsolutePos =(dtModelObj.sbp === DD.SnapBehaviourPos.kCPSBPAbsolute);
					var numDragSources = lState.readNumber();
					for(j=0;j<numDragSources;++j)
					{
						dragSourceName = lState.readString();
						if(this.m_resumeItemsMap[dragSourceName] !== 1)
						{
							this.m_resumeItemsMap[dragSourceName] = 1;
							this.m_resumeItemsToBeDrawn +=1;
						}
						if(hasAbsolutePos)
						{
							left = lState.readNumber();
							top = lState.readNumber();
						}
					}
			}
			var extraDragSourcesNum = lState.readNumber();
			for(i=0;i<extraDragSourcesNum;++i)
			{
				dragSourceName = lState.readString();
				if(this.m_resumeItemsMap[dragSourceName] !== 1)
				{
					this.m_resumeItemsMap[dragSourceName] = 1;
					this.m_resumeItemsToBeDrawn +=1;
				}
				left = lState.readNumber();
				top = lState.readNumber();
			}
		}
		this.ClearDropTargetLMSPropertiesObjects();
		var that = this;

		function timeoutFunc()
		{
			if(that.m_resumeItemsToBeDrawn === 0)
			{
				that.resumeInteraction();
				return;
			}
			setTimeout(timeoutFunc,20);
		}

		setTimeout(timeoutFunc,20);

	};
})();

cp.DDInteractionCallLaterData = function()
{
	this.m_Function = null; 
	this.m_Args = [];
};

cp.DragDropQuestion = function (questionObjName, associatedObjName, associatedItemName) {
    cp.DragDropQuestion.baseConstructor.call(this, questionObjName, associatedObjName, associatedItemName);
    this.m_DDInteraction = undefined;
    this.answerOptions = this.getAnswerOptions();
	this.m_PendingFuncs = [];
};

cp.inherits(cp.DragDropQuestion, cp.InteractiveItemQuestion);

cp.DragDropQuestion.prototype.setDDInteraction = function (iDDInteraction) {
    this.m_DDInteraction = iDDInteraction;
	this.m_DDInteraction_loaded = true;
	this.doPostInteractionLoadedStuff();
	if(!this.m_isStarted)
		this.startQuestion();
};

cp.DragDropQuestion.prototype.callLaterAfterInteractionLoad = function(aFuncName,aFuncArgs)
{
	var lCallLater = new  cp.DDInteractionCallLaterData();
	lCallLater.m_Function = aFuncName;
	lCallLater.m_Args = aFuncArgs;
	this.m_PendingFuncs.push(lCallLater);
};
cp.DragDropQuestion.prototype.doPostInteractionLoadedStuff = function()
{
	//do stuffs which were not done as interaction was not loaded at that time
	var lNumFunctions = this.m_PendingFuncs.length;
	for (var i=0; i<lNumFunctions; ++i)
	{
		var lCallLaterData = this.m_PendingFuncs[i];
		if(!lCallLaterData || !lCallLaterData.m_Function)
			continue;
		if(lCallLaterData.m_Args === undefined)
			lCallLaterData.m_Function();
		else
			lCallLaterData.m_Function(lCallLaterData.m_Args);
	}		
	this.m_PendingFuncs = [];
};

cp.DragDropQuestion.prototype.setInteractionQuestionState = function()
{
	if(!this.m_questionScore)
		return;
	if(!this.m_DDInteraction)
	{
		var that = this;
		this.callLaterAfterWidgetLoad(function (){ that.setInteractionQuestionState();});
		return;		
	}
	if(this.m_DDInteraction.setStateToStore)
		this.m_DDInteraction.setStateToStore( this.m_answerOrderArray.toString() );
};

cp.DragDropQuestion.prototype.resetQuestionData = function()
{
	cp.DragDropQuestion.superClass.resetQuestionData.call(this);
	if(!this.m_quizController.GetGoToQuizScopeActionExecuted())
	{
		this.m_selectedAnswersArr = [];
		this.m_answerOrderArray = [];
		this.isDisabled = false;
	}
};

cp.DragDropQuestion.prototype.startQuestion = function()
{
	if(!this.m_DDInteraction)
	{
		var that = this;
		this.callLaterAfterInteractionLoad(function (){ that.startQuestion();});
		return;
	}
	cp.DragDropQuestion.superClass.startQuestion.call(this);		
};

cp.DragDropQuestion.prototype.clearAnswers = function () {
    if (this.verbose)
        cp.log("Inside Clear Answers");

    var lSubmitAll = this.m_quizController && this.m_quizController.GetIsSubmitAll() && !this.getIsPretest();
    var lCanClearAnswers = (this.getWasJudged() === false) || (lSubmitAll && (this.m_quizController.m_submittedAllQuestions === false));
    lCanClearAnswers = lCanClearAnswers && !this.m_quizController.GetIsInReviewMode();
    if (lCanClearAnswers === false)
        return;

    this.m_selectedAnswersArr = [];
    if (this.verbose)
        cp.log("Not Attempted. Hence Clearing");

	if(!this.m_DDInteraction)
	{
		var that = this;
		this.callLaterAfterInteractionLoad(function (){ that.clearAnswers();});
		return;
	}
	
	this.m_DDInteraction.resetAnswers();
};

cp.DragDropQuestion.prototype.disableAnswers = function()
{
	this.isDisabled = true;
	if(!this.m_DDInteraction)
	{
		var that = this;
		this.callLaterAfterInteractionLoad(function (){ that.disableAnswers();});
		return;
	}
	this.m_DDInteraction.disableInteraction();
};

cp.DragDropQuestion.prototype.getAnswerScores = function () {
    //CURRENTLY CALLING PARENT CLASS METHOD. IMPLEMENT ADDITIONAL THINGS
	return cp.DragDropQuestion.superClass.getAnswerScores.call(this);
};

cp.DragDropQuestion.prototype.setQuestionSpecificScoreProperties = function (aQuestionSpecificScore) {
    if (aQuestionSpecificScore === undefined)
        return;
	
    aQuestionSpecificScore.m_answerOrderArrayAsString = this.m_answerOrderArray.toString();
},

cp.DragDropQuestion.prototype.restoreFromQuestionSpecificScoreProperties = function (aQuestionSpecificScore) {
    if (aQuestionSpecificScore === undefined)
        return;

    var lAnswerOrder = aQuestionSpecificScore.m_answerOrderArrayAsString;
    if ((lAnswerOrder === undefined) || (lAnswerOrder === ""))
        return;

    this.setAnswerOrder(lAnswerOrder);
};

cp.DragDropQuestion.prototype.setAnswerOrder = function (iOrder) {
    if (!iOrder || iOrder.length <= 0)
        return;
	
	var iOrderArr = iOrder.split(',');
    this.m_answerOrderArray = iOrderArr.slice(0);
};

cp.DragDropQuestion.prototype.resumeSelectedAnswers = function (iAnswerScores) {
    //CURRENTLY CALLING PARENT CLASS METHOD. IMPLEMENT ADDITIONAL THINGS
	return cp.DragDropQuestion.superClass.resumeSelectedAnswers.call(this);
};

cp.DragDropQuestion.prototype.getChosenAnswerAsString = function () {
    //CURRENTLY CALLING PARENT CLASS METHOD. IMPLEMENT ADDITIONAL THINGS
	return cp.DragDropQuestion.superClass.getChosenAnswerAsString.call(this);
};

cp.DragDropQuestion.prototype.getCorrectAnswerAsString = function () {
    //CURRENTLY CALLING PARENT CLASS METHOD. IMPLEMENT ADDITIONAL THINGS
	return cp.DragDropQuestion.superClass.getCorrectAnswerAsString.call(this);
};

cp.DragDropQuestion.prototype.getChosenAnswerAsStringForReview = function () {
    return this.getChosenAnswerAsString();
};

cp.DragDropQuestion.prototype.getCorrectAnswerAsStringForReview = function () {
    return this.getCorrectAnswerAsString();
};

cp.DragDropQuestion.prototype.saveAnswerOrder = function () {
    var lAnswers = [];
    var lAnswerOrder = "";
    var i = 0;

    if(this.m_DDInteraction.getStateToStore)
		this.m_answerOrderArray = this.m_DDInteraction.getStateToStore().split(",");
};

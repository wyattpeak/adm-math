(function() {
	var module = angular.module("admMathPlot", ["admMathParser"]);

	module.service("admPlotUtils", ["admOpenmathParser", "admLatexParser", function(admOpenmathParser, admLatexParser) {
		/*******************************************************************
		 * function:		parsePoint()
		 *
		 * description:	takes a STRING `point` of form '(x, y)' and returns
		 *							the x and y coordinates of that point, or NULL on
		 *							failure.
		 *
		 * arguments:		`point` STRING
		 *
		 * return:			{x: FLOAT, y: FLOAT} | NULL
		 ******************************************************************/
		this.parsePoint = function(point) {
			var parsedPoint = null;
			
			var matches = point.match(/^\((-?[\d.]+),\s*(-?[\d.]+)\)$/);
			if(matches !== null) {
				parsedPoint = {
					x: parseFloat(matches[1]),
					y: parseFloat(matches[2])
				};
			}
			
			return parsedPoint;
		}
		
		/*******************************************************************
		 * function:		toCanvasPos()
		 *
		 * description:	takes `pos` OBJECT (which is in graph coordinates),
		 *							and converts it to canvas coordinates (in pixels,
		 *							measured from top left.
		 *
		 * arguments:		`pos` OBJECT {x: FLOAT, y: FLOAT}
		 *
		 * return:			{x: INT, y: INT} | NULL
		 ******************************************************************/
		this.toCanvasCoords = function(pos, centre, scale) {
			if(pos === null)
				return null;
			
			var canvasPos = pos;
			canvasPos.x *= scale.x;
			canvasPos.y *= -scale.y;
			
			canvasPos.x += centre.x;
			canvasPos.y += centre.y;
			
			canvasPos.x = Math.round(canvasPos.x);
			canvasPos.y = Math.round(canvasPos.y);
			
			return canvasPos;
		}
		
		/*******************************************************************
		 * function:		parseExpression()
		 *
		 * description:	takes `expression`, converts it from whatever format
		 *							it's in (given by `format`) and returns anchor
		 *							admSemanticNode
		 *
		 * arguments:		`expression` STRING | admSemanticNode
		 *							`format` STRING
		 *
		 * return:			admSemanticNode | NULL
		 ******************************************************************/
		this.parseExpression = function(expression, format, registeredFunctions) {
			if(typeof expression === "undefined")
				return null;
			
			registeredFunctions = (typeof registeredFunctions !== "undefined") ? registeredFunctions : [];
			
			var expressionParsed = null;
			
			switch(format) {
				case "adm":				expressionParsed = expression;																												break;
				case "openmath":	expressionParsed = admOpenmathParser.getAdmSemantic(expression, registeredFunctions);	break;
				case "latex":			expressionParsed = admLatexParser.getAdmSemantic(expression, registeredFunctions);		break;
			}
			
			return expressionParsed;
		}
		
		/*******************************************************************
		 * function:		getRGBA()
		 *
		 * description:	takes `colour` in hex format (#000000), opacity as
		 *							a float (0, 1), and converts them into an rgba format
		 *							colour
		 *
		 * arguments:		`colour` STRING
		 *							`opacity` FLOAT
		 *
		 * return:			STRING
		 ******************************************************************/
		this.getRGBA = function(colour, opacity) {
			var r = parseInt(colour.substr(1,2), 16);
			var g = parseInt(colour.substr(3,2), 16);
			var b = parseInt(colour.substr(5,2), 16);
			
			return "rgba("+r+", "+g+", "+b+", "+opacity+")";
		}
		
		/*******************************************************************
		 * function:		parseRegisteredFunctions()
		 *
		 * description:	takes a string `functionsString` of format
		 *							/^\[[a-zA-Z]+(,[a-zA-Z]+)*\]$/ and returns an array
		 *							of strings
		 *
		 * arguments:		`functionsString` STRING
		 *
		 * return:			ARRAY
		 ******************************************************************/
		this.parseRegisteredFunctions = function(functionsString) {
			var registeredFunctions = []; //see description for admLiteralParser.build()
			
			if(typeof functionsString !== "undefined") {
				var functionsString = functionsString.replace(/\s/g, "");
				
				if(/^\[[a-zA-Z]+(,[a-zA-Z]+)*\]$/.test(functionsString))
					registeredFunctions = functionsString.slice(1,-1).split(',');
			}
			
			return registeredFunctions;
		}
	}]);
	
	module.directive("admPlot", function() {
		return {
			restrict: "A",
			scope: {
				width: "@",
				height: "@",
				xMin: "@admXMin",
				xMax: "@admXMax",
				yMin: "@admYMin",
				yMax: "@admYMax",
				noGridlines: "@admNoGridlines",
				piGridlines: "@admPiGridlines"
			},
			controller: function($scope, $element, $attrs) {
				var controller = this;

				this.xMin = typeof $scope.xMin !== "undefined" ? parseFloat($scope.xMin) : -10;
				this.xMax = typeof $scope.xMax !== "undefined" ? parseFloat($scope.xMax) : 10;
				this.yMin = typeof $scope.yMin !== "undefined" ? parseFloat($scope.yMin) : -10;
				this.yMax = typeof $scope.xMax !== "undefined" ? parseFloat($scope.yMax) : 10;
				this.noGridlines = typeof $scope.noGridlines !== "undefined";
				this.piGridlines = typeof $scope.piGridlines !== "undefined";

				this.context	= $element[0].getContext('2d');
				this.width		= parseInt($attrs.width);
				this.height		= parseInt($attrs.height);
				this.centre		= {};
				this.range		= {x: this.xMax - this.xMin,
													y: this.yMax - this.yMin};
				this.scale		= {x: this.width / this.range.x,
													y: this.height / this.range.y};
				this.step			= this.range.x / this.width;
				
				this.centre.x = this.width * ((0 - this.xMin) / this.range.x);
				this.centre.y = this.height - (this.height * ((0 - this.yMin) / this.range.y));

				this.drawAxes = function() {
					this.context.strokeStyle = "#b0b0b0";
					this.context.fillStyle = "#000000";
					this.context.lineWidth = 2;
				
					//draw x axis (and grid lines)
					this.context.beginPath();
					this.context.moveTo(0, this.centre.y);
					this.context.lineTo(this.width, this.centre.y);
					this.context.stroke();
				
					if(!this.noGridlines) {
						var firstLine = null;
						var step = null;
						if(this.piGridlines) {
							firstLine = Math.ceil(this.xMin/Math.PI)*Math.PI;
							step = Math.PI;
						} else {
							firstLine = Math.ceil(this.xMin);
							step = 1;
						}
						
						for(var i = firstLine; i <= this.xMax; i += step) {
							if(i == 0) //don't draw in x=0 if it's on the centre line
								continue;

							if(this.xMax-this.xMin > 10*step) //if there are more than ten markings
								if(Math.round((i-firstLine)/step)%(Math.round((this.xMax-this.xMin)/(10*step))) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.strokeStyle = "#f0f0f0";
							this.context.beginPath();
							this.context.moveTo(this.scale.x*(i-this.xMin), 0);
							this.context.lineTo(this.scale.x*(i-this.xMin), this.height);
							this.context.stroke();
							
							this.context.strokeStyle = "#b0b0b0";
							this.context.beginPath();
							this.context.moveTo(this.scale.x*(i-this.xMin), this.centre.y+7);
							this.context.lineTo(this.scale.x*(i-this.xMin), this.centre.y-7);
							this.context.stroke();
						}
					}
				
					//draw y axis (and grid lines)
					this.context.beginPath();
					this.context.moveTo(this.centre.x, 0);
					this.context.lineTo(this.centre.x, this.height);
					this.context.stroke();
				
					if(!this.noGridlines) {
						var firstLine = Math.ceil(this.yMin);
						for(var i = firstLine; i <= this.yMax; i++) {
							if(i == 0) //don't draw in y=0 if it's on the centre line
								continue;

							if(this.yMax-this.yMin > 10) //if there are more than ten markings
								if((i-firstLine)%(Math.round((this.yMax-this.yMin)/10)) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.strokeStyle = "#f0f0f0";
							this.context.beginPath();
							this.context.moveTo(0, this.height - this.scale.y*(i-this.yMin));
							this.context.lineTo(this.width, this.height - this.scale.y*(i-this.yMin));
							this.context.stroke();
							
							this.context.strokeStyle = "#b0b0b0";
							this.context.beginPath();
							this.context.moveTo(this.centre.x+7, this.height - this.scale.y*(i-this.yMin));
							this.context.lineTo(this.centre.x-7, this.height - this.scale.y*(i-this.yMin));
							this.context.stroke();
						}
					}

					//draw labels
					if(!this.noGridlines) {
						var firstLine = null;
						var step = null;
						if(this.piGridlines) {
							firstLine = Math.ceil(this.xMin/Math.PI)*Math.PI;
							step = Math.PI;
						} else {
							firstLine = Math.ceil(this.xMin);
							step = 1;
						}
						
						for(var i = firstLine; i <= this.xMax; i += step) {
							if(i == 0) //don't draw in x=0 if it's on the centre line
								continue;

							if(this.xMax-this.xMin > 10*step) //if there are more than ten markings
								if(Math.round((i-firstLine)/step)%(Math.round((this.xMax-this.xMin)/(10*step))) != 0) //if there are thirty markings, only show every third etc.
									continue;

							var label = null;
							if(this.piGridlines) {
								var multiple = Math.round(i/Math.PI);
								
								label = (multiple != 1 ? multiple : "")+"π";
							} else {
								label = Math.round(i*100)/100;
							}
							
							this.context.fillText(label, this.scale.x*(i-this.xMin)-4, this.centre.y-7-5);
						}

						var firstLine = Math.ceil(this.yMin);
						for(var i = firstLine; i <= this.yMax; i++) {
							if(i == 0) //don't draw in y=0 if it's on the centre line
								continue;

							if(this.yMax-this.yMin > 10) //if there are more than ten markings
								if((i-firstLine)%(Math.round((this.yMax-this.yMin)/10)) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.fillText(i, this.centre.x+7+5, this.height-this.scale.y*(i-this.yMin)+4);
						}
					}
				}

				this.drawAxes();
			}
		};
	});
	
	module.directive("admPlotFunction", ["admOpenmathParser", "admLatexParser", "admPlotUtils", function(admOpenmathParser, admLatexParser, admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				rule: "@admRule",
				format: "@admFormat",
				colour: "@admColour",
				domainMin: "@admDomainMin",
				domainMax: "@admDomainMax",
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.format)			scope.format = "latex";
				if(!scope.colour)			scope.colour = "#000000";
				if(!scope.domainMin)	scope.domainMin = plotCtrl.xMin;
				if(!scope.domainMax)	scope.domainMax = plotCtrl.xMax;

				scope.domainMin = parseFloat(scope.domainMin);
				scope.domainMax = parseFloat(scope.domainMax);
				
				scope.ruleParsed = admPlotUtils.parseExpression(scope.rule, scope.format);
				
				if(scope.ruleParsed && scope.ruleParsed.type !== "error") {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);		//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
						
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(scope.domainMin, scope.ruleParsed.plot(scope.domainMin));
						
						for(var x = scope.domainMin+plotCtrl.step; x <= scope.domainMax; x += plotCtrl.step)
							plotCtrl.context.lineTo(x, scope.ruleParsed.plot(x));
					plotCtrl.context.restore();
					
					plotCtrl.context.lineJoin = "round";
					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.strokeStyle = scope.colour;
					plotCtrl.context.stroke();
				}
			}
		};
	}]);
	
	module.directive("admPlotLabel", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				content: "@admContent",
				format: "@admFormat",
				functions: "@?admFunctions",
				pos: "@admPos",
				textSize: "@admTextSize",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.format)		scope.format = "latex";
				if(!scope.textSize)	scope.textSize = 16;
				if(!scope.colour)		scope.colour = "#000000";
				
				var registeredFunctions = admPlotUtils.parseRegisteredFunctions(scope.functions);
				
				scope.contentParsed = admPlotUtils.parseExpression(scope.content, scope.format, registeredFunctions);
				scope.pos = admPlotUtils.parsePoint(scope.pos);
				scope.pos = admPlotUtils.toCanvasCoords(scope.pos, plotCtrl.centre, plotCtrl.scale);
				
				var fontFamily = "Arial"
				
				if(scope.contentParsed && scope.contentParsed.type !== "error") {
					plotCtrl.context.fillStyle = scope.colour;
					plotCtrl.context.strokeStyle = scope.colour;
					
					scope.contentParsed.writeOnCanvas(plotCtrl.context, scope.pos, scope.textSize, fontFamily);
				}
			}
		};
	}]);
	
	module.directive("admPlotPoint", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				pos: "@admPos",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				
				scope.pos = admPlotUtils.parsePoint(scope.pos);
				scope.pos = admPlotUtils.toCanvasCoords(scope.pos, plotCtrl.centre, plotCtrl.scale);
				
				if(scope.pos !== null) {
					plotCtrl.context.fillStyle = scope.colour;
					plotCtrl.context.beginPath();
					plotCtrl.context.arc(scope.pos.x, scope.pos.y, 4, 0, 2 * Math.PI);
					plotCtrl.context.fill();
				}
			}
		};
	}]);
	
	module.directive("admPlotAsymptote", function() {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				xIntercept: "@admXIntercept",
				yIntercept: "@admYIntercept",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				
				var startPoint, endPoint;
				if(typeof scope.xIntercept !== "undefined") {
					scope.xIntercept = parseFloat(scope.xIntercept);
					
					startPoint = {x: scope.xIntercept, y: plotCtrl.yMin};
					endPoint = {x: scope.xIntercept, y: plotCtrl.yMax};
				} else if(typeof scope.yIntercept !== "undefined") {
					scope.yIntercept = parseFloat(scope.yIntercept);
					
					startPoint = {x: plotCtrl.xMin, y: scope.yIntercept};
					endPoint = {x: plotCtrl.xMax, y: scope.yIntercept};
				} else {
					//expand this at some point to allow arbitrary asymptotes
				}

				plotCtrl.context.save();
					plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
					plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
			
					plotCtrl.context.beginPath();
					
					plotCtrl.context.moveTo(startPoint.x, startPoint.y);
					plotCtrl.context.lineTo(endPoint.x, endPoint.y);
				plotCtrl.context.restore();

				plotCtrl.context.lineJoin = "round";
				plotCtrl.context.lineWidth = 2;
				plotCtrl.context.setLineDash([10, 5]);
				plotCtrl.context.strokeStyle = scope.colour;
				plotCtrl.context.stroke();
				plotCtrl.context.setLineDash([]);
			}
		};
	});
	
	module.directive("admPlotUnitCircle", function() {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";

				plotCtrl.context.save();
					plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
					plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
			
					plotCtrl.context.beginPath();
					plotCtrl.context.arc(0, 0, 1, 0, 2*Math.PI);
				plotCtrl.context.restore();

				plotCtrl.context.lineJoin = "round";
				plotCtrl.context.lineWidth = 2;
				plotCtrl.context.strokeStyle = scope.colour;
				plotCtrl.context.stroke();
			}
		};
	});
	
	module.directive("admPlotRadialLine", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				angle: "@admAngle",
				markAngleFrom: "@admMarkAngleFrom",
				angleLabel: "@admAngleLabel", //ignored if markAngleFrom undefined
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				scope.angle = parseFloat(scope.angle)*Math.PI/180;
				
				if(typeof scope.markAngleFrom === "undefined") {
					scope.markAngle = false;
				} else {
					scope.markAngle = true;
					scope.markAngleFrom = parseFloat(scope.markAngleFrom)*Math.PI/180;
					if(!scope.angleLabel) scope.angleLabel = "\u03b8"; //theta
				}

				function plot() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
				
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(0, 0);
						plotCtrl.context.lineTo(Math.cos(scope.angle), Math.sin(scope.angle));
					plotCtrl.context.restore();

					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.stroke();
				}

				function drawAngleMarking() {
						//draw marking
						plotCtrl.context.beginPath();
						plotCtrl.context.arc(plotCtrl.centre.x, plotCtrl.centre.y, 30, Math.min(scope.angle, scope.markAngleFrom), Math.max(scope.angle, scope.markAngleFrom))
						plotCtrl.context.lineWidth = 1;
						plotCtrl.context.stroke();
						
						//draw label
						var averagedAngle = (scope.angle+scope.markAngleFrom)/2;
						var labelPos = 	{
							x: plotCtrl.centre.x + Math.cos(averagedAngle)*45 - plotCtrl.context.measureText(scope.angleLabel).width/2,
							y: plotCtrl.centre.y + Math.sin(averagedAngle)*45 + 5}
						
						plotCtrl.context.fillText(scope.angleLabel, labelPos.x, labelPos.y);
				}
				
				plotCtrl.context.lineJoin = "round";
				plotCtrl.context.strokeStyle = scope.colour;
				plotCtrl.context.fillStyle = scope.colour;
				plotCtrl.context.font = "15px Arial";
				
				plot();
				if(scope.markAngle)
					drawAngleMarking();
			}
		};
	}]);
	
	module.directive("admPlotLine", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				start: "@admStart",
				end: "@admEnd",
				congruencyMarker: "@admCongruencyMarker",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				
				scope.start = admPlotUtils.parsePoint(scope.start);
				scope.end = admPlotUtils.parsePoint(scope.end);
				
				if(typeof scope.congruencyMarker !== "undefined")
					scope.congruencyMarker = parseInt(scope.congruencyMarker);

				function plot() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
				
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(scope.start.x, scope.start.y);
						plotCtrl.context.lineTo(scope.end.x, scope.end.y);
					plotCtrl.context.restore();

					plotCtrl.context.lineJoin = "round";
					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.strokeStyle = scope.colour;
					plotCtrl.context.stroke();
				}
				
				function dot(v1, v2) {
					return v1[0]*v2[0] + v1[1]*v2[1];
				}
				
				//all of this from definition dot(a,b) - |a||b|cos(theta)
				function angleBetweenVectors(v1, v2) {
					var dotProd = dot(v1, v2);
					
					var v1Magnitude = Math.sqrt(dot(v1, v1));
					var v2Magnitude = Math.sqrt(dot(v2, v2));
					
					return Math.acos(dotProd / (v1Magnitude * v2Magnitude));
				}
				
				function drawCongruencyMarker() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
						
						//the overall aim of this section is to change the coordinate system so that the line
						//has coordinates (-1, 0) at one end and (1, 0) at the other.
						//then we'll draw congruency markers around about (0, 0);
						
						//we're going to map the origin onto the line's midpoint
						var targetPoint = [scope.start.x+(scope.end.x-scope.start.x)/2, scope.start.y+(scope.end.y-scope.start.y)/2];
						
						//we're going to map the vector (1, 0) to scope.end-targetPoint
						var initVector = [1, 0];
						var targetVector = [scope.end.x-targetPoint[0], scope.end.y-targetPoint[1]];
						
						//rotate the coordinate system
						var angle = angleBetweenVectors(initVector, targetVector);
						plotCtrl.context.rotate(angle);
						
						//the targetPoint needs to be updated with each transform so it continues
						//to point to the target in the new, transformed coordinate system
						targetPoint = [Math.cos(-angle)*targetPoint[0]-Math.sin(-angle)*targetPoint[1],
							Math.sin(-angle)*targetPoint[0]+Math.cos(-angle)*targetPoint[1]];
						
						//scale the coordinate system
						var targetVectorMagnitude = Math.sqrt(dot(targetVector, targetVector));
						plotCtrl.context.scale(targetVectorMagnitude, targetVectorMagnitude);
						
						targetPoint = [targetPoint[0]/targetVectorMagnitude, targetPoint[1]/targetVectorMagnitude];
						
						//finally, translate the coordinate system to the targetPoint
						plotCtrl.context.translate(targetPoint[0], targetPoint[1]);
						
						plotCtrl.context.beginPath();
						
						//draw markers at spacings of 0.04;
						var markerDrawPos = (scope.congruencyMarker-1)*-0.02;
						for(var i = 0; i < scope.congruencyMarker; i++) {
							plotCtrl.context.moveTo(markerDrawPos/targetVectorMagnitude, -0.05/targetVectorMagnitude); //line has to be scaled to targetVectorMagnitude so that different
							plotCtrl.context.lineTo(markerDrawPos/targetVectorMagnitude, 0.05/targetVectorMagnitude); // sized lines have the same sized congruency markers
							
							markerDrawPos += 0.04;
						}
					plotCtrl.context.restore();

					plotCtrl.context.lineJoin = "round";
					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.strokeStyle = scope.colour;
					plotCtrl.context.stroke();
				}
				
				plot();
				if(typeof scope.congruencyMarker != "undefined")
					drawCongruencyMarker();
			}
		};
	}]);
	
	module.directive("admPlotFill", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				borders: "@admBorders",
				format: "@admFormat",
				colour: "@admColour",
				opacity: "@admOpacity"
			},
			controller: function($scope, $element, $attrs) {
				if(!$scope.format)	$scope.format = "latex";
				if(!$scope.colour)	$scope.colour = "#d9edf7";
				if(!$scope.opacity)	$scope.opacity = 0.7;
				
				$scope.borderList = new Array();
				
				this.addBorder = function(order, rule, start, end) {
					$scope.borderList[order-1] = {rule: rule, start: start, end: end};
				}
			},
			link: function(scope, element, attrs, plotCtrl) {
				function fill() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);		//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
						plotCtrl.context.beginPath();
					
						for(var i = 0; i < scope.borderList.length; i++) {
							var border = scope.borderList[i];
							var ruleParsed = admPlotUtils.parseExpression(border.rule, scope.format);
						
							if(!ruleParsed || ruleParsed.type === "error") {
								plotCtrl.context.restore();
								return;
							}
							
							if(i == 0)
								plotCtrl.context.moveTo(border.start, ruleParsed.plot(border.start));
							
							if(border.start < border.end) {
								for(var x = border.start+plotCtrl.step; x <= border.end; x += plotCtrl.step)
									plotCtrl.context.lineTo(x, ruleParsed.plot(x));
							} else {
								for(var x = border.start-plotCtrl.step; x >= border.end; x -= plotCtrl.step)
									plotCtrl.context.lineTo(x, ruleParsed.plot(x));
							}
						}
					plotCtrl.context.restore();
					
					plotCtrl.context.fillStyle = admPlotUtils.getRGBA(scope.colour, scope.opacity);
					plotCtrl.context.fill();
				}
				
				scope.$watch("borderList", function(newBorderList) {
					for(var i = 0; i < scope.borders; i++)
						if(typeof newBorderList[i] === "undefined")
							return;
					
					fill();
				}, true);
			}
		};
	}]);
	
	module.directive("admPlotFillBorder", function() {
		return {
			require: "^admPlotFill",
			restrict: "E",
			scope: {
				order: "@admOrder",
				rule: "@admRule",
				start: "@admStart",
				end: "@admEnd"
			},
			link: function(scope, element, attrs, fillCtrl) {
				fillCtrl.addBorder(scope.order, scope.rule, parseFloat(scope.start), parseFloat(scope.end));
			}
		};
	});
	
	module.directive("admPlotNormal", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			scope: {
				mean: "@admMean",
				stdDev: "@admStdDev",
				min: "@admMin",
				max: "@admMax",
				curveColour: "@admCurveColour",
				fillColour: "@admFillColour",
				opacity: "@admOpacity"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.mean)					scope.mean = 0;
				if(!scope.stdDev)				scope.stdDev = 1;
				if(!scope.min)					scope.min = plotCtrl.xMin;
				if(!scope.max)					scope.max = plotCtrl.xMax;
				if(!scope.curveColour)	scope.curveColour = "#31708f";
				if(!scope.fillColour)		scope.fillColour = "#d9edf7";
				if(!scope.opacity)			scope.opacity = 0.7;
				
				//get [[y]] value of Gaussian - see https://en.wikipedia.org/wiki/Gaussian_function for details
				function getNormalY(x) {
					var a = 1/(scope.stdDev*Math.sqrt(2*Math.PI));
					var p = -0.5*Math.pow((x-scope.mean)/scope.stdDev, 2)
					
					return a * Math.pow(Math.E, p);
				}
				
				function outline() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);		//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
						
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(plotCtrl.xMin, getNormalY(plotCtrl.xMin));
						
						for(var x = plotCtrl.xMin+plotCtrl.step; x <= plotCtrl.xMax; x += plotCtrl.step)
							plotCtrl.context.lineTo(x, getNormalY(x));
					plotCtrl.context.restore();
					
					plotCtrl.context.lineJoin = "round";
					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.strokeStyle = scope.curveColour;
					plotCtrl.context.stroke();
				}
				
				function fill() {
					var xMin = Math.max(plotCtrl.xMin, scope.min);
					var xMax = Math.min(plotCtrl.xMax, scope.max);
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);		//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
						
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(xMin, 0);
						plotCtrl.context.lineTo(xMin, getNormalY(xMin));
						
						for(var x = xMin+plotCtrl.step; x <= xMax; x += plotCtrl.step)
							plotCtrl.context.lineTo(x, getNormalY(x));
						
						plotCtrl.context.lineTo(xMax, 0);
						plotCtrl.context.lineTo(xMin, 0);
					plotCtrl.context.restore();
					
					plotCtrl.context.fillStyle = admPlotUtils.getRGBA(scope.fillColour, scope.opacity);
					plotCtrl.context.fill();
				}
				
				fill();
				outline();
			}
		};
	}]);
})();

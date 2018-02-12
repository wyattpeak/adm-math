/*******************************************************************
* The admSemanticNode object is the heart of the admMath package.
* All equations, however they're input (from admMathInput, parsed
* from LaTeX etc) end up in this format.
*	From here they can be converted to other formats, plotted on
* graphs and any other functionality contained.
*******************************************************************/

(function() {
	var module = angular.module("admMathSemantic", ["admMathLiteral"]);

	module.service("admSemanticNumeral", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(value) {
			return {
				expressionType: "semantic",
				type: "numeral",
				value: String(value),

				getAdmLiteral: function(parentLiteralNode) {
					var literalNodes = [];

					angular.forEach(this.value, function(c) {
						var node = admLiteralNode.build(parentLiteralNode, c);

						literalNodes.push(node);
					});

					return literalNodes;
				},

				getOpenMath: function() {
					if(this.value.indexOf('.') != -1)
						return "<OMF dec='"+this.value+"'/>";
					return "<OMI>"+this.value+"</OMI>";
				},

				getLatex: function() {
					return this.value;
				},
				
				plot: function(x) {
					return parseInt(this.value);
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					context.font = textSize+"px "+fontFamily;
					
					return context.measureText(this.value).width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					context.font = textSize+"px "+fontFamily;
					context.fillText(this.value, pos.x, pos.y+textSize);
					pos.x += context.measureText(this.value).width;
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticVariable", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(name) {
			return {
				expressionType: "semantic",
				type: "variable",
				name: name,

				getAdmLiteral: function(parentLiteralNode) {
					var literalNode = admLiteralNode.build(parentLiteralNode, this.name);

					return [literalNode];
				},

				getOpenMath: function() {
					return "<OMV name='"+this.name+"'/>";
				},

				getLatex: function() {
					return this.name;
				},
				
				//all variables are assumed to be x for the time being for plotting
				plot: function(x) {
					if(this.name === "x")
						return x;
					else
						return 0;
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					context.font = textSize+"px "+fontFamily;
					
					return context.measureText(this.name).width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					context.font = textSize+"px "+fontFamily;
					context.fillText(this.name, pos.x, pos.y+textSize);
					pos.x += context.measureText(this.name).width;
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticOperator", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(symbol, children) {
			return {
				expressionType: "semantic",
				type: "operator",
				symbol: symbol,
				children: children,

				assertHasValidChildren: function() {
					for(var i = 0; i < 2; i++) {
						if(!this.children[i])																		throw "errInvalidArguments";
						if(!this.children[i].hasOwnProperty("expressionType"))	throw "errInvalidArguments";
						if(this.children[i].expressionType != "semantic")				throw "errInvalidArguments";
					}
				},

				getAdmLiteral: function(parentLiteralNode) {
					var symbolNode = admLiteralNode.build(parentLiteralNode, this.symbol);

					var childLiteralNodes = [
						children[0].getAdmLiteral(parentLiteralNode),
						children[1].getAdmLiteral(parentLiteralNode)
					];

					return childLiteralNodes[0].concat(symbolNode, childLiteralNodes[1]);
				},

				getOpenMath: function() {
					var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

					return "<OMA><OMS cd='arith1' name='"+opName+"'/>"
						+ this.children[0].getOpenMath()
						+ this.children[1].getOpenMath()
						+ "</OMA>";
				},

				getLatex: function() {
					var opSymbol = (this.symbol === "*" ? " \\times " : this.symbol);
					return this.children[0].getLatex() + opSymbol + this.children[1].getLatex();
				},
				
				plot: function(x) {
					switch(this.symbol) {
						case "+":	return this.children[0].plot(x) + this.children[1].plot(x);
						case "-":	return this.children[0].plot(x) - this.children[1].plot(x);
						case "*":	return this.children[0].plot(x) * this.children[1].plot(x);
					}
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var width = this.children[0].getWidthOnCanvas(context, textSize, fontFamily);
					width += this.children[1].getWidthOnCanvas(context, textSize, fontFamily);
					
					context.font = textSize+"px "+fontFamily;
					width += context.measureText(this.symbol).width;;
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					pos = this.children[0].writeOnCanvas(context, pos, textSize, fontFamily);
					
					context.font = textSize+"px "+fontFamily;
					context.fillText(this.symbol, pos.x, pos.y+textSize);
					pos.x += context.measureText(this.symbol).width;
					
					pos = this.children[1].writeOnCanvas(context, pos, textSize, fontFamily);
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticUnaryMinus", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(child) {
			return {
				expressionType: "semantic",
				type: "unaryMinus",
				child: child,

				assertHasValidChildren: function() {
					if(!this.child)																		throw "errInvalidArguments";
					if(!this.child.hasOwnProperty("expressionType"))	throw "errInvalidArguments";
					if(this.child.expressionType != "semantic")				throw "errInvalidArguments";
				},

				getAdmLiteral: function(parentLiteralNode) {
					var symbolNode = admLiteralNode.build(parentLiteralNode, "-");
					var childLiteralNodes = this.child.getAdmLiteral(parentLiteralNode);

					return [symbolNode].concat(childLiteralNodes);
				},

				getOpenMath: function() {
					var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

					return "<OMA><OMS cd='arith1' name='unary_minus'/>"
						+ this.child.getOpenMath()
						+ "</OMA>";
				},

				getLatex: function() {
					return "-" + this.child.getLatex();
				},
				
				plot: function(x) {
					return 0-this.child.plot(x);
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var width = this.child.getWidthOnCanvas(context, textSize, fontFamily);
					
					context.font = textSize+"px "+fontFamily;
					width += context.measureText("-").width;;
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					context.font = textSize+"px "+fontFamily;
					context.fillText("-", pos.x, pos.y+textSize);
					pos.x += context.measureText("-").width;
					
					pos = this.child.writeOnCanvas(context, pos, textSize, fontFamily);
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticExponent", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(base, exponent) {
			return {
				expressionType: "semantic",
				type: "exponent",
				base: typeof base !== "undefined" ? base : null,
				exponent: typeof exponent !== "undefined" ? exponent : null,

				assertHasValidChildren: function() {
					if(this.base === null || this.exponent === null)	throw "errInvalidArguments";
					if(this.base.type == "error")											throw "errInvalidArguments";
					if(this.exponent.type == "error")									throw "errInvalidArguments";
				},

				getAdmLiteral: function(parentLiteralNode) {
					var baseLiteralNodes = this.base.getAdmLiteral(parentLiteralNode);
					var exponentNode = admLiteralNode.build(parentLiteralNode, "^");

					exponentNode.exponent.nodes = this.exponent.getAdmLiteral(exponentNode.exponent);

					return baseLiteralNodes.concat(exponentNode);
				},

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='power'/>"
						+ this.base.getOpenMath()
						+ this.exponent.getOpenMath()
						+ "</OMA>";
				},

				getLatex: function() {
					return this.base.getLatex() + "^{" + this.exponent.getLatex() + "}";
				},
				
				plot: function(x) {
					return Math.pow(this.base.plot(x), this.exponent.plot(x));
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var width = this.base.getWidthOnCanvas(context, textSize, fontFamily);
					width += this.exponent.getWidthOnCanvas(context, textSize/2, fontFamily);
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					context.font = textSize+"px "+fontFamily;
					
					pos = this.base.writeOnCanvas(context, pos, textSize, fontFamily);
					pos = this.exponent.writeOnCanvas(context, pos, textSize/2, fontFamily);
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticDivision", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(numerator, denominator) {
			return {
				expressionType: "semantic",
				type: "division",
				numerator: typeof numerator !== "undefined" ? numerator : null,
				denominator: typeof denominator !== "undefined" ? denominator : null,

				assertHasValidChildren: function() {
						if(this.numerator === null || this.denominator === null)	throw "errInvalidArguments";
						if(this.numerator.type == "error")												throw "errInvalidArguments";
						if(this.denominator.type == "error")											throw "errInvalidArguments";
				},

				getAdmLiteral: function(parentLiteralNode) {
					var divisionNode = admLiteralNode.build(parentLiteralNode, "/");

					divisionNode.numerator.nodes = this.numerator.getAdmLiteral(parentLiteralNode);
					divisionNode.denominator.nodes = this.denominator.getAdmLiteral(parentLiteralNode);

					return [divisionNode];
				},

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='divide'/>"
						+ this.numerator.getOpenMath()
						+ this.denominator.getOpenMath()
						+ "</OMA>";
				},

				getLatex: function() {
					return "\\frac{" + this.numerator.getLatex() + "}{" + this.denominator.getLatex() + "}";
				},
				
				plot: function(x) {
					return this.numerator.plot(x)/this.denominator.plot(x);
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var numeratorWidth = this.numerator.getWidthOnCanvas(context, textSize/2, fontFamily);
					var denominatorWidth = this.denominator.getWidthOnCanvas(context, textSize/2, fontFamily);
					
					var width = Math.max(numeratorWidth, denominatorWidth);
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					var numeratorWidth = this.numerator.getWidthOnCanvas(context, textSize/2, fontFamily);
					var denominatorWidth = this.denominator.getWidthOnCanvas(context, textSize/2, fontFamily);
					var totalWidth = Math.max(numeratorWidth, denominatorWidth);
					
					var numeratorShift = Math.max(0, (denominatorWidth-numeratorWidth)/2);
					var denominatorShift = Math.max(0, (numeratorWidth-denominatorWidth)/2);
					
					this.numerator.writeOnCanvas(context, {x: pos.x+numeratorShift, y: pos.y}, textSize/2, fontFamily);
					this.denominator.writeOnCanvas(context, {x:  pos.x+denominatorShift, y: pos.y+textSize/2}, textSize/2, fontFamily);
					
					//draw middle line
					context.beginPath();
					context.moveTo(pos.x, Math.round(pos.y+textSize*0.6)); //no theoretical basis, found experimentally
					context.lineTo(pos.x+totalWidth, Math.round(pos.y+textSize*0.6));
					context.lineWidth = Math.round(textSize/15); //no theoretical basis, found experimentally
					context.stroke();
					
					pos = {
						x: pos.x+totalWidth,
						y: pos.y};
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticRoot", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(index, radicand) {
			return {
				expressionType: "semantic",
				type: "squareRoot",
				index: typeof index !== "undefined" ? index : null,
				radicand: typeof radicand !== "undefined" ? radicand : null,

				assertHasValidChildren: function() {
						if(this.index === null || this.radicand === null)	throw "errInvalidArguments";
						if(this.index.type == "error")										throw "errInvalidArguments";
						if(this.radicand.type == "error")									throw "errInvalidArguments";
				},

				getAdmLiteral: function(parentLiteralNode) {
					var indexNodes = this.index.getAdmLiteral(parentLiteralNode);
					
					if(indexNodes.length == 1 && indexNodes[0].getVal() == "2") {
						var rootNode = admLiteralNode.buildByName(parentLiteralNode, "squareRoot");

						rootNode.radicand.nodes = this.radicand.getAdmLiteral(rootNode);

						return [rootNode];
					} else {
						var rootNode = admLiteralNode.buildByName(parentLiteralNode, "root");

						rootNode.index.nodes = this.index.getAdmLiteral(rootNode);
						rootNode.radicand.nodes = this.radicand.getAdmLiteral(rootNode);

						return [rootNode];
					}
				},

				//the order is right. fuck openmath.
				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='root'/>"
						+ this.radicand.getOpenMath()
						+ this.index.getOpenMath()
						+ "</OMA>";
				},

				getLatex: function() {
					if(this.index.type === "numeral" && this.index.value === "2")
						return "\\sqrt{" + this.radicand.getLatex() + "}";
					else
						return "\\sqrt[" + this.index.getLatex() + "]{" + this.radicand.getLatex() + "}";
				},
				
				plot: function(x) {
					return Math.pow(this.radicand.plot(x), 1/this.index.plot(x));
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var width = this.radicand.getWidthOnCanvas(context, textSize, fontFamily);
					
					width += textSize/2;
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					if(this.index.type !== "numeral" || this.index.value !== "2")
						this.index.writeOnCanvas(context, pos, textSize/2, fontFamily);
					
					var radicandWidth = this.radicand.getWidthOnCanvas(context, textSize, fontFamily);
					
					//draw root sign
					context.beginPath();
					context.moveTo(pos.x, pos.y+3*textSize/4);
					context.lineTo(pos.x+textSize/4, pos.y+textSize);
					context.lineTo(pos.x+textSize/2, pos.y); //no theoretical basis, found experimentally
					context.lineTo(pos.x+textSize/2+radicandWidth, pos.y);
					context.lineWidth = Math.round(textSize/15); //no theoretical basis, found experimentally
					context.stroke();
					
					pos.x += textSize/2;
					
					this.radicand.writeOnCanvas(context, pos, textSize, fontFamily);
					
					pos = {
						x: pos.x+radicandWidth,
						y: pos.y};
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticFunction", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(name, child) {
			return {
				expressionType: "semantic",
				type: "function",
				name: name,
				child: typeof child !== "undefined" ? child : null,

				assertHasValidChildren: function() {
						if(this.child === null)					throw "errInvalidArguments";
						if(this.child.type == "error")	throw "errInvalidArguments";
				},

				getAdmLiteral: function(parentLiteralNode) {
					var functionNode = admLiteralNode.buildByName(parentLiteralNode, this.name);
					functionNode.child.nodes = this.child.getAdmLiteral(functionNode);

					return [functionNode];
				},

				getOpenMath: function() {
					var cd;

					switch(this.name) {
						case "abs":	cd = "arith1";	break;
						default:		cd = "transc1";
					}

					return "<OMA><OMS cd='"+cd+"' name='"+this.name+"'/>"
						+ this.child.getOpenMath()
						+ "</OMA>";
				},
				
				getLatex: function() {
					if(this.name === "abs")
						return "|" + this.child.getLatex() + "|";
					
					return "\\" + this.name + "(" + this.child.getLatex() + ")";
				},
				
				plot: function(x) {
					switch(this.name) {
						case "sin":	return Math.sin(this.child.plot(x));
						case "cos":	return Math.cos(this.child.plot(x));
						case "tan":	return Math.tan(this.child.plot(x));
						case "abs":	return Math.abs(this.child.plot(x));
						case "ln":	return Math.log(this.child.plot(x));
					}
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var width = this.child.getWidthOnCanvas(context, textSize, fontFamily);
					
					context.font = textSize+"px "+fontFamily;
					width += context.measureText(this.name+"()").width;
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					context.font = textSize+"px "+fontFamily;
					context.fillText(this.name+"(", pos.x, pos.y+textSize);
					pos.x += context.measureText(this.name+"(").width;
					
					pos = this.child.writeOnCanvas(context, pos, textSize, fontFamily);
					
					context.font = textSize+"px "+fontFamily;
					context.fillText(")", pos.x, pos.y+textSize);
					pos.x += context.measureText(")").width;
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticLogarithm", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(base, argument) {
			return {
				expressionType: "semantic",
				type: "logarithm",
				base: typeof base !== "undefined" ? base : null,
				argument: typeof argument !== "undefined" ? argument : null,

				assertHasValidChildren: function() {
						if(this.base === null || this.argument === null)	throw "errInvalidArguments";
						if(this.base.type == "error")											throw "errInvalidArguments";
						if(this.argument.type == "error")									throw "errInvalidArguments";
				},

				getAdmLiteral: function(parentLiteralNode) {
					var logNode = admLiteralNode.buildByName(parentLiteralNode, "log");
					logNode.base.nodes = this.base.getAdmLiteral(logNode.base);
					logNode.argument.nodes = this.argument.getAdmLiteral(logNode.argument);

					return [logNode];
				},

				getOpenMath: function() {
					return "<OMA><OMS cd='transc1' name='log'/>"
						+ this.base.getOpenMath()
						+ this.argument.getOpenMath()
						+ "</OMA>";
				},
				
				getLatex: function() {
					return "\\log_{" + this.base.getLatex() + "}(" + this.argument.getLatex() + ")";
				},
				
				plot: function(x) {
					return Math.log(this.argument.plot(x)) / Math.log(this.base.plot(x));
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var width = this.base.getWidthOnCanvas(context, textSize/2, fontFamily);
					width += this.argument.getWidthOnCanvas(context, textSize, fontFamily);
					
					context.font = textSize+"px "+fontFamily;
					width += context.measureText("log()").width;
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					context.font = textSize+"px "+fontFamily;
					context.fillText("log", pos.x, pos.y+textSize);
					pos.x += context.measureText("log").width;
					
					var newPos = this.base.writeOnCanvas(context, {x: pos.x, y: pos.y+textSize/2}, textSize/2, fontFamily);
					pos.x = newPos.x;
					
					context.font = textSize+"px "+fontFamily;
					context.fillText("(", pos.x, pos.y+textSize);
					pos.x += context.measureText("(").width;
					
					pos = this.argument.writeOnCanvas(context, pos, textSize, fontFamily);
					
					context.font = textSize+"px "+fontFamily;
					context.fillText(")", pos.x, pos.y+textSize);
					pos.x += context.measureText(")").width;
					
					return pos;
				}
			};
		};
	}]);

	module.service("admSemanticConstant", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(name) {
			return {
				expressionType: "semantic",
				type: "constant",
				name: name,

				getAdmLiteral: function(parentLiteralNode) {
					switch(this.name) {
						case "e":
							return [admLiteralNode.build(parentLiteralNode, "e")];
						case "pi":
							return [admLiteralNode.buildByName(parentLiteralNode, "pi")];
						case "infinity":
							return [admLiteralNode.buildByName(parentLiteralNode, "infinity")];
					}
				},

				getOpenMath: function() {
					return "<OMS cd='nums1' name='"+this.name+"'/>";
				},
				
				getLatex: function() {
					switch(this.name) {
						case "pi":				return "\\pi";		break;
						case "e":					return "e";				break;
						case "infinity":	return "\\infty";	break;
					};
				},
				
				plot: function(x) {
					switch(this.name) {
						case "e":					return Math.E;
						case "pi":				return Math.PI;
						case "infinity":	return 0;
					}
				},
				
				getWidthOnCanvas: function(context, textSize, fontFamily) {
					var symbol = "";
					
					switch(this.name) {
						case "e":					symbol = "e";		break;
						case "pi":				symbol = "π";		break;
						case "infinity":	symbol = "∞";		break;
					}
					
					context.font = textSize+"px "+fontFamily;
					var width = context.measureText(symbol).width;
					
					return width;
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					pos = angular.copy(pos); //copy by value, avoid mutating the original
					
					var symbol = "";
					
					switch(this.name) {
						case "e":					symbol = "e";		break;
						case "pi":				symbol = "π";		break;
						case "infinity":	symbol = "∞";		break;
					}
					
					context.font = textSize+"px "+fontFamily;
					context.fillText(symbol, pos.x, pos.y+textSize);
					pos.x += context.measureText(symbol).width;
					
					return pos;
				}
			};
		};
	}]);
	
	module.service("admSemanticWrapper", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(child) {
			return {
				expressionType: "semantic",
				type: "wrapper",
				child:  typeof child !== "undefined" ? child : null,

				getAdmLiteral: function() {
					var literalNode = admLiteralNode.buildBlankExpression(null);
					literalNode.nodes = this.child.getAdmLiteral(literalNode);

					return literalNode;
				},

				getOpenMath: function() {
					return "<OMOBJ>"+this.child.getOpenMath()+"</OMOBJ>";
				},
				
				getLatex: function() {
					return this.child.getLatex();
				},
				
				plot: function(x) {
					return this.child.plot(x);
				},
				
				writeOnCanvas: function(context, pos, textSize, fontFamily) {
					return this.child.writeOnCanvas(context, pos, textSize, fontFamily);
				}
			};
		};
	}]);

	module.service("admSemanticError", function() {
		this.build = function(message) {
			return {
				expressionType: "semantic",
				type: "error",
				message: message,

				getAdmLiteral: function(parentLiteralNode) {
					//not much to do here. return blank expression because if you return nothing
					//you can end up with an admMathInput with no expression, which can't be edited
					var literalNode = admLiteralNode.buildBlankExpression(null);

					return literalNode;
				},

				getOpenMath: function() {
					return "<OME>"+this.message+"</OME>";
				},
				
				getLatex: function() {
					return "\\text{Error: "+this.message+"}";
				}
			};
		};
	});

	module.service("admSemanticNode", ["admSemanticNumeral", "admSemanticVariable", "admSemanticOperator", "admSemanticUnaryMinus",
		 "admSemanticExponent", "admSemanticDivision", "admSemanticRoot", "admSemanticFunction", "admSemanticLogarithm",
		 "admSemanticConstant", "admSemanticWrapper", "admSemanticError",
		 function(admSemanticNumeral, admSemanticVariable, admSemanticOperator, admSemanticUnaryMinus, admSemanticExponent,
			 admSemanticDivision, admSemanticRoot, admSemanticFunction, admSemanticLogarithm, admSemanticConstant, admSemanticWrapper, admSemanticError) {
		this.build = function(type) {
			switch(type) {
				case "numeral":			return admSemanticNumeral.build(arguments[1]);
				case "variable":		return admSemanticVariable.build(arguments[1]);
				case "operator":		return admSemanticOperator.build(arguments[1], arguments[2]);
				case "unaryMinus":	return admSemanticUnaryMinus.build(arguments[1]);
				case "exponent":		return admSemanticExponent.build(arguments[1], arguments[2]);
				case "division":		return admSemanticDivision.build(arguments[1], arguments[2]);
				case "root":				return admSemanticRoot.build(arguments[1], arguments[2]);
				case "function":		return admSemanticFunction.build(arguments[1], arguments[2]);
				case "logarithm":		return admSemanticLogarithm.build(arguments[1], arguments[2]);
				case "constant":		return admSemanticConstant.build(arguments[1]);
				case "wrapper":			return admSemanticWrapper.build(arguments[1]);
				case "error":				return admSemanticError.build(arguments[1]);
			}
		};
	}]);
})();

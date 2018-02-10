(function() {
	var module = angular.module("admMathLiteralConverter", ["admMathCore"]);

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
				}
			};
		};
	}]);
	
	module.service("admSemanticWrapper", ["admLiteralNode", function(admLiteralNode) {
		this.build = function(child) {
			return {
				expressionType: "semantic",
				type: "wrapper",
				child: child,

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

	module.factory("admLiteralParser", ["admSemanticNode", function(admSemanticNode) {
		/*******************************************************************
		 * function:		assertNotEmpty()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if the collection is empty
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertNotEmpty(nodes) {
			if(nodes.length === 0) throw "errEmptyExpression";
		}

		/*******************************************************************
		 * function:		assertParenthesesMatched()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if there are any unmatched
		 *							parentheses
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertParenthesesMatched(nodes) {
			var depth = 0;

			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "parenthesis")				continue;
				
				depth += (nodes[i].isStart ? 1 : -1);
				if(depth < 0)	throw "errUnmatchedParenthesis";
			}

			if(depth > 0)	throw "errUnmatchedParenthesis";
		}

		/*******************************************************************
		 * function:		assertPipesMatched()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if there are an uneven number
		 *							of | characters
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertPipesMatched(nodes) {
			var matched = true;
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "pipe")								continue;
				
				matched = !matched;
			}

			if(!matched)	throw "errUnmatchedPipe";
		}

		/*******************************************************************
		 * function:		parseExponents()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Exponent
		 *							with an equivalent semantic.nodeTypes.Exponent
		 *							leaves the semantic node's `base` as null
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseExponents(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "exponent")						continue;
				
				var semanticExp = build(nodes[i].exponent.getNodes());
				nodes.splice(i, 1, admSemanticNode.build("exponent", null, semanticExp));
			}
		}

		/*******************************************************************
		 * function:		applyExponents()
		 *
		 * description:	takes mixed collection of nodes `nodes` and,
		 *							wherever there is a semantic.nodeTypes.exponent,
		 *							fills its `base` with the preceding node
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function applyExponents(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "semantic")	continue;
				if(nodes[i].type != "exponent")						continue;

				if(i === 0) throw "errMissingBase";

				nodes[i].base = nodes[i-1];
				nodes[i].assertHasValidChildren();
				nodes.splice(i-1, 1);
			}
		}

		/*******************************************************************
		 * function:		parseParentheses()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal subexpressions surrounded
		 *							by parentheses with appropriate semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseParentheses(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "parenthesis")				continue;
				if(!nodes[i].isStart)											continue;

				var subExpressionNodes = [];
				for(var j = i+1; nodes[j].type != "parenthesis" || !nodes[j].isEnd; j++)
					subExpressionNodes.push(nodes[j]);

				var literalLength = subExpressionNodes.length+2; //number of nodes that have to be replaced in `nodes`
				var semanticNode = build(subExpressionNodes);
				if(semanticNode.type == "error")	throw "errEmptyExpression";

				nodes.splice(i, literalLength, semanticNode);
			}
		}

		/*******************************************************************
		 * function:		parsePipes()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal subexpressions surrounded
		 *							by pipes with absolute semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parsePipes(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "pipe")								continue;

				var subExpressionNodes = [];
				for(var j = i+1; nodes[j].type != "pipe"; j++)
					subExpressionNodes.push(nodes[j]);

				var literalLength = subExpressionNodes.length+2; //number of nodes that have to be replaced in `nodes`

				var semanticChild = build(subExpressionNodes);
				var semanticAbs = admSemanticNode.build("function", "abs", semanticChild);
				semanticAbs.assertHasValidChildren();

				nodes.splice(i, literalLength, semanticAbs);
			}
		}

		/*******************************************************************
		 * function:		parseDivision()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Exponent
		 *							with an equivalent semantic.nodeTypes.Exponent
		 *							leaves the semantic node's `base` as null
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseDivision(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "division")						continue;

				var semanticNumerator = build(nodes[i].numerator.getNodes());
				var semanticDenominator = build(nodes[i].denominator.getNodes());

				var semanticDiv = admSemanticNode.build("division", semanticNumerator, semanticDenominator);
				semanticDiv.assertHasValidChildren();

				nodes.splice(i, 1, semanticDiv);
			}
		}

		/*******************************************************************
		 * function:		parseRoots()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literalSquareRoots and literalRoots
		 *							with an equivalent semanticRoots
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseRoots(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")											continue;
				if(nodes[i].type != "squareRoot" && nodes[i].type != "root")	continue;
				
				var semanticIndex;
				if(nodes[i].type == "squareRoot")	semanticIndex = admSemanticNode.build("numeral", "2");
				else															semanticIndex = build(nodes[i].index.getNodes());

				var semanticRadicand = build(nodes[i].radicand.getNodes());
				var semanticRoot = admSemanticNode.build("root", semanticIndex, semanticRadicand);
				semanticRoot.assertHasValidChildren();

				nodes.splice(i, 1, semanticRoot);
			}
		}

		/*******************************************************************
		 * function:		replaceMulticharacterSymbols()
		 *
		 * description:	takes mixed collection of nodes `nodes` and replaces
		 *							each instance of admLiteralLetters making up the
		 *							symbol matched by `pattern` with an admSemanticNode
		 *							called with arguments `args`
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		`nodes` [admLiteralNode | admSemanticNode]
		 *							`nodeString` STRING
		 *								a string representation of `nodes` to aid searching
		 *							`pattern` REGEX
		 *								a regex pattern describing the symbol
		 *							`args` ARRAY
		 *								arguments with which admSemanticNode.build is called
		 *
		 * return:			STRING
		 *								nodeString, updated to reflect new changes
		 ******************************************************************/
		function replaceMulticharacterSymbols(nodes, nodeString, pattern, args) {
			var matches;
			while(matches = pattern.exec(nodeString)) {
				var pos = matches.index;
				var len = matches[0].length;

				var newNode = admSemanticNode.build.apply(null, args);

				nodes.splice(pos, len, newNode);
				nodeString = nodeString.slice(0, pos) + "_" + nodeString.slice(pos+len);
			}

			return nodeString;
		}

		/*******************************************************************
		 * function:		parseMulticharacterSymbols()
		 Pipes*
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces admLiteralLetters making up multicharacter
		 *							symbols (like 'sin') with admSemanticNodes
		 *							also some single character symbols like 'e' - basically
		 *							anything which shouldn't be turned into a variable
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseMulticharacterSymbols(nodes) {
			var nodeString = "";
			angular.forEach(nodes, function(node, index) {
				if(node.expressionType != "literal")	nodeString += "_";
				else if(node.type != "letter")				nodeString += "_";
				else																	nodeString += node.getVal();
			});

			//if one symbol is a substring of another, the longer symbol MUST go first
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /sin/, ["function", "sin"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /cos/, ["function", "cos"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /tan/, ["function", "tan"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /ln/, ["function", "ln"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /pi/, ["constant", "pi"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /e/, ["constant", "e"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /abs/, ["function", "abs"]);
		}

		/*******************************************************************
		 * function:		applyMulticharacterSymbols()
		 *
		 * description:	takes mixed collection of nodes `nodes` and,
		 *							wherever there is a multicharacter admSemanticNode
		 *							like 'sin', fill its `child` with the following
		 *							node
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function applyMulticharacterSymbols(nodes) {
			//has to run right-to-left or else you get things like sincosx => sin(cos)x instead of => sin(cos(x))
			for(var i = nodes.length-1; i >= 0; i--) {
				if(nodes[i].expressionType != "semantic")	continue;
				if(nodes[i].type != "function")						continue;
				if(nodes[i].child !== null)								continue; //some functions are parsed by parseFunctions()

				if(i+1 == nodes.length) throw "errMissingArgument";

				nodes[i].child = nodes[i+1];
				nodes[i].assertHasValidChildren();
				nodes.splice(i+1, 1);
			}
		}
		
		/*******************************************************************
		 * function:		parseNumerals()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Numeral
		 *							with appropriate semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseNumerals(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "numeral")						continue;

				var numeral = "";
				for(var j = i; nodes[j] && nodes[j].expressionType == "literal" && nodes[j].type == "numeral"; j++)
						numeral += nodes[j].getVal();

				if(numeral === "")																			throw "errNotFound";
				if(numeral.indexOf(".") != numeral.lastIndexOf("."))		throw "errMalformedNumeral";

				var semanticNum = admSemanticNode.build("numeral", numeral);
				nodes.splice(i, numeral.length, semanticNum);
			}
		}

		/*******************************************************************
		 * function:		parseVariables()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Letter
		 *							with semantic.nodeTypes.Variable
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseVariables(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "letter")							continue;

				var semanticVar = admSemanticNode.build("variable", nodes[i].getVal()); 
				nodes.splice(i, 1, semanticVar);
			}
		}

		/*******************************************************************
		 * function:		parseSymbols()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all admLiteralSymbols with
		 *							admSemanticConstants
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseSymbols(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "symbol")							continue;

				var semanticSymbol = admSemanticNode.build("constant", nodes[i].getVal()); 
				nodes.splice(i, 1, semanticSymbol);
			}
		}

		/*******************************************************************
		 * function:		parseFunctions()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all admLiteralFunctions with
		 *							admSemanticFunctions
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseFunctions(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "function")						continue;

				var semanticChild = build(nodes[i].child.getNodes());
				var semanticFunction = admSemanticNode.build("function", nodes[i].name, semanticChild);
				semanticFunction.assertHasValidChildren();

				nodes.splice(i, 1, semanticFunction);
			}
		}

		/*******************************************************************
		 * function:		parseLogarithms()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all admLiteralLogarithms with
		 *							admSemanticLogarithms
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseLogarithms(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "logarithm")					continue;

				var semanticBase = build(nodes[i].base.getNodes());
				var semanticArgument = build(nodes[i].argument.getNodes());
				var semanticLogarithm = admSemanticNode.build("logarithm", semanticBase, semanticArgument);
				semanticLogarithm.assertHasValidChildren();

				nodes.splice(i, 1, semanticLogarithm);
			}
		}

		/*******************************************************************
		 * function:		parseImpliedMultiplication()
		 *
		 * description:	takes mixed collection of nodes `nodes` and,
		 *							wherever there are two semantic.nodeTypes.[any]
		 *							side-by-side, replaces them with a multiplication
		 *							semantic node
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:			[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseImpliedMultiplication(nodes) {
			for(var i = 0; i < nodes.length-1; i++) {
				if(nodes[i].expressionType != "semantic")		continue;
				if(nodes[i+1].expressionType != "semantic")	continue;

				var opNode = admSemanticNode.build("operator", "*", [nodes[i], nodes[i+1]]);
				opNode.assertHasValidChildren();

				nodes.splice(i, 2, opNode);
				i--;	//necessary if there are two implied times in a row e.g. "2ab"
			}
		}
		
		/*******************************************************************
		 * function:		parseOperators()
		 *
		 * description:	takes mixed collection of nodes `nodes` and replaces
		 *							all literal.nodeTypes.Operator whose getVal() matches
		 *							`condition` with appropriate semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:			[admLiteralNode | admSemanticNode]
		 *							condition:	REGEX
		 *
		 * return:			none
		 ******************************************************************/
		function parseOperators(nodes, condition) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(!condition.test(nodes[i].getVal()))		continue;

				if(i == nodes.length-1)									throw "errInvalidArguments";
				if(i === 0 && nodes[i].getVal() != "-")	throw "errInvalidArguments";

				//if operator is a unary minus
				if(i === 0 && nodes[i].getVal() == "-") {
					var opNode = admSemanticNode.build("unaryMinus", nodes[i+1]);
					opNode.assertHasValidChildren();

					nodes.splice(i, 2, opNode);
				} else {
					var opNode = admSemanticNode.build("operator", nodes[i].getVal(), [nodes[i-1], nodes[i+1]]);
					opNode.assertHasValidChildren();

					nodes.splice(i-1, 3, opNode);
				}

				i--;
			}
		}

		/*******************************************************************
		 * function:		build()
		 *
		 * description:	takes mixed collection of nodes `nodes` and parses
		 *							into a single semantic node. Adds an admSemanticWrapper
		 *							around it if `hasParent` is false
		 *
		 * arguments:		nodes:			[admLiteralNode | admSemanticNode]
		 *							hasParent:	BOOLEAN
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function build(nodes, hasParent) {
			hasParent = (typeof hasParent !== "undefined") ? hasParent : true;
			var newNodes = nodes.slice(); //use slice() to copy by value, not reference
			
			try {
				assertNotEmpty(newNodes);
				assertParenthesesMatched(newNodes);
				assertPipesMatched(newNodes);
				parseParentheses(newNodes);
				parsePipes(newNodes);
				parseDivision(newNodes);
				parseRoots(newNodes);
				parseExponents(newNodes);							//create exponent semantic nodes, leave base empty for now
				parseMulticharacterSymbols(newNodes);	//parse symbols made of multiple characters, like sin, cos, pi
				parseNumerals(newNodes);
				parseVariables(newNodes);
				parseSymbols(newNodes);
				parseFunctions(newNodes);
				parseLogarithms(newNodes);

				applyExponents(newNodes);							//fill in bases of exponent semantic nodes
				applyMulticharacterSymbols(newNodes);
				parseImpliedMultiplication(newNodes);
				parseOperators(newNodes, /[*]/);
				parseOperators(newNodes, /[+\-]/);
			} catch(e) {
				switch(e) {
					case "errNotFound":							return admSemanticNode.build("error", "Missing number.");
					case "errUnmatchedParenthesis":	return admSemanticNode.build("error", "Unmatched parenthesis.");
					case "errUnmatchedPipe":				return admSemanticNode.build("error", "Unmatched pipe.");
					case "errMalformedNumeral":			return admSemanticNode.build("error", "Malformed Number.");
					case "errInvalidArguments":			return admSemanticNode.build("error", "Invalid arguments.");
					case "errEmptyExpression":			return admSemanticNode.build("error", "Empty expression.");
					case "errMissingBase":					return admSemanticNode.build("error", "Exponent has no base.");
					case "errMissingArgument":			return admSemanticNode.build("error", "Function has no argument.");
					default:												return admSemanticNode.build("error", "Unidentified error.");
				}
			}

			if(newNodes.length > 1) return admSemanticNode.build("error", "Irreducible expression.");
			
			if(hasParent)
				return newNodes[0];
			return admSemanticNode.build("wrapper", newNodes[0]);
		}

		return {
			toSemantic: function(literalNodes) {
				var semantic = build(literalNodes, false);
				
				return semantic;
			}
		};
	}]);
})();

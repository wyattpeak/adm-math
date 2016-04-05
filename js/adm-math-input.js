(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var mathInput = angular.module("admMathInput", ["ngSanitize", "admMathCore", "admMathOpenmathConverter"]);

	mathInput.run(["$templateCache", function($templateCache) {
		var expressionTemplate = "";
		expressionTemplate += "<span ng-class=\"{'empty-expression': (expression.nodes.length === 0),";
		expressionTemplate += " 'cursor-inside': (cursor.expression == expression)}\">";
		expressionTemplate += "<span";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === 0 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick(-1)\">&nbsp;</span>";
		expressionTemplate += "<span";
		expressionTemplate += " ng-repeat=\"node in expression.nodes track by $index\"";
		expressionTemplate += " ng-switch on=\"node.type\">";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"exponent\"";
		expressionTemplate += " class=\"exponent\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.exponent\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"division\"";
		expressionTemplate += " class=\"division\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "<span class=\"numerator\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.numerator\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";
		expressionTemplate += "<span class=\"denominator\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.denominator\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"squareRoot\"";
		expressionTemplate += " class=\"square-root\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.radicand\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"function\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "{{node.name}}(";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.child\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += ")";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-default";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible),";
		expressionTemplate += "  'exponent': node.type == 'exponent'}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\" ng-bind-html=\"node.getDisplay()\"></span>";

		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		var inputTemplate = "";
		inputTemplate += "<div";
		inputTemplate += " class=\"mathinput\"";
		inputTemplate += " ng-class=\"{'mathinput-error': !output.isValid}\"";
		inputTemplate += " tabindex=\"0\"";
		inputTemplate += " ng-keypress=\"control.keypress($event)\"";
		inputTemplate += " ng-keydown=\"control.keydown($event)\"";
		inputTemplate += " ng-focus=\"control.focus()\"";
		inputTemplate += " ng-blur=\"control.blur()\">";
		inputTemplate += "<adm-math-expression";
		inputTemplate += " cursor=\"cursor\"";
		inputTemplate += " expression=\"literalTree\"";
		inputTemplate += " control=\"control\"></adm-math-expression>";
		inputTemplate += "<input type=\"hidden\" name=\"{{name}}\" value=\"{{model}}\" />";
		inputTemplate += "</div>";
		
		$templateCache.put("adm-math-expression.htm", expressionTemplate);
		$templateCache.put("adm-math-input.htm", inputTemplate);
	}]);

	mathInput.service("admSemanticNumeral", function() {
		this.build = function(value) {
			return {
				expressionType: "semantic",
				type: "numeral",
				value: String(value),

				getOpenMath: function() {
					if(this.value.indexOf('.') != -1)
						return "<OMF dec='"+this.value+"'/>";
					return "<OMI>"+this.value+"</OMI>";
				}
			};
		};
	});

	mathInput.service("admSemanticVariable", function() {
		this.build = function(name) {
			return {
				expressionType: "semantic",
				type: "variable",
				name: name,

				getOpenMath: function() {
					return "<OMV name='"+this.name+"'/>";
				}
			};
		};
	});

	mathInput.service("admSemanticOperator", function() {
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

				getOpenMath: function() {
					var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

					return "<OMA><OMS cd='arith1' name='"+opName+"'/>"
						+ this.children[0].getOpenMath()
						+ this.children[1].getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	mathInput.service("admSemanticUnaryMinus", function() {
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

				getOpenMath: function() {
					var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

					return "<OMA><OMS cd='arith1' name='unary_minus'/>"
						+ this.child.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	mathInput.service("admSemanticExponent", function() {
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

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='power'/>"
						+ this.base.getOpenMath()
						+ this.exponent.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	mathInput.service("admSemanticDivision", function() {
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

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='divide'/>"
						+ this.numerator.getOpenMath()
						+ this.denominator.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	mathInput.service("admSemanticRoot", function() {
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

				//the order is right. fuck openmath.
				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='root'/>"
						+ this.radicand.getOpenMath()
						+ this.index.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	mathInput.service("admSemanticFunction", function() {
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

				getOpenMath: function() {
					//obviously not all functions are in transc1. deal with it when i get to it.
					return "<OMA><OMS cd='transc1' name='"+this.name+"'/>"
						+ this.child.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	mathInput.service("admSemanticConstant", function() {
		this.build = function(name) {
			return {
				expressionType: "semantic",
				type: "constant",
				name: name,

				getOpenMath: function() {
					//obviously not all constants are in nums. deal with it when i get to it.
					return "<OMS cd='nums1' name='"+this.name+"'/>";
				}
			};
		};
	});

	mathInput.service("admSemanticError", function() {
		this.build = function(message) {
			return {
				expressionType: "semantic",
				type: "error",
				message: message,

				getOpenMath: function() {
					return "<OME>"+message+"[FIND OUT HOW ERRORS ARE RECORDED]</OME>";
				}
			};
		};
	});

	mathInput.service("admSemanticNode", ["admSemanticNumeral", "admSemanticVariable", "admSemanticOperator", "admSemanticUnaryMinus",
		 "admSemanticExponent", "admSemanticDivision", "admSemanticRoot", "admSemanticFunction", "admSemanticConstant", "admSemanticError",
		 function(admSemanticNumeral, admSemanticVariable, admSemanticOperator, admSemanticUnaryMinus, admSemanticExponent,
			 admSemanticDivision, admSemanticRoot, admSemanticFunction, admSemanticConstant, admSemanticError) {
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
				case "constant":		return admSemanticConstant.build(arguments[1]);
				case "error":				return admSemanticError.build(arguments[1]);
			}
		};
	}]);

	mathInput.factory("admSemanticParser", ["admSemanticNode", function(admSemanticNode) {
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
				
				var semanticExp = build(nodes[i].exponent.getNodes().slice());
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

				var semanticNumerator = build(nodes[i].numerator.getNodes().slice());
				var semanticDenominator = build(nodes[i].denominator.getNodes().slice());

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
		 *							WARNING: currently only works on literalSquareRoot
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseRoots(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "squareRoot")					continue;
				
				var semanticIndex = admSemanticNode.build("numeral", "2");
				var semanticRadicand = build(nodes[i].radicand.getNodes().slice());

				nodes.splice(i, 1, admSemanticNode.build("root", semanticIndex, semanticRadicand));
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
		 *
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

				var semanticChild = build(nodes[i].child.getNodes().slice());
				var semanticFunction = admSemanticNode.build("function", nodes[i].name, semanticChild);

				nodes.splice(i, 1, semanticFunction);
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
		 *							into a single semantic node
		 *
		 * arguments:		nodes:	[admLiteralNode | admSemanticNode]
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function build(nodes) {
			try {
				assertNotEmpty(nodes);
				assertParenthesesMatched(nodes);
				parseParentheses(nodes);
				parseDivision(nodes);
				parseRoots(nodes);
				parseExponents(nodes);							//create exponent semantic nodes, leave base empty for now
				parseMulticharacterSymbols(nodes);	//parse symbols made of multiple characters, like sin, cos, pi
				parseNumerals(nodes);
				parseVariables(nodes);
				parseSymbols(nodes);
				parseFunctions(nodes);

				applyExponents(nodes);							//fill in bases of exponent semantic nodes
				applyMulticharacterSymbols(nodes);
				parseImpliedMultiplication(nodes);
				parseOperators(nodes, /[*]/);
				parseOperators(nodes, /[+\-]/);
			} catch(e) {
				switch(e) {
					case "errNotFound":							return admSemanticNode.build("error", "Missing number.");
					case "errUnmatchedParenthesis":	return admSemanticNode.build("error", "Unmatched parenthesis.");
					case "errMalformedNumeral":			return admSemanticNode.build("error", "Malformed Number.");
					case "errInvalidArguments":			return admSemanticNode.build("error", "Invalid arguments.");
					case "errEmptyExpression":			return admSemanticNode.build("error", "Empty expression.");
					case "errMissingBase":					return admSemanticNode.build("error", "Exponent has no base.");
					case "errMissingArgument":			return admSemanticNode.build("error", "Function has no argument.");
					default:												return admSemanticNode.build("error", "Unidentified error.");
				}
			}

			if(nodes.length > 1)	admSemanticNode.build("error", "Irreducible expression.");
			return nodes[0];
		}

		return {
			buildTree: function(nodes) {
				return build(nodes);
			}
		};
	}]);

	mathInput.directive("admMathExpression", function() {
		return {
			restrict: "E",
			replace: true,
			scope: {
				cursor: "=",
				expression: "=",
				control: "="
			},
			templateUrl: "adm-math-expression.htm",
			link: function(scope) {
			}
		};
	});
	
	mathInput.directive("admInputControl", function() {
		return {
			restrict: "A",
			scope: {
				target: "=admTarget",
				symbol: "@admSymbol"
			},
			link: function(scope, element, attrs) {
				element.bind("click", function(e) {
					scope.target.addSymbol(scope.symbol);
				});
			}
		};
	});

	mathInput.directive("admMathInput", ["$interval", "admLiteralNode", "admSemanticParser", "admOpenmathLiteralConverter",
			function($interval, admLiteralNode, admSemanticParser, admOpenmathLiteralConverter) {
		return {
			restrict: "E",
			replace: true,
			scope: {
				model: "=?ngModel",
				hook: "=?admHook"
			},
			templateUrl: "adm-math-input.htm",
			link: function(scope, element, attrs) {
				scope.format = angular.isDefined(attrs.admFormat) ? attrs.admFormat : "openmath";
				scope.name = angular.isDefined(attrs.name) ? attrs.name : null;
				scope.literalTree = admLiteralNode.buildBlankExpression(null); //the parent admLiteralExpression of the admMathInput

				scope.hook = {
					addSymbol: function(symbol) {
						var node = null;
						switch(symbol) {
							case "plus":				node = admLiteralNode.build(scope.cursor.expression, "+");								break;
							case "minus":				node = admLiteralNode.build(scope.cursor.expression, "-");								break;
							case "times":				node = admLiteralNode.build(scope.cursor.expression, "*");								break;
							case "divide":			node = admLiteralNode.build(scope.cursor.expression, "/");								break;
							case "squareRoot":	node = admLiteralNode.buildByName(scope.cursor.expression, "squareRoot");	break;
							case "pi":					node = admLiteralNode.buildByName(scope.cursor.expression, "pi");					break;
							case "sin":					node = admLiteralNode.buildByName(scope.cursor.expression, "sin");				break;
							case "cos":					node = admLiteralNode.buildByName(scope.cursor.expression, "cos");				break;
							case "tan":					node = admLiteralNode.buildByName(scope.cursor.expression, "tan");				break;
							case "ln":					node = admLiteralNode.buildByName(scope.cursor.expression, "ln");					break;
							default:
								if(/^[0-9.a-zA-Z+\-*()\^\/]$/.test(symbol))	node = admLiteralNode.build(scope.cursor.expression, symbol);
								else																				alert(symbol + ": Symbol not supported.");
						}
						
						if(node !== null) {
							scope.cursor.insertNode(node);
							scope.output.write();
						}

						element[0].focus();
					}
				};

				scope.$watch('model', function(newModel, oldModel) {
					if(newModel == scope.output.lastModel) return;

					try {
						if(!!newModel)	scope.literalTree = admOpenmathLiteralConverter.convert(newModel);
						else						scope.literalTree = admLiteralNode.buildBlankExpression(null);

						scope.output.write();
					} catch(e) {
						//just suppress any errors, user can't do anything about them
					}
				});

				/*******************************************************************
				 * object:			control{}
				 *
				 * description:	contains all functions used to handle user input
				 *							and interaction with the math input field
				 *
				 * variables:		none
				 * 
				 * functions:		`focus`			returns none
				 *							`blur`			returns none
				 *							`keypress`	returns none
				 *							`keydown`		returns BOOLEAN | none
				 *							`nodeClick`	returns none
				 ******************************************************************/
				scope.control = {
					/*******************************************************************
					 * function:		focus()
					 *
					 * description:	run on ngFocus of math input field
					 *							place cursor at end of field
					 *							relevant when user tabs into field or clicks
					 *							somewhere in field which is not on a node, otherwise
					 *							overridden by nodeClick()
					 *							THOUGHT:	How is it overridden? Doesn't the entire
					 *												focus bubbling chain run after the entire
					 *												click bubbling chain?
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					focus: function() {
						scope.cursor.expression = scope.literalTree;
						scope.cursor.goToEnd();
					},

					/*******************************************************************
					 * function:		blur()
					 *
					 * description:	run on ngBlur of math input field
					 *							hides the cursor
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					blur: function() {
						scope.cursor.hide();
					},

					/*******************************************************************
					 * function:		blur()
					 *
					 * description:	run on ngKeypress of math input field
					 *							if `e`.which is a valid character, inserts it into
					 *							expression
					 *
					 * arguments:		e:	Event
					 *
					 * return:			none
					 ******************************************************************/
					keypress: function(e) {
						var character = String.fromCharCode(e.which);
						if(/[a-zA-Z0-9.+\-*()\^]/.test(character))
							scope.cursor.insert(character);

						scope.output.write();
					},

					/*******************************************************************
					 * function:		blur()
					 *
					 * description:	run on ngKeydown of math input field
					 *							principally used when preventDefault is needed
					 *							i.e. on backspace and '/' (quickfind in firefox)
					 *
					 * arguments:		e:	Event
					 *
					 * return:			BOOLEAN | none
					 ******************************************************************/
					keydown: function(e) {
						//key has been captured and processed, prevent default action
						var captured = true;
						
						switch(e.keyCode) {
							case 8:		/*backspace*/				scope.cursor.backspace();								break;
							case 37:	/*left arrow*/			scope.cursor.moveLeft();								break;
							case 38:	/*up arrow*/				scope.cursor.moveUp();									break;
							case 39:	/*right arrow*/			scope.cursor.moveRight();								break;
							case 40:	/*down arrow*/			scope.cursor.moveDown();								break;
							case 191:	/*forward slash*/		scope.cursor.insert("/");								break;
							default:											captured = false;
						}

						if(captured) {
							scope.output.write();

							e.preventDefault();
							return false;
						}
					},

					/*******************************************************************
					 * function:		nodeClick()
					 *
					 * description:	run when an individual node element is clicked
					 *							moves cursor over the node at `nodeIndex` rather
					 *							than at the end of the math input field
					 *
					 * arguments:		nodeIndex	INT
					 *
					 * return:			none
					 ******************************************************************/
					nodeClick: function(nodeIndex) {
						//due to differing indices, position must be 1 higher than nodeIndex
						var position = nodeIndex + 1;

						scope.cursor.goToPos(position);
					}
				};

				/*******************************************************************
				 * object:			cursor{}
				 *
				 * description:	contains all functions used to move the cursor
				 *							around the math input field, and relevant state
				 *							variables
				 *
				 * variables:		`expression`		scope.literal.nodeTypes.Expression
				 *							`position`			INT
				 *							`visible`				BOOLEAN
				 *							`flashInterval`	Angular `promise`
				 * 
				 * functions:		`show`										returns none
				 *							`hide`										returns none
				 *							`insertDivision`					returns none
				 *							`insert`									returns none
				 *							`insertNode`							returns none
				 *							`backspace`								returns none
				 *							`tryMoveIntoParent`				returns BOOLEAN
				 *							`tryMoveIntoExponent`			returns BOOLEAN
				 *							`tryMoveIntoDivision`			returns BOOLEAN
				 *							`tryMoveIntoNumerator`		returns BOOLEAN
				 *							`tryMoveIntoDenominator`	returns BOOLEAN
				 *							`tryMoveIntoSquareRoot`		returns BOOLEAN
				 *							`moveLeft`								returns none
				 *							`moveUp`									returns none
				 *							`moveRight`								returns none
				 *							`moveDown`								returns none
				 *							`goToPos`									returns none
				 *							`goToEnd`									returns none
				 ******************************************************************/
				scope.cursor = {
					expression: null,			//the admLiteralExpression which the cursor is currently in
					position: null,				//the position of the cursor within `expression`
					visible: false,				//flag for whether the cursor should be visible (alternates for cursor flash)
					flashInterval: null,	//handler for cursor flashing interval

					/*******************************************************************
					 * function:		show()
					 *
					 * description:	show the cursor and start its flashing
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					show: function() {
						this.hide();
						this.visible = true;
						
						this.flashInterval = $interval(function() {
							scope.cursor.visible = !scope.cursor.visible;
						}, CURSOR_FLASHPERIOD);
					},

					/*******************************************************************
					 * function:		hide()
					 *
					 * description:	hide the cursor, and cancel flashing to avoid memory
					 *							leak
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					hide: function() {
						this.visible = false;
						$interval.cancel(this.flashInterval);
					},

					/*******************************************************************
					 * function:		insertDivision()
					 *
					 * description:	insert a division symbol, and move the last logical
					 *							term (highly subjective) into the numerator
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					insertDivision: function() {
						var node = admLiteralNode.build(this.expression, "/");

						//when figuring out what should go in the numerator, don't break up bracketed terms
						var bracketDepth = 0;
						while(this.position > 0) {
							var nodeToCollect = this.expression.getNode(this.position-1);

							if(nodeToCollect.getVal() == ")")	bracketDepth++;
							if(nodeToCollect.getVal() == "(")	bracketDepth--;

							if(bracketDepth < 0)																					break;
							if(/[+\-]/.test(nodeToCollect.getVal()) && bracketDepth == 0)	break;

							nodeToCollect.parentNode = node.numerator;
							node.numerator.insert(0, nodeToCollect);
							this.expression.deleteAt(this.position-1);

							this.position--;
						}
						this.expression.insert(this.position, node);

						this.expression = node.denominator;
						this.position = 0;
					},
					
					/*******************************************************************
					 * function:		insert()
					 *
					 * description:	insert character (typed by user) `character` after
					 *							the node under the cursor
					 *
					 * arguments:		`character` CHAR
					 *								the character to be inserted
					 *
					 * return:			none
					 ******************************************************************/
					insert: function(character) {
						if(character == "/") return this.insertDivision();

						var node = admLiteralNode.build(this.expression, character);

						this.expression.insert(this.position, node);
						this.moveRight();
					},
					
					/*******************************************************************
					 * function:		insertNode()
					 *
					 * description:	insert a prebuilt node directly into 
					 *							the cursor
					 *
					 * arguments:		`node` admLiteralNode
					 *								the node to be inserted
					 *
					 * return:			none
					 ******************************************************************/
					insertNode: function(node) {
						this.expression.insert(this.position, node);
						this.moveRight();
					},

					/*******************************************************************
					 * function:		backspace()
					 *
					 * description:	delete node under cursor, if there is one
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					backspace: function() {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;
						
						if(this.position === 0)	return;

						this.expression.deleteAt(nodeIndex);
						this.moveLeft();
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoParent()
					 *
					 * description:	moves the cursor into the parent node, if it exists.
					 *							used when the cursor is at one terminus of its
					 *							current expression, and so can't move any further.
					 *							moves into parent before or after the current node
					 *							depending on `relativePosition`.
					 *
					 * arguments:		relativePosition: STRING ("before"|"after")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoParent: function(relativePosition) {
						if(this.expression.parentNode === null)	return false;

						//every expression except the root expression (scope.literal.tree)
						//has a parentNode (exponent or division), while every node of course
						//has a parent expression. we want to move into that expression
						var parentNode = this.expression.parentNode;
						var parentExpression = parentNode.parentNode;

						this.expression = parentExpression;
						this.position = this.expression.findNode(parentNode);
						this.position += (relativePosition == "after" ? 1 : 0);
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoChild()
					 *
					 * description:	if the cursor is over a node with a child, moves the
					 *							cursor inside the child expression, to the
					 *							start or end according to `terminus`.
					 *
					 * arguments:		terminus: STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoChild: function(terminus) {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;
						
						//if moving left, only try to enter node after scrolling PAST it
						//otherwise you can't scroll left to the space directly after the node
						if(terminus == "end")	nodeIndex++;

						if(nodeIndex < 0)	/*i.e. if cursor is left of all nodes*/		return false;
						if(nodeIndex >= this.expression.getLength())								return false;
						//if(this.expression.getNode(nodeIndex).type != "function")		return false;

						switch(this.expression.getNode(nodeIndex).type) {
							case "division":		this.expression = this.expression.getNode(nodeIndex).numerator;	break;
							case "exponent":		this.expression = this.expression.getNode(nodeIndex).exponent;	break;
							case "squareRoot":	this.expression = this.expression.getNode(nodeIndex).radicand;	break;
							case "function":		this.expression = this.expression.getNode(nodeIndex).child;			break;
							default:						return false;
						}

						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoNumerator()
					 *
					 * description:	if the cursor is in a denominator (even if it's an
					 *							ancestor), moves the cursor up to the corresponding
					 *							numerator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoNumerator: function(terminus) {
						var node = this.expression;
						while(true) {
							if(node.parentNode === null)						return false;
							if(node.parentNode.type != "division")	return false;

							var divisionNode = node.parentNode;

							if(node.id != divisionNode.denominator.id) {
								node = divisionNode.parentNode;
								continue;
							}

							this.expression = divisionNode.numerator;
							this.position = (terminus == "start" ? 0 : this.expression.getLength());
							return true;
						}
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoDenominator()
					 *
					 * description:	if the cursor is in a numerator (even if it's an
					 *							ancestor), moves the cursor down to the corresponding
					 *							denominator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoDenominator: function(terminus) {
						var node = this.expression;
						while(true) {
							if(node.parentNode === null)						return false;
							if(node.parentNode.type != "division")	return false;

							var divisionNode = node.parentNode;

							if(node.id != divisionNode.numerator.id) {
								node = divisionNode.parentNode;
								continue;
							}

							this.expression = divisionNode.denominator;
							this.position = (terminus == "start" ? 0 : this.expression.getLength());
							return true;
						}
					},
					
					/*******************************************************************
					 * function:		moveLeft()
					 *
					 * description:	attempts to move the cursor one character to the
					 *							left
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveLeft: function() {
						if(this.position === 0) return this.tryMoveIntoParent("before");

						this.position--;
						this.tryMoveIntoChild("end");
						this.show();
					},
					
					/*******************************************************************
					 * function:		moveUp()
					 *
					 * description:	attempts to move the cursor one *logical movement
					 *							unit* up. (currently just moves from denominator
					 *							of fraction to numerator)
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveUp: function() {
						this.tryMoveIntoNumerator("end");
						this.show();
					},
					
					/*******************************************************************
					 * function:		moveRight()
					 *
					 * description:	attempts to move the cursor one character to the
					 *							right
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveRight: function() {
						if(this.position == this.expression.getLength())	return this.tryMoveIntoParent("after");
						
						this.position++;
						this.tryMoveIntoChild("start");
						this.show();
					},

					/*******************************************************************
					 * function:		moveDown()
					 *
					 * description:	attempts to move the cursor one *logical movement
					 *							unit* down. (currently just moves from numerator
					 *							of fraction to denominator)
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveDown: function() {
						this.tryMoveIntoDenominator("end");
						this.show();
					},

					/*******************************************************************
					 * function:		goToPos()
					 *
					 * description:	place cursor at position `pos` in expression.
					 *
					 * arguments:		pos: INT
					 *
					 * return:			none
					 ******************************************************************/
					goToPos: function(pos) {
						this.position = pos;
						this.show();
					},

					/*******************************************************************
					 * function:		goToEnd()
					 *
					 * description:	place cursor at end of expression
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					goToEnd: function() {
						this.position = this.expression.getLength();
						this.show();
					}
				};
				scope.cursor.expression = scope.literalTree;

				scope.output = {
					lastModel: null, //used by $watch('value') to determine if ngModel was altered by this class or from outside
					isValid: true,

					/*******************************************************************
					 * function:		get()
					 *
					 * description:	returns an OpenMath representation of the equation
					 *							in the math input field
					 *
					 * arguments:		none
					 *
					 * return:			STRING
					 ******************************************************************/
					write: function() {
						var literalTreeNodes = scope.literalTree.getNodes().slice(); //use slice() to copy by value, not reference
						var semanticTree = admSemanticParser.buildTree(literalTreeNodes);

						var openMath = "<OMOBJ>";
						openMath += semanticTree.getOpenMath();
						openMath += "</OMOBJ>";

						this.isValid = (semanticTree.type != "error");
						scope.model = this.lastModel = openMath;
					}
				};

				element.on('$destroy', function() {
					//cancel the cursor flash interval
					scope.cursor.hide();
				});
			}
		};
	}]);
})();

(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var ERR_NOT_FOUND							=	1;
	var ERR_UNMATCHED_PARENTHESIS	= 2;
	var ERR_MALFORMED_NUMERAL			= 3;
	var ERR_INVALID_ARGUMENTS 		= 4;
	var ERR_EMPTY_EXPRESSION			= 5;
	var ERR_MISSING_BASE					= 6;

	var mathInput = angular.module("admMathInput", []);

	mathInput.run(["$templateCache", function($templateCache) {
		var expressionTemplate = "";
		expressionTemplate += "<span>";
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
		expressionTemplate += " ng-switch-default";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible),";
		expressionTemplate += "  'exponent': node.type == 'exponent'}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">{{node.getVal()}}</span>";

		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		var inputTemplate = "";
		inputTemplate += "<div";
		inputTemplate += "	class=\"mathinput\"";
		inputTemplate += " tabindex=\"0\"";
		inputTemplate += " ng-keypress=\"control.keypress($event)\"";
		inputTemplate += "	ng-keydown=\"control.keydown($event)\"";
		inputTemplate += " ng-focus=\"control.focus()\"";
		inputTemplate += " ng-blur=\"control.blur()\">";
		inputTemplate += "<adm-math-expression";
		inputTemplate += " cursor=\"cursor\"";
		inputTemplate += " expression=\"literalTree\"";
		inputTemplate += " control=\"control\"></adm-math-expression>";
		inputTemplate += "<input type=\"hidden\" name=\"{{name}}\" value=\"{{value}}\" />";
		inputTemplate += "</div>";
		
		$templateCache.put("adm-math-expression.htm", expressionTemplate);
		$templateCache.put("adm-math-input.htm", inputTemplate);
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

	mathInput.service("literalExpression", function() {
		this.build = function(id, parentNode) {
			return {
				id: id,
				parentNode: (typeof parentNode !== "undefined") ? parentNode : null,
				expressionType: "literal",
				type: "expression",
				nodes: [],
				
				getVal: function() {	return null;	},

				insert: function(pos, node) {
					this.nodes.splice(pos, 0, node);

					return node;
				},

				deleteAt: function(pos) {
					this.nodes.splice(pos, 1);
				},

				getLength: function() {
					return this.nodes.length;
				},

				getNodes: function() {
					return this.nodes;
				},

				getNode: function(index) {
					return this.nodes[index];
				},

				findNode: function(node) {
					for(var i = 0; i < this.nodes.length; i++)
						if(this.nodes[i].id == node.id)
							return i;
				}
			};
		}
	});

	mathInput.service("literalNumeral", function() {
		this.build = function(id, parentNode, value) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "numeral",
				value: value,
				getVal: function() {	return this.value;	}
			};
		}
	});

	mathInput.service("literalLetter", function() {
		this.build = function(id, parentNode, value) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "letter",
				value: value,
				getVal: function() {	return this.value;	}
			};
		}
	});

	mathInput.service("literalParenthesis", function() {
		this.build = function(id, parentNode, paren) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "parenthesis",
				isStart: (paren == "(" ? true : false),
				isEnd: !this.isStart,
				getVal: function() {	return (this.isStart ? "(" : ")");	}
			};
		}
	});

	mathInput.service("literalOperator", function() {
		this.build = function(id, parentNode, operator) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "operator",
				operator: operator,
				getVal: function() {	return this.operator;	}
			};
		}
	});

	mathInput.service("literalExponent", function() {
		this.build = function(id, parentNode, exponentNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "exponent",
				exponent: exponentNode,
				getVal: function() {	return null;	}
			};
		}
	});

	mathInput.service("literalDivision", function() {
		this.build = function(id, parentNode, numeratorNode, denominatorNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "division",
				numerator: numeratorNode,
				denominator: denominatorNode,
				getVal: function() {	return null;	}
			};
		}
	});

	mathInput.factory("literalNode", ["literalExpression", "literalNumeral", "literalLetter", "literalParenthesis",
		 "literalOperator", "literalExponent", "literalDivision",
		 function(literalExpression, literalNumeral, literalLetter, literalParenthesis, literalOperator, literalExponent, literalDivision) {
		var id = 0;

		return {
			buildBlankExpression: function(parentNode) {
				return literalExpression.build(id++, parentNode);
			},
			build: function(parentNode, nodeVal) {

				if(/[0-9.]/.test(nodeVal))		return literalNumeral.build(id++, parentNode, nodeVal);
				if(/[a-zA-Z]/.test(nodeVal))	return literalLetter.build(id++, parentNode, nodeVal);
				if(/[+\-*]/.test(nodeVal))		return literalOperator.build(id++, parentNode, nodeVal);
				if(/[()]/.test(nodeVal))			return literalParenthesis.build(id++, parentNode, nodeVal);

				if(/[\^]/.test(nodeVal)) {
					var exponent = literalExpression.build(id++, null);
					
					var node = literalExponent.build(id++, parentNode, exponent);
					node.exponent.parentNode = node;

					return node;
				}
				if(/[\/]/.test(nodeVal)) {
					var numerator = literalExpression.build(id++, null);
					var denominator = literalExpression.build(id++, null);

					var node = literalDivision.build(id++, parentNode, numerator, denominator);
					node.numerator.parentNode = node;
					node.denominator.parentNode = node;

					return node;
				}
			}
		};
	}]);

	mathInput.service("semanticNumeral", function() {
		this.build = function(value) {
			return {
				expressionType: "semantic",
				type: "numeral",
				value: value,

				getOpenMath: function() {
					if(this.value.indexOf('.') != -1)
						return "<OMF dec='"+this.value+"'/>";
					return "<OMI>"+this.value+"</OMI>";
				}
			};
		}
	});

	mathInput.service("semanticVariable", function() {
		this.build = function(name) {
			return {
				expressionType: "semantic",
				type: "variable",
				name: name,

				getOpenMath: function() {
					return "<OMV name='"+this.name+"'/>";
				}
			};
		}
	});

	mathInput.service("semanticOperator", function() {
		this.build = function(symbol, children) {
			return {
				expressionType: "semantic",
				type: "operator",
				symbol: symbol,
				children: children,

				assertHasValidChildren: function() {
					for(var i = 0; i < 2; i++) {
						if(!this.children[i])																		throw ERR_INVALID_ARGUMENTS;
						if(!this.children[i].hasOwnProperty("expressionType"))	throw ERR_INVALID_ARGUMENTS;
						if(this.children[i].expressionType != "semantic")				throw ERR_INVALID_ARGUMENTS;
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
		}
	});

	mathInput.service("semanticExponent", function() {
		this.build = function(base, exponent) {
			return {
				expressionType: "semantic",
				type: "exponent",
				base: typeof base !== "undefined" ? base : null,
				exponent: typeof exponent !== "undefined" ? exponent : null,

				assertHasValidChildren: function() {
						if(this.base == null || this.exponent == null)		throw ERR_INVALID_ARGUMENTS;
						if(this.base.type == "error")											throw ERR_INVALID_ARGUMENTS;
						if(this.exponent.type == "error")									throw ERR_INVALID_ARGUMENTS;
				},

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='power'>"
						+ this.base.getOpenMath()
						+ this.exponent.getOpenMath()
						+ "</OMA>";
				}
			};
		}
	});

	mathInput.service("semanticDivision", function() {
		this.build = function(numerator, denominator) {
			return {
				expressionType: "semantic",
				type: "division",
				numerator: typeof numerator !== "undefined" ? numerator : null,
				denominator: typeof denominator !== "undefined" ? denominator : null,

				assertHasValidChildren: function() {
						if(this.numerator == null || this.denominator == null)	throw ERR_INVALID_ARGUMENTS;
						if(this.numerator.type == "error")											throw ERR_INVALID_ARGUMENTS;
						if(this.denominator.type == "error")										throw ERR_INVALID_ARGUMENTS;
				},

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='divide'>"
						+ this.numerator.getOpenMath()
						+ this.denominator.getOpenMath()
						+ "</OMA>";
				}
			};
		}
	});

	mathInput.service("semanticError", function() {
		this.build = function(message) {
			return {
				expressionType: "semantic",
				type: "error",
				message: message,

				getOpenMath: function() {
					return "<OME>"+message+"[FIND OUT HOW ERRORS ARE RECORDED]</OME>";
				}
			};
		}
	});

	mathInput.service("semanticNode", ["semanticNumeral", "semanticVariable", "semanticOperator", "semanticExponent",
		 "semanticDivision", "semanticError",
		 function(semanticNumeral, semanticVariable, semanticOperator, semanticExponent, semanticDivision, semanticError) {
		this.build = function(type) {
			switch(type) {
				case "numeral":		return semanticNumeral.build(arguments[1]);										break;
				case "variable":	return semanticVariable.build(arguments[1]);									break;
				case "operator":	return semanticOperator.build(arguments[1], arguments[2]);		break;
				case "exponent":	return semanticExponent.build(arguments[1], arguments[2]);		break;
				case "division":	return semanticDivision.build(arguments[1], arguments[2]);		break;
				case "error":			return semanticError.build(arguments[1]);											break;
			}
		}
	}]);

	mathInput.factory("semanticParser", ["semanticNode", function(semanticNode) {
		/*******************************************************************
		 * function:		assertNotEmpty()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if the collection is empty
		 *
		 * arguments:		nodes:		[literalNode | semanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertNotEmpty(nodes) {
			if(nodes.length == 0)	throw ERR_EMPTY_EXPRESSION;
		}

		/*******************************************************************
		 * function:		assertParenthesesMatched()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if there are any unmatched
		 *							parentheses
		 *
		 * arguments:		nodes:		[literalNode | semanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertParenthesesMatched(nodes) {
			var depth = 0;

			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "parenthesis")				continue;
				
				depth += (nodes[i].isStart ? 1 : -1);
				if(depth < 0)	throw ERR_UNMATCHED_PARENTHESIS;
			}

			if(depth > 0)	throw ERR_UNMATCHED_PARENTHESIS;
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
		 * arguments:		nodes:		[literalNode | semanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseExponents(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "exponent")						continue;
				
				var semanticExp = build(nodes[i].exponent.getNodes().slice());
				nodes.splice(i, 1, semanticNode.build("exponent", null, semanticExp));
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
		 * arguments:		nodes:		[literalNode | semanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function applyExponents(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "semantic")	continue;
				if(nodes[i].type != "exponent")						continue;

				if(i == 0)	throw ERR_MISSING_BASE;

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
		 * arguments:		nodes:		[literalNode | semanticNode]
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
				if(semanticNode.type == "error")	throw ERR_EMPTY_EXPRESSION;

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
		 * arguments:		nodes:		[literalNode | semanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseDivision(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "division")						continue;

				var semanticNumerator = build(nodes[i].numerator.getNodes().slice());
				var semanticDenominator = build(nodes[i].denominator.getNodes().slice());

				var semanticDiv = semanticNode.build("division", semanticNumerator, semanticDenominator);
				semanticDiv.assertHasValidChildren();

				nodes.splice(i, 1, semanticDiv);
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
		 * arguments:		nodes:		[literalNode | semanticNode]
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

				if(numeral == "")																				throw ERR_NOT_FOUND;
				if(numeral.indexOf(".") != numeral.lastIndexOf("."))		throw ERR_MALFORMED_NUMERAL;

				var semanticNum = semanticNode.build("numeral", numeral);
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
		 * arguments:		nodes:		[literalNode | semanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseVariables(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "letter")							continue;

				var semanticVar = semanticNode.build("variable", nodes[i].getVal()); 
				nodes.splice(i, 1, semanticVar);
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
		 * arguments:		nodes:			[literalNode | semanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseImpliedMultiplication(nodes) {
			for(var i = 0; i < nodes.length-1; i++) {
				if(nodes[i].expressionType != "semantic")		continue;
				if(nodes[i+1].expressionType != "semantic")	continue;

				var opNode = semanticNode.build("operator", "*", [nodes[i], nodes[i+1]]);
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
		 * arguments:		nodes:			[literalNode | semanticNode]
		 *							condition:	REGEX
		 *
		 * return:			none
		 ******************************************************************/
		function parseOperators(nodes, condition) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(!condition.test(nodes[i].getVal()))		continue;

				if(i == 0 || i == nodes.length-1)	throw ERR_INVALID_ARGUMENTS;

				var opNode = semanticNode.build("operator", nodes[i].getVal(), [nodes[i-1], nodes[i+1]]);
				opNode.assertHasValidChildren();

				nodes.splice(i-1, 3, opNode);
				i--;
			}
		}

		/*******************************************************************
		 * function:		build()
		 *
		 * description:	takes mixed collection of nodes `nodes` and parses
		 *							into a single semantic node
		 *
		 * arguments:		nodes:	[literalNode | semanticNode]
		 *
		 * return:			semanticNode
		 ******************************************************************/
		function build(nodes) {
			try {
				assertNotEmpty(nodes);
				assertParenthesesMatched(nodes);
				parseParentheses(nodes);
				parseDivision(nodes);
				parseExponents(nodes);		//create exponent semantic nodes, leave base empty for now
				//parse multichar symbols 1 (sin, cos etc)
				parseNumerals(nodes);
				parseVariables(nodes);

				applyExponents(nodes);		//fill in bases of exponent semantic nodes
				//parse multichars 2
				parseImpliedMultiplication(nodes);
				parseOperators(nodes, /[*]/);
				parseOperators(nodes, /[+\-]/);
			} catch(e) {
				switch(e) {
					case ERR_NOT_FOUND:							return semanticNode.build("error", "Missing number.");
					case ERR_UNMATCHED_PARENTHESIS:	return semanticNode.build("error", "Unmatched parenthesis.");
					case ERR_MALFORMED_NUMERAL:			return semanticNode.build("error", "Malformed Number.");
					case ERR_INVALID_ARGUMENTS:			return semanticNode.build("error", "Invalid arguments.");
					case ERR_EMPTY_EXPRESSION:			return semanticNode.build("error", "Empty expression.");
					case ERR_MISSING_BASE:					return semanticNode.build("error", "Exponent has no base.");
					default:												return semanticNode.build("error", "Unidentified error.");
				}
			}

			if(nodes.length > 1)	semanticNode.build("error", "Irreducible expression.");
			return nodes[0];
		}

		return {
			buildTree: function(nodes) {
				return build(nodes);
			}
		};
	}]);
	
	mathInput.directive("admMathInput", ["$interval", "literalNode", "semanticParser", function($interval, literalNode, semanticParser) {
		return {
			restrict: "E",
			replace: true,
			scope: {
				format: "=?admFormat",
				name: "=?admName",
				value: "=?ngModel"
			},
			templateUrl: "adm-math-input.htm",
			link: function(scope, element) {
				scope.format = angular.isDefined(scope.format) ? scope.format : "openmath";
				scope.literalTree = literalNode.buildBlankExpression(null); //the parent literalExpression of the admMathInput

				scope.$watch('value', function(newValue, oldValue) {
					if(newValue == scope.output.lastValue) return;

					/*scope.expression.literal.tree = new scope.expression.literal.nodeTypes.Expression();
					scope.expression.literal.tree.insert(0, "1");
					scope.expression.literal.tree.insert(1, "2");

					scope.output.write();*/
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
						scope.cursor.goToPos(nodeIndex+1);
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
				 *							`insert`									returns none
				 *							`backspace`								returns none
				 *							`tryMoveIntoParent`				returns BOOLEAN
				 *							`tryMoveIntoExponent`			returns BOOLEAN
				 *							`tryMoveIntoDivision`			returns BOOLEAN
				 *							`tryMoveIntoNumerator`		returns BOOLEAN
				 *							`tryMoveIntoDenominator`	returns BOOLEAN
				 *							`moveLeft`								returns none
				 *							`moveUp`									returns none
				 *							`moveRight`								returns none
				 *							`moveDown`								returns none
				 *							`goToPos`									returns none
				 *							`goToEnd`									returns none
				 ******************************************************************/
				scope.cursor = {
					expression: null,			//the literalExpression which the cursor is currently in
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
					 * function:		insert()
					 *
					 * description:	insert character `character` after the node under
					 *							the cursor
					 *
					 * arguments:		character CHAR
					 *
					 * return:			none
					 ******************************************************************/
					insert: function(character) {
						var node = literalNode.build(this.expression, character);

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
						
						if(this.position == 0)	return;

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
					 * function:		tryMoveIntoExponent()
					 *
					 * description:	if the cursor is over an Exponent node, moves the
					 *							cursor inside the exponent expression, to the
					 *							start or end according to `terminus`.
					 *
					 * arguments:		terminus: STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoExponent: function(terminus) {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;
						
						//if moving left, only try to enter node after scrolling PAST it
						//otherwise you can't scroll left to the space directly after the node
						if(terminus == "end")	nodeIndex++;

						if(nodeIndex < 0)	/*i.e. if cursor is left of all nodes*/	return false;
						if(nodeIndex >= this.expression.getLength())							return false;
						if(this.expression.getNode(nodeIndex).type != "exponent")	return false;

						this.expression = this.expression.getNode(nodeIndex).exponent;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());

						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoDivision()
					 *
					 * description:	if the cursor is over a Division node, moves the
					 *							cursor inside the numerator or denominator expression,
					 *							depending on `expression`, and to the start or end
					 *							of that expression according to `terminus`.
					 *
					 * arguments:		expression:	STRING ("numerator"|"denominator")
					 *							terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoDivision: function(expression, terminus) {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;

						//if moving left, only try to enter node after scrolling PAST it
						//otherwise you can't scroll left to the space directly after the node
						if(terminus == "end")	nodeIndex++;
						
						if(nodeIndex < 0)	/*i.e. if cursor is left of all nodes*/	return false;
						if(nodeIndex >= this.expression.getLength())							return false;
						if(this.expression.getNode(nodeIndex).type != "division")	return false;

						var divisionNode = this.expression.getNode(nodeIndex);
						switch(expression) {
							case "numerator":			this.expression = divisionNode.numerator;			break;
							case "denominator":		this.expression = divisionNode.denominator;		break;
						}

						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoNumerator()
					 *
					 * description:	if the cursor is in a denominator, moves the cursor
					 *							up to the corresponding numerator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoNumerator: function(terminus) {
						if(this.expression.parentNode == null)									return false;
						if(this.expression.parentNode.type != "division")				return false;

						var divisionNode = this.expression.parentNode;
						if(this.expression.id !== divisionNode.denominator.id)	return false;

						this.expression = divisionNode.numerator;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoDenominator()
					 *
					 * description:	if the cursor is in a numerator, moves the cursor
					 *							up to the corresponding denominator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoDenominator: function(terminus) {
						if(this.expression.parentNode == null)								return false;
						if(this.expression.parentNode.type != "division")			return false;

						var divisionNode = this.expression.parentNode;
						if(this.expression.id !== divisionNode.numerator.id)	return false;

						this.expression = divisionNode.denominator;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
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
						if(this.position == 0)	return this.tryMoveIntoParent("before");

						this.position--;
						this.tryMoveIntoExponent("end") || this.tryMoveIntoDivision("numerator", "end");
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
						this.tryMoveIntoExponent("start") || this.tryMoveIntoDivision("numerator", "start");
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

				scope.output = {
					lastValue: null, //used by $watch('value') to determine if ngModel was altered by this class or from outside

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
						var semanticTree = semanticParser.buildTree(literalTreeNodes);

						var openMath = "<OMOBJ>";
						openMath += semanticTree.getOpenMath();
						openMath += "</OMOBJ>";

						scope.value = this.lastValue = openMath;
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

/*******************************************************************
* The admLiteralNode object is a temporary format in which
*	mathematical expressions are stored when they are entered into an
*	admMathInput field.
*	They are continuously converted to admSemanticNode objects as the
*	user types, and are never converted back unless to display in
* another admMathInput field.
*******************************************************************/

(function() {
	var module = angular.module("admMathLiteral", []);
	
	module.service("admLiteralExpression", function() {
		this.build = function(id, parentNode) {
			return {
				id: id,
				parentNode: (typeof parentNode !== "undefined") ? parentNode : null,
				expressionType: "literal",
				type: "expression",
				nodes: [],
				
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	},

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
		};
	});

	module.service("admLiteralRelation", function() {
		this.build = function(id, parentNode, symbol) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "relation",
				symbol: symbol,
				getVal: function() {	return symbol;	},
				getDisplay: function() {
					switch(symbol) {
						case "leq":
							return "&le;";
						case "geq":
							return "&ge;";
						default:
							return symbol;
					}
				}
			};
		};
	});

	module.service("admLiteralComma", function() {
		this.build = function(id, parentNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "comma",
				getVal: function() {	return ",";	},
				getDisplay: function() {	return ",";	}
			};
		};
	});

	module.service("admLiteralNumeral", function() {
		this.build = function(id, parentNode, value) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "numeral",
				value: value,
				getVal: function() {	return this.value;	},
				getDisplay: function() {	return this.value;	}
			};
		};
	});

	module.service("admLiteralLetter", function() {
		this.build = function(id, parentNode, value) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "letter",
				value: value,
				getVal: function() {	return this.value;	},
				getDisplay: function() {	return this.value;	}
			};
		};
	});

	module.service("admLiteralPrime", function() {
		this.build = function(id, parentNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "prime",
				getVal: function() {	return "'";	},
				getDisplay: function() {	return "'";	}
			};
		};
	});

	module.service("admLiteralPipe", function() {
		this.build = function(id, parentNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "pipe",
				getVal: function() {	return "|";	},
				getDisplay: function() {	return "|";	}
			};
		};
	});

	module.service("admLiteralSymbol", function() {
		this.build = function(id, parentNode, name) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "symbol",
				name: name,
				getVal: function() {	return this.name;	},
				getDisplay: function() {
					switch(name) {
						case "pi":				return "&pi;";
						case "e":					return "e";
						case "infinity":	return "&infin;";
					}
				}
			};
		};
	});

	module.service("admLiteralParenthesis", function() {
		this.build = function(id, parentNode, paren) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "parenthesis",
				isStart: (paren == "(" ? true : false),
				isEnd: (paren == ")" ? true : false),
				getVal: function() {	return (this.isStart ? "(" : ")");	},
				getDisplay: function() {	return (this.isStart ? "(" : ")");	}
			};
		};
	});

	module.service("admLiteralOperator", function() {
		this.build = function(id, parentNode, operator) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "operator",
				operator: operator,
				getVal: function() {	return this.operator;	},
				getDisplay: function() {
					switch(this.operator) {
						case "*":	return "\&times\;";
						default:	return this.operator;
					}
				}
			};
		};
	});

	module.service("admLiteralExponent", function() {
		this.build = function(id, parentNode, exponentNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "exponent",
				exponent: exponentNode,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.service("admLiteralDivision", function() {
		this.build = function(id, parentNode, numeratorNode, denominatorNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "division",
				numerator: numeratorNode,
				denominator: denominatorNode,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.service("admLiteralSquareRoot", function() {
		this.build = function(id, parentNode, radicandNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "squareRoot",
				radicand: radicandNode,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.service("admLiteralRoot", function() {
		this.build = function(id, parentNode, indexNode, radicandNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "root",
				index: indexNode,
				radicand: radicandNode,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.service("admLiteralLogarithm", function() {
		this.build = function(id, parentNode, base, argument) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "logarithm",
				base: base,
				argument: argument,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.factory("admLiteralNode", ["admLiteralExpression", "admLiteralRelation", "admLiteralComma", "admLiteralNumeral", "admLiteralLetter",
			"admLiteralPrime", "admLiteralPipe", "admLiteralSymbol", "admLiteralParenthesis", "admLiteralOperator", "admLiteralExponent",
			"admLiteralDivision", "admLiteralSquareRoot", "admLiteralRoot", "admLiteralLogarithm",
		 function(admLiteralExpression, admLiteralRelation, admLiteralComma, admLiteralNumeral, admLiteralLetter, admLiteralPrime, admLiteralPipe,
				admLiteralSymbol, admLiteralParenthesis, admLiteralOperator, admLiteralExponent, admLiteralDivision, admLiteralSquareRoot, admLiteralRoot,
				admLiteralLogarithm) {
		var id = 0;

		return {
			buildBlankExpression: function(parentNode) {
				return admLiteralExpression.build(id++, parentNode);
			},
			build: function(parentNode, nodeVal) {
				if(/^[0-9.]$/.test(nodeVal))							{ return admLiteralNumeral.build(id++, parentNode, nodeVal); }
				else if(/^[a-zA-ZΑ-Ωα-ω]$/.test(nodeVal))	{ return admLiteralLetter.build(id++, parentNode, nodeVal); }
				else if(/^\|$/.test(nodeVal))							{ return admLiteralPipe.build(id++, parentNode); }
				else if(/^[+\-*]$/.test(nodeVal))					{ return admLiteralOperator.build(id++, parentNode, nodeVal); }
				else if(/^[()]$/.test(nodeVal))						{ return admLiteralParenthesis.build(id++, parentNode, nodeVal); }
				else if(/^,$/.test(nodeVal))							{ return admLiteralComma.build(id++, parentNode); }
				else if(/^[=<>~]$/.test(nodeVal))					{ return admLiteralRelation.build(id++, parentNode, nodeVal); }
				else if(/^'$/.test(nodeVal))							{ return admLiteralPrime.build(id++, parentNode); }
				else if(/^\^$/.test(nodeVal)) {
					var exponent = admLiteralExpression.build(id++, null);
					
					var node = admLiteralExponent.build(id++, parentNode, exponent);
					node.exponent.parentNode = node;

					return node;
				}
				else if(/^\/$/.test(nodeVal)) {
					var numerator = admLiteralExpression.build(id++, null);
					var denominator = admLiteralExpression.build(id++, null);

					var node = admLiteralDivision.build(id++, parentNode, numerator, denominator);
					node.numerator.parentNode = node;
					node.denominator.parentNode = node;

					return node;
				}
			},
			buildByName: function(parentNode, nodeName) {
				switch(nodeName) {
					case "leq":
					case "geq":
						return admLiteralRelation.build(id++, parentNode, nodeName);
					case "pi":
					case "e":
					case "infinity":
						return admLiteralSymbol.build(id++, parentNode, nodeName);
					case "squareRoot":
						var node = admLiteralSquareRoot.build(id++, parentNode, null);
						node.radicand = admLiteralExpression.build(id++, node);

						return node;
					case "root":
						var node = admLiteralRoot.build(id++, parentNode, null);
						node.index = admLiteralExpression.build(id++, node);
						node.radicand = admLiteralExpression.build(id++, node);

						return node;
					case "log":
						var node = admLiteralLogarithm.build(id++, parentNode, null);
						node.base = admLiteralExpression.build(id++, node);
						node.argument = admLiteralExpression.build(id++, node);

						return node;
					default:
						alert("Node '" + nodeName + "' not supported") //this is an internal function, so should never really happen.
				}
			},
			buildString: function(parentNode, str) {
				var nodes = new Array();
				for(var i = 0; i < str.length; i++)
					nodes.push(this.build(parentNode, str.substr(i, 1)));
				
				return nodes;
			},
			
			nearestCommonAncestor: function(node1, node2) {
				var nodeAncestors = new Array();
				
				[node1, node2].forEach(function(node, index) {
					nodeAncestors[index] = new Array();
					
					nodeAncestors[index].unshift(node);
					while(node.parentNode !== null) {
						node = node.parentNode;
						nodeAncestors[index].unshift(node);
					}
				});
				
				while(nodeAncestors[0][1] == nodeAncestors[1][1]) { //while both trees are the same at least two levels deep (first level assumed)
					nodeAncestors[0].shift();
					nodeAncestors[1].shift();
				}
				
				return nodeAncestors[0][0];
			},
			
			findInNode: function(node, ancestor) {
				while(node.parentNode.id != ancestor.id)
					node = node.parentNode;
				
				for(var i = 0; i < ancestor.nodes.length; i++)
					if(node.id == ancestor.nodes[i].id)
						return i;
			}
		};
	}]);
})();

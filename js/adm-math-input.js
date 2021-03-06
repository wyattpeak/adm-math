(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var module = angular.module("admMathInput", ["ngSanitize", "admMathLiteral", "admMathSemantic", "admMathParser"]);

	module.run(["$templateCache", function($templateCache) {
		var globalClasses = "";
		globalClasses += "'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible),";
		globalClasses += "'highlight': (cursor.expression == expression && cursor.hasSelection && cursor.selectionRange.start <= $index+1 && cursor.selectionRange.end >= $index+1)";
		
		var expressionTemplate = "";
		expressionTemplate += "<span ng-class=\"{'empty-expression': (expression.nodes.length === 0),";
		expressionTemplate += " 'cursor-inside': (cursor.expression == expression)}\">";
		expressionTemplate += "<span";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === 0 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick(expression, -1)\">&nbsp;</span>";
		expressionTemplate += "<span";
		expressionTemplate += " ng-repeat=\"node in expression.nodes track by $index\"";
		expressionTemplate += " ng-switch on=\"node.type\">";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"exponent\"";
		expressionTemplate += " class=\"superscript\"";
		expressionTemplate += " ng-class=\"{" + globalClasses + "}\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.exponent\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"division\"";
		expressionTemplate += " class=\"division\"";
		expressionTemplate += " ng-class=\"{" + globalClasses + "}\">";
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
		expressionTemplate += " class=\"root\"";
		expressionTemplate += " ng-class=\"{" + globalClasses + "}\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.radicand\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"root\"";
		expressionTemplate += " ng-class=\"{" + globalClasses + "}\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " class=\"superscript\"";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.index\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "<span";
		expressionTemplate += " class=\"root\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.radicand\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"function\"";
		expressionTemplate += " ng-class=\"{" + globalClasses + "}\">";
		expressionTemplate += "{{node.getDisplay().start}}";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.child\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "{{node.getDisplay().end}}";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"logarithm\"";
		expressionTemplate += " ng-class=\"{" + globalClasses + "}\">";
		expressionTemplate += "log";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " class=\"subscript\"";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.base\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "(";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.argument\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += ")";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-default";
		expressionTemplate += " ng-class=\"{" + globalClasses + ", 'exponent': node.type == 'exponent'}\"";
		//expressionTemplate += " ng-click=\"control.nodeClick(expression, $index)\" ng-bind-html=\"node.getDisplay()\"></span>";
		expressionTemplate += " ng-mousedown=\"control.nodeMousedown($event, expression, $index)\"";
		expressionTemplate += " ng-mouseup=\"control.nodeMouseup()\"";
		expressionTemplate += " ng-mouseenter=\"control.nodeMouseenter($event, 	expression, $index)\"";
		expressionTemplate += " ng-bind-html=\"node.getDisplay()\"></span>";

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
		inputTemplate += " ng-blur=\"control.blur()\"";
		inputTemplate += " ng-copy=\"control.copy()\"";
		inputTemplate += " ng-cut=\"control.cut()\"";
		inputTemplate += " ng-paste=\"control.paste($event)\">";
		inputTemplate += "<adm-math-expression";
		inputTemplate += " cursor=\"cursor\"";
		inputTemplate += " expression=\"literalTree\"";
		inputTemplate += " control=\"control\"></adm-math-expression>";
		inputTemplate += "<input type=\"hidden\" name=\"{{name}}\" value=\"{{model}}\" />";
		inputTemplate += "<input type=\"hidden\" class=\"clipboard\" />";
		inputTemplate += "</div>";
		
		$templateCache.put("adm-math-expression.htm", expressionTemplate);
		$templateCache.put("adm-math-input.htm", inputTemplate);
	}]);

	module.directive("admMathExpression", function() {
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
	
	module.directive("admInputControl", function() {
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

	module.directive("admMathInput", ["$interval", "admLiteralNode", "admLiteralParser", "admOpenmathParser", "admLatexParser",
			function($interval, admLiteralNode, admLiteralParser, admOpenmathParser, admLatexParser) {
		return {
			restrict: "E",
			replace: true,
			scope: {
				model: "=?ngModel",
				modelAdm: "=?admModelAdm",
				modelOm: "=?admModelOm",
				modelLatex: "=?admModelLatex",
				functions: "@?admFunctions",
				hook: "=?admHook",
				onFocus: "=?admFocus",
				onBlur: "=?admBlur"
			},
			templateUrl: "adm-math-input.htm",
			link: function(scope, element, attrs) {
				scope.format = angular.isDefined(attrs.admFormat) ? attrs.admFormat : "openmath";
				scope.name = angular.isDefined(attrs.name) ? attrs.name : null;
				scope.literalTree = admLiteralNode.buildBlankExpression(null); //the parent admLiteralExpression of the admMathInput
				
				var registeredFunctions = []; //see description for admLiteralParser.build()
				if(typeof scope.functions !== "undefined") {
					var fns = scope.functions.replace(/\s/g, "");
					
					if(/^\[[a-zA-Z]+(,[a-zA-Z]+)*\]$/.test(fns))
						registeredFunctions = fns.slice(1,-1).split(',');
				}

				scope.hook = {
					addSymbol: function(symbol) {
						var nodes = [];
						switch(symbol) {
							case "leq":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "leq")];					break;
							case "geq":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "geq")];					break;
							case "squareRoot":	nodes = [admLiteralNode.buildByName(scope.cursor.expression, "squareRoot")];	break;
							case "pi":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "pi")];					break;
							case "e":						nodes = [admLiteralNode.buildByName(scope.cursor.expression, "e")];						break;
							case "infinity":		nodes = [admLiteralNode.buildByName(scope.cursor.expression, "infinity")];		break;
							case "sin":
							case "cos":
							case "tan":
							case "arcsin":
							case "arccos":
							case "arctan":
							case "ln":					nodes = admLiteralNode.buildString(scope.cursor.expression, symbol+"()");			break;
							case "absolute":		nodes = admLiteralNode.buildString(scope.cursor.expression, "||");						break;
							case "log":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "log")];					break;
							case "root":				nodes = [admLiteralNode.buildByName(scope.cursor.expression, "root")];				break;
							case "power":				nodes = [admLiteralNode.build(scope.cursor.expression, "^")];									break;
							case "exponent":
								nodes = [
									admLiteralNode.buildByName(scope.cursor.expression, "e"),
									admLiteralNode.build(scope.cursor.expression, "^")
								];
								break;
							case "log10":
								var node = admLiteralNode.buildByName(scope.cursor.expression, "log");
								node.base.insert(0, admLiteralNode.build(node.base, "1"));
								node.base.insert(1, admLiteralNode.build(node.base, "0"));

								nodes = [node];
								break;
							default:
								if(/^[0-9.a-zA-ZΑ-Ωα-ω+\-*()\^\/\|,='<>~]$/.test(symbol))	nodes = [admLiteralNode.build(scope.cursor.expression, symbol)];
								else																											alert(symbol + ": Symbol not supported.");
						}
						
						angular.forEach(nodes, function(node) {
							scope.cursor.insertNode(node);
						});
						scope.output.write();
						
						element[0].focus();
						
						switch(symbol) {
							case "squareRoot":	scope.cursor.moveIntoNode(nodes[0].radicand);		break;
							case "sin":
							case "cos":
							case "tan":
							case "arcsin":
							case "arccos":
							case "arctan":
							case "ln":
							case "absolute":		scope.cursor.moveLeft();												break;
							case "log":					scope.cursor.moveIntoNode(nodes[0].base);				break;
							case "root":				scope.cursor.moveIntoNode(nodes[0].index);			break;
							case "power":				scope.cursor.moveIntoNode(nodes[0].exponent);		break;
							case "exponent":		scope.cursor.moveIntoNode(nodes[1].exponent);		break;
							case "log10":				scope.cursor.moveIntoNode(nodes[0].argument);		break;
							case "^":						scope.cursor.moveIntoNode(nodes[0].exponent);		break;
							case "/":						scope.cursor.moveIntoNode(nodes[0].numerator);	break;
						}
					}
				};

				scope.$watch('model', function(newModel, oldModel) {
					if(newModel == scope.output.lastModel) return;
					
					try {
						switch(scope.format) {
							case "adm":
								if(!!newModel)	scope.literalTree = newModel.getAdmLiteral();
								else						scope.literalTree = admLiteralNode.buildBlankExpression(null);
								break;
							case "latex":
								if(!!newModel)	scope.literalTree = admLatexParser.getAdmSemantic(newModel, registeredFunctions).getAdmLiteral();
								else						scope.literalTree = admLiteralNode.buildBlankExpression(null);
								break;
							case "openmath":
							default:
								if(!!newModel)	scope.literalTree = admOpenmathParser.getAdmSemantic(newModel, registeredFunctions).getAdmLiteral();
								else						scope.literalTree = admLiteralNode.buildBlankExpression(null);
						}
					} catch(e) {
						//console.log("scope.$watch error: "+e);
						//just suppress any errors, user can't do anything about them
					}
				});

				/*******************************************************************
				 * object:			control{}
				 *
				 * description:	contains all functions used to handle user input
				 *							and interaction with the math input field
				 *
				 * variables:		`selecting`				BOOLEAN
				 * 
				 * functions:		`focus`						returns none
				 *							`blur`						returns none
				 *							`keypress`				returns none
				 *							`keydown`					returns BOOLEAN | none
				 *							`copy`						returns none
				 *							`cut`							returns none
				 *							`paste`						returns none
				 *							`nodeClick`				returns none
				 *							`nodeMousedown`		returns none
				 *							`nodeMouseup`			returns none
				 *							`nodeMouseenter`	returns none
				 ******************************************************************/
				scope.control = {
					selecting: false,	//is the left mouse button held down, should moving the mouse select nodes?
					
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
						if(scope.cursor.expression === null)
							scope.cursor.expression = scope.literalTree;
						
						if(scope.cursor.position === null)
							scope.cursor.goToExpressionEnd();
						else
							scope.cursor.show();
						
						switch(typeof scope.onFocus) {
							case "function":
								scope.onFocus();
								break;
							case "object":
								scope.onFocus[0].apply(null, scope.onFocus.slice(1));
						}
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
						
						switch(typeof scope.onBlur) {
							case "function":
								scope.onBlur();
								break;
							case "object":
								scope.onBlur[0].apply(null, scope.onBlur.slice(1));
						}
					},

					/*******************************************************************
					 * function:		keypress()
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
						if(e.ctrlKey)	//don't capture control combinations
							return;
						
						var character = String.fromCharCode(e.which);
						if(/[a-zA-Z0-9.+\-*()\^|,='<>~]/.test(character)) {
							scope.cursor.insert(character);
							e.preventDefault();
						}

						scope.output.write();
					},

					/*******************************************************************
					 * function:		keydown()
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
							case 35:	/*end*/							scope.cursor.goToEnd();									break;
							case 36:	/*home*/						scope.cursor.goToStart();								break;
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
					 * function:		copy()
					 *
					 * description:	run on ngCopy of math input field
					 *							copy selected content into OpenMath format. format
					 *							isn't ideal for pasting elsewhere but anything
					 *							readable would need a new converter build and would
					 *							likely be ambiguous anyway.
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					copy: function() {
						if(!scope.cursor.hasSelection)
							return;
						
						var copyLiteral = admLiteralNode.buildBlankExpression(null);
						
						for(var i = scope.cursor.selectionRange.start; i <= scope.cursor.selectionRange.end; i++)
							copyLiteral.insert(i-scope.cursor.selectionRange.start, scope.cursor.expression.getNode(i-1));
						
						var semantic = admLiteralParser.getAdmSemantic(copyLiteral, registeredFunctions);
						var om = semantic.getOpenMath();
						
						//text can only be copied to the clipboard from an element, so create one
						var el = document.createElement('textarea');
						el.value = om;
						el.setAttribute('readonly', '');
						el.style = {position: 'absolute', left: '-9999px'};
						
						document.body.appendChild(el);
						el.select();
						document.execCommand('copy');
						document.body.removeChild(el);
						
						element[0].focus();
					},
					
					/*******************************************************************
					 * function:		cut()
					 *
					 * description:	run on ngCut of math input field
					 *							cuts, stores result in clipboard in OpenMath format
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					cut: function() {
						if(!scope.cursor.hasSelection)
							return;
						
						scope.control.copy();
						scope.cursor.selectionDelete();
						
						scope.output.write();
					},

					/*******************************************************************
					 * function:		paste()
					 *
					 * description:	run on ngPaste of math input field
					 *							if contents of clipboard are valid OpenMath, paste
					 *							those contents at cursor position
					 *
					 * arguments:		e:	Event
					 *
					 * return:			none
					 ******************************************************************/
					paste: function(e) {
						var om = e.clipboardData.getData('text');
						
						var literalExpression = null;
						try {
							literalExpression = admOpenmathParser.getAdmSemantic(om, registeredFunctions).getAdmLiteral();
						} catch(e) {
							return; //if it's not correctly formatted, it can't go in, nothing more to it
						}
						
						for(var i = 0; i < literalExpression.getLength(); i++)
							scope.cursor.insertNode(literalExpression.getNode(i));
						
						scope.output.write();
					},

					/*******************************************************************
					 * function:		nodeClick()
					 *
					 * description:	run when an individual node element is clicked
					 *							moves cursor over the node at `nodeIndex` rather
					 *							than at the end of the math input field
					 *
					 * arguments:		node admLiteralNode
					 *							nodeIndex	INT
					 *
					 * return:			none
					 ******************************************************************/
					nodeClick: function(node, nodeIndex) {
						//due to differing indices, position must be 1 higher than nodeIndex
						scope.cursor.moveIntoNode(node, nodeIndex+1);
					},

					/*******************************************************************
					 * function:		nodeMousedown()
					 *
					 * description:	run when an individual node element is mousedowned.
					 *							begins selection of nodes, starting at `nodeIndex`
					 *
					 * arguments:		node admLiteralNode
					 *							nodeIndex	INT
					 *
					 * return:			none
					 ******************************************************************/
					nodeMousedown: function(event, node, nodeIndex) {
						event.preventDefault();
						element[0].focus(); //need to focus explicitly since bubbling prevented, otherwise input can lack focus even after selecting
						
						this.selecting = true;
						
						//due to differing indices, position must be 1 higher than nodeIndex
						scope.cursor.selectionStart(node, nodeIndex+1);
					},

					/*******************************************************************
					 * function:		nodeMouseup()
					 *
					 * description:	run when an individual node element is mouseupped.
					 *							ends the selecting of nodes.
					 *
					 * arguments:		NONE
					 *
					 * return:			none
					 ******************************************************************/
					nodeMouseup: function() {
						this.selecting = false;
						
						scope.cursor.selectionEnd();
					},

					/*******************************************************************
					 * function:		nodeMouseenter()
					 *
					 * description:	run when the mouse moves over a node. if selection
					 *							is occurring (left mouse button is held down)
					 *							extends the selection to include the node at
					 *							`nodeIndex`
					 *							NOTE: `node` is the parent node, not the node being
					 *							selected
					 *
					 * arguments:		node admLiteralNode
					 *							nodeIndex	INT
					 *
					 * return:			none
					 ******************************************************************/
					nodeMouseenter: function(event, node, nodeIndex) {
						event.preventDefault();
						
						if(this.selecting) {
							//due to differing indices, position must be 1 higher than nodeIndex
							scope.cursor.selectionExtend(node, nodeIndex+1);
						}
					}
				};

				/*******************************************************************
				 * object:			cursor{}
				 *
				 * description:	contains all functions used to move the cursor
				 *							around the math input field, and relevant state
				 *							variables
				 *
				 * variables:		`expression`					scope.literal.nodeTypes.Expression
				 *							`position`						INT
				 *							`selectionStartedAt`	OBJECT {`expression`: admLiteralNode, `position`: INT}
				 *							`selectionRange`			OBJECT {`start`: INT, `end`: INT}
				 *							`visible`							BOOLEAN
				 *							`flashInterval`				Angular `promise`
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
				 *							`moveIntoNode`						returns none
				 *							`goToExpressionEnd`				returns none
				 *							`goToStart`								returns none
				 *							`goToEnd`									returns none
				 *							`selectionStart`					returns none
				 *							`selectionExtend`					returns none
				 ******************************************************************/
				scope.cursor = {
					expression: null,																			//the admLiteralExpression which the cursor is currently in
					position: null,																				//the position of the cursor within `expression`
					hasSelection: false,																	//is a section currently highlighted
					selectionStartedAt: {expression: null, position: 0},	//the expression and position where the selection started
					selectionRange: {start: 0, end: 0},										//the range of positions, inclusive, in cursor.expression which are highlighted
					visible: false,																				//flag for whether the cursor should be visible (alternates for cursor flash)
					flashInterval: null,																	//handle for cursor flashing interval

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
						
						var numeratorEmpty = true;

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

							numeratorEmpty = false;
							this.position--;
						}
						this.expression.insert(this.position, node);

						if(numeratorEmpty)	this.expression = node.numerator;
						else								this.expression = node.denominator;
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
						
						if(this.hasSelection)
							this.selectionDelete();

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
						if(this.hasSelection)
							this.selectionDelete();
						
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
						if(this.hasSelection) {
							this.selectionDelete();
						} else {
							//due to differing indices, this.position-1 is the node under the cursor
							var nodeIndex = this.position - 1;
							
							if(this.position === 0)	return;

							this.expression.deleteAt(nodeIndex);
							this.position--; //can't use this.moveLeft(), as this will run tryMoveIntoChild(), which can result in unexpected behaviour
							this.show();
						}
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

						//every expression except the root expression (scope.literalTree)
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
							case "root":
								if(terminus == "start")	this.expression = this.expression.getNode(nodeIndex).index;
								if(terminus == "end")		this.expression = this.expression.getNode(nodeIndex).radicand;
								break;
							case "logarithm":
								if(terminus == "start")	this.expression = this.expression.getNode(nodeIndex).base;
								if(terminus == "end")		this.expression = this.expression.getNode(nodeIndex).argument;
								break;
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
					 * function:		tryMoveIntoLogBase()
					 *
					 * description:	if the cursor is in the argument of a logarithm,
					 *							moves the cursor to the base
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoLogBase: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)						return false;
						if(node.parentNode.type != "logarithm")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.argument.id)			return false;

						this.expression = logNode.base;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},

					/*******************************************************************
					 * function:		tryMoveIntoLogArgument()
					 *
					 * description:	if the cursor is in the base of a logarithm,
					 *							moves the cursor to the argument
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoLogArgument: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)						return false;
						if(node.parentNode.type != "logarithm")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.base.id)					return false;

						this.expression = logNode.argument;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoRootIndex()
					 *
					 * description:	if the cursor is in the radicand of a root,
					 *							moves the cursor to the index
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoRootIndex: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)				return false;
						if(node.parentNode.type != "root")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.radicand.id)	return false;

						this.expression = logNode.index;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoRootRadicand()
					 *
					 * description:	if the cursor is in the index of a root,
					 *							moves the cursor to the radicand
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoRootRadicand: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)				return false;
						if(node.parentNode.type != "root")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.index.id)			return false;

						this.expression = logNode.radicand;
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
						this.hasSelection = false;
						
						if(this.position === 0)
							return this.tryMoveIntoLogBase("end") || this.tryMoveIntoRootIndex("end") || this.tryMoveIntoParent("before");

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
						this.hasSelection = false;
						
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
						this.hasSelection = false;
						
						if(this.position == this.expression.getLength())
							return this.tryMoveIntoLogArgument("start") || this.tryMoveIntoRootRadicand("start") || this.tryMoveIntoParent("after");
						
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
						this.hasSelection = false;
						
						this.tryMoveIntoDenominator("end");
						this.show();
					},

					/*******************************************************************
					 * function:		moveIntoNode()
					 *
					 * description:	moves the cursor into `node` (e.g. a sqrt, or just
													the main expression) at position `position`
					 *
					 * arguments:		`node` AdmLiteralNode
					 *							`position` INT
					 *
					 * return:			none
					 ******************************************************************/
					moveIntoNode: function(node, position) {
						if(typeof position === "undefined")	position = 0;
						
						this.expression = node;
						this.position = position;
						this.show();
					},
					
					/*******************************************************************
					 * function:		goToExpressionEnd()
					 *
					 * description:	place cursor at end of the current expression
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					goToExpressionEnd: function() {
						this.position = this.expression.getLength();
						this.show();
					},
					
					/*******************************************************************
					 * function:		goToStart()
					 *
					 * description:	place cursor at start of the input
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					goToStart: function() {
						while(this.expression.parentNode !== null)
							this.expression = this.expression.parentNode;
						
						this.position = 0;
						this.show();
					},
					
					/*******************************************************************
					 * function:		goToEnd()
					 *
					 * description:	place cursor at end of the input
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					goToEnd: function() {
						while(this.expression.parentNode !== null)
							this.expression = this.expression.parentNode;
						
						this.position = this.expression.getLength();
						this.show();
					},

					/*******************************************************************
					 * function:		selectionStart()
					 *
					 * description:	begins selecting a range of nodes in `expression`,
					 *							starting at `position`
					 *							doesn't set this.hasSelection=true until
					 *							this.selectionExtend runs to avoid a flashing
					 *							highlight when a node is simply clicked
					 *
					 * arguments:		`expression` AdmLiteralNode
					 *							`position` INT
					 *
					 * return:			none
					 ******************************************************************/
					selectionStart: function(expression, position) {
						this.hasSelection = false; //so that, if something is already highlighted, this doesn't show the first thing you click on as highlighted
						
						this.selectionStartedAt.expression	= this.expression	= expression;
						this.selectionStartedAt.position		= this.position		= position;
						
						this.selectionRange.start = position;
						this.selectionRange.end = position;
						
						this.show();
					},

					/*******************************************************************
					 * function:		selectionExtend()
					 *
					 * description:	extends the range of the selection to include the
					 *							at `position` in `expression`
					 *
					 * arguments:		`expression` AdmLiteralNode
					 *							`position` INT
					 *
					 * return:			none
					 ******************************************************************/
					selectionExtend: function(expression, position) {
						this.hasSelection = true;
						
						if(expression == this.selectionStartedAt.expression) {
							this.expression = expression;
							
							if(position < this.selectionStartedAt.position) {
								this.selectionRange.start = position;
								this.selectionRange.end = this.selectionStartedAt.position;
							} else {
								this.selectionRange.start = this.selectionStartedAt.position;
								this.selectionRange.end = position;
							}
						} else {
							var ancestorNode = admLiteralNode.nearestCommonAncestor(expression, this.selectionStartedAt.expression);
							
							if(ancestorNode.type == "expression") {
								this.expression = ancestorNode;
								
								var startPos = null;
								if(ancestorNode.id == this.selectionStartedAt.expression.id)
									startPos = this.selectionStartedAt.position;
								else
									startPos = admLiteralNode.findInNode(this.selectionStartedAt.expression, ancestorNode) + 1; //selectionRange index is off by one from node index
								
								var endPos = null;
								if(ancestorNode.id == expression.id)
									endPos = position;
								else
									endPos = admLiteralNode.findInNode(expression, ancestorNode) + 1;
								
								if(startPos <= endPos) {
									this.selectionRange.start = startPos;
									this.selectionRange.end = endPos;
								} else {
									this.selectionRange.start = endPos;
									this.selectionRange.end = startPos;
								}
							} else {
								this.expression = ancestorNode.parentNode;
								
								var nodePosition = ancestorNode.parentNode.findNode(ancestorNode);
								
								this.selectionRange.start = this.selectionRange.end = nodePosition+1;
							}
						}
						
						this.position = this.selectionRange.end;
						this.show();
					},

					/*******************************************************************
					 * function:		selectionEnd()
					 *
					 * description:	ends the selection of a range. if only one element
					 *							is selected, cancels selection.
					 *
					 * arguments:		NONE
					 *
					 * return:			none
					 ******************************************************************/
					selectionEnd: function() {
						if(this.selectionRange.start == this.selectionRange.end) {
							this.hasSelection = false;
						}
						
						this.show();
					},
					
					/*******************************************************************
					 * function:		selectionDelete()
					 *
					 * description:	deletes the selected part of the expression.
					 *
					 * arguments:		NONE
					 *
					 * return:			none
					 ******************************************************************/
					selectionDelete: function() {
						if(!this.hasSelection)
							return;
						
						while(this.selectionRange.start <= this.selectionRange.end) {
							this.expression.deleteAt(this.selectionRange.start-1); //selectionRange index is off by one from node index
							this.selectionRange.end--;
							this.position--;
						}
						
						this.hasSelection = false;
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
						try {
							var semantic = admLiteralParser.getAdmSemantic(scope.literalTree, registeredFunctions);

							scope.modelAdm = semantic;
							scope.modelOm = semantic.getOpenMath();
							scope.modelLatex = semantic.getLatex();
							
							this.isValid = (semantic.type !== "error") ? true : false;
						} catch(e) {
							scope.modelAdm = null;
							scope.modelOm = "<OMOBJ><OME>"+e+"</OME></OMOBJ>";
							scope.modelLatex = "\\text{Error: "+e+"}";
							
							this.isValid = false;
						}
						
						switch(scope.format) {
							case "adm":		scope.model = scope.modelAdm;		break;
							case "latex":	scope.model = scope.modelLatex;	break;
							default:			scope.model = scope.modelOm;
						}
						
						this.lastModel = scope.model;
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

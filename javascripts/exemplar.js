/**
 * Jupiter how I miss you; a lovely glow has alway consumed me.
 * 
 * BTW: This code will work in modern browsers (Gecko 1.9.1+, Webkit 532+)
 * it's not meant to be backwards compatible, lets levereage new tech K?
 * 
 * Copyright (c) 2009 Adam Elliot
 */

var Exemplar = function() {
  
  /**
   * Draws an arrow in a canvas element from one point to another and returns
   * a canvas element it's drawn in. By default it's attached to the container
   * element, unless specified false.
   * 
   * If container is null it's drawn in the body. Container is a jQuery
   * selector.
   */
  var drawArrow = function(x1, y1, x2, y2, container) {
    var canvas = $("<canvas></canvas>");
    if (container === undefined) container = $("body");
    else if (container === false) container = null;
    else container = $(container);

    var x = Math.min(x1, x2);
    var y = Math.min(y1, y2);
    
    x1 -= x; x2 -= x;
    y1 -= y; y2 -= y;

    if (container) container.append(canvas);

    canvas.attr("width", Math.abs(x2 - x1));
    canvas.attr("height", Math.abs(y2 - y1));

    var ctx = canvas.get(0).getContext('2d');

    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    return canvas;
  };
  
  /**
   * Represents an html element on the page. Everything that has JS tied to it
   * is an Element, which is pretty much everything in the application.
   * 
   * container can be a jQuery selector, a jQuery object, or another Element
   */
  var Element = function(id, className, container) {
    var element = $("<div></div>");
    var children = [];

    if (id) element.attr("id", id);
    if (className) element.attr("class", className);

    if (container) {
      if (container instanceof jQuery) container.append(element);
      else if (container instanceof this.constructor) container.$.append(element);
      else if (typeof container == 'string') jQuery(container).append(element);
    }

    this.addElement = function(child) {
      children.push(child);
      element.append(child.$);
    };

    /**
     * Generate the html node for this view and return a jQuery object.
     */
    this.__defineGetter__("$", function() {
      return element;
    });
  };

  /**
   * Heirachry for screens and views
   */
  var View = function(config, className) {
    this.__proto__ = new Element(null, className);

    config = config || {};

    /**
     * R/O Access to the config vars
     */
    this.__defineGetter__("config", function() {
      return config;
    });

    /**
     * Used to describe to the inspector what options this view has.
     * None by default.
     */
    this.builder = function() {
      return {};
    };

    /**
     * Generally called from the inspector to set new config vars.
     */
    this.update = function() {

    };
  };

  var Screen = function(config) {
    this.__proto__ = new View(config, 'screen');
  };
  
  /**
   * The collection of screens.
   */
  var ScreenSet = function(root) {
    root = root || "body";
    this.__proto__ = new Element('screen_set', null, root);

    /**
     * Adds a new Screen to the Canvas
     */
    this.createScreen = function() {
      this.addElement(new Screen());
    };
  };

  /**
   * Interface Elements
   */
  var Interface = (function() {
    var root;

    /**
     * The little widget for customizing the screens
     */
    var Inspector = function() {
      this.__proto__ = new Element('inspector', null, root);
      this.$.draggable({containment: '#canvas'});
    };
    
    var Toolbar = function(screenSet) {
      var addScreen = $("<button>Add Screen</button>");
      
      this.__proto__ = new Element('toolbar', null, root);
      this.$.append(addScreen);
      
      addScreen.click(function() {
        screenSet.createScreen();
      });
    };

    /**
     * Where all the screens are displayed.
     */
    var Canvas = function() {
      this.__proto__ = new Element('canvas', null, root);
      this.screenSet = new ScreenSet(this);
      
      var screens = $("<div></div>");
      screens.attr("id", "screens");

      this.$.append(screens);
    };

    var Klass = function(_root) {
      root = _root || "body";

      var canvas = new Canvas();
      var toolbar = new Toolbar(canvas.screenSet);
      var inspector = new Inspector();
    };

    return Klass;
  })();

  var interface = new Interface();
};


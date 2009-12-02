/**
 * Jupiter how I miss you; a lovely glow has alway consumed me.
 * 
 * BTW: This code will work in modern browsers (Gecko 1.9.1+, Webkit 532+)
 * it's not meant to be backwards compatible, lets levereage new tech K?
 * 
 * Copyright (c) 2009 Adam Elliot
 */

 /**
  * Some useful string manipulations. Lets us convert from the Javascript
  * name to the css class name to the human name.
  */
String.prototype.camelize = function() {
  return this.charAt(0).toUpperCase() +
    this.substring(1).replace(/[\-\_]([a-z])/ig, function(z, a) {
      return a.toUpperCase();
    });
};
String.prototype.underscore = function() {
  return (this.charAt(0) + this.substring(1).replace(/([A-Z])/g, function(z, a) {
    return "_" + a;
  })).replace(/([\-])/g, "_").toLowerCase();
};
String.prototype.hypenate = function() {
  return (this.charAt(0) + this.substring(1).replace(/([A-Z])/g, function(z, a) {
    return "-" + a;
  })).replace(/([\_])/, "-").toLowerCase();
};
String.prototype.humanize = function() {
  return this.replace(/([\_\-])/g, function(z, a) {
    return " ";
  }).replace(/(^[a-z]| [a-z])/g, function(z, a) {
    return a.toUpperCase();
  });
};

var Exemplar = function() {
  
  // This collection is used to dynamically create view objects.
  var views = {};
  var interface;

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
   * The base view should understand how most views are structured, and based
   * on the config set will draw things how we want them. The sub classes
   * mostly just provide the potential options so the inspector can set the
   * right style sheets and provide the right options.
   */
  views.View = function(className, config, builder) {
    this.__proto__ = new Element(null, className);
    var self = this;
    var subviews = {};

    config  = config  || {};
    builder = builder || {};

    // Ensure the appropriate sections exists
    config.toggles  = config.toggles  || {};
    config.labels   = config.labels   || {};
    config.configs  = config.configs  || {};
    
    builder.types   = builder.types   || {};
    builder.toggles = builder.toggles || [];
    builder.labels  = builder.labels  || [];

    /**
     * R/O Access to the config block
     */
    this.__defineGetter__("config", function() { return config; });

    /**
     * Used to describe to the inspector what options this view has.
     * None by default.
     */
    this.__defineGetter__("builder", function() { return builder; });

    /**
     * Return a list of the attached subviews
     */
    this.__defineGetter__("subviews", function() { return subviews; });

    /**
     * Generally called from the inspector to set new config vars.
     */
    this.update = function() {
      var insert = this.$.prepend, target = this.$, name;
      
      var autoSizeList = [];
      var size = this.$.height();

      // Create the internal views
      for (var i = 0; i < builder.toggles.length; i++) {
        name = builder.toggles[i];

        if (subviews[name]) {
          if (config.toggles[name] !== true) {
            subviews[name].destroy();
            subviews[name] = undefined;
          }
          else {
            target = subviews[name].$;
            insert = subviews[name].$.after;
          }
        } else {
          if (config.toggles[name] === true) {
            var className = builder.types[name] || name;
            var type = views[className.camelize()];
            
            if (type) {
              var view = subviews[name] = new type(config.configs[name]);
              if (className != name) view.$.addClass(name);

              insert.call(target, view.$);
              target = view.$;
              insert = view.$.after;
            }
          }
        }
        
        var subview = subviews[name];
        if (subview) {
          if (subview.config.autoSize === true)
            autoSizeList.push(subview);
          else
            size -= subview.$.outerHeight();
        }
      }

      size /= autoSizeList.length;
      for (var i = 0; i < autoSizeList.length; i++) {
        autoSizeList[i].$.css({height: size});
        autoSizeList[i].update();
      }

      // Set the label values
      for (var i = 0; i < builder.labels.length; i++) {
        name = builder.labels[i];
        this.$.find("> ." + name).text(config.labels[name] || "");
      }
    };

    /**
     * Remove the view and cleanup anything that needs to be cleaned.
     */
    this.destroy = function() {
      this.$.remove();
    };

    /**
     * Used to populate the inspector
     */
    this.$.click(function(event) {
      if (self.builder.toggles.length <= 0 && self.builder.labels.length <= 0)
        return;

      interface.inspectView(self);
      
      event.stopPropagation();
    });

    this.update();
  };

  views.StatusBar = function() {
    this.__proto__ = new views.View('status-bar');
    
    var time = (new Date).toTimeString().split(":");
    time = time[0] + ":" + time[1];

    this.$.append("<div class='network'>EXEMPLAR</div>");
    this.$.append("<div class='battery'>77%</div>");
    this.$.append("<div class='time'>" + time + "</div>");
  };
  
  views.Keyboard = function() {
    this.__proto__ = new views.View('keyboard');
  };
  
  views.NavigationBar = function(config) {
    this.__proto__ = new views.View('navigation-bar', $.extend({
      configs: {back: {labels: {title: 'Back'}}, edit: {labels: {title: 'Edit'}}},
      toggles: {back: true},
      labels:  {title: 'New Screen'}
    }, config), {
      types:   {back: 'toolbar-button', edit: 'toolbar-button'},
      toggles: ['back', 'edit'],
      labels:  ['title']
    });

    this.$.append("<div class='title'>?</div>");

    this.update();
  };

  views.TextView = function(config) {
    this.__proto__ = new views.View('text-view', config);
  };

  views.TableViewSearch = function(config) {
    this.__proto__ = new views.View('table-view-search', config);
  };

  views.TableView = function(config) {
    this.__proto__ = new views.View('table-view', $.extend({
      autoSize: true
    }, config), {
      toggles: ['table-view-search']
    });
  };

  /**
   * This is a special view who's vertical size is auto adjusted.
   */
  views.ContentView = function(config) {
    this.__proto__ = new views.View('content-view', $.extend({
      autoSize: true
    }, config), {
      toggles: ['content-view', 'table-view']
    });
  };

  views.Toolbar = function(config) {
    this.__proto__ = new views.View('toolbar', config);
  };
  
  views.ToolbarButton = function(config) {
    this.__proto__ = new views.View('toolbar-button', $.extend({
    }, config), {
      labels: ['title']
    });

    this.$.append("<div class='title'></div>");

    this.update();
  };

  views.Window = function(config) {
    this.__proto__ = new views.View('window', $.extend({
      toggles: {'status-bar': true, 'navigation-bar': true, 'content-view': true}
    }, config), {
      toggles: ['status-bar', 'navigation-bar', 'content-view', 'toolbar', 'keyboard']
    });
  };
  
  /**
   * The collection of screens.
   */
  var Application = function(root) {
    root = root || "body";
    this.__proto__ = new Element('application', null, root);

    var scale = 1.0;

    this.$.draggable();

    this.__defineSetter__("scale", function(val) {
      val = parseFloat(val);
      if (isNaN(val)) return;

      scale = val;

      this.$.css("-webkit-transform", "scale(" + scale + ")");
    });
    this.__defineGetter__("scale", function() { return scale; });

    /**
     * Adds a new Screen to the Canvas
     */
    this.createWindow = function() {
      this.addElement(new views.Window());
    };
  };

  /**
   * Interface Elements
   */
  Interface = function(root) {
    root = root || "body";

    var application, canvas, toolbar, inspector;

    /**
     * The little widget for customizing the screens
     */
    var Inspector = function() {
      this.__proto__ = new Element('inspector', null, root);
      this.$.draggable({containment: '#canvas'});

      var selector = $("<div id='selector'></div>"), view;
      $(root).append(selector);
      selector.hide();

      /**
       * Draw the label text fields
       */
      var drawLabels = function(labels) {
        var firstResponder;

        for (var i = 0; i < labels.length; i++) {
          var id = "label_" + labels[i].underscore();
          var html = $("<div></div>");
          var input = $("<input type='text' placeholder='" + labels[i].humanize() + "' id='" + id + "' />");

          input.keyup((function() {
            var name = labels[i];
            return function() {
              view.config.labels[name] = $("#label_" + name.underscore()).val();
              view.update();
            }; 
          })());

          if (view.config.labels[labels[i]] !== undefined)
            input.val(view.config.labels[labels[i]]);

          firstResponder = firstResponder || input;

          html.append(input);

          this.$.append(html);
        }
        
        if (firstResponder) 
          if (firstResponder.val() == '') firstResponder.focus();
          else firstResponder.select();
      };

      /**
       * Draw the toggle buttons
       */
      var drawToggles = function(toggles) {
        for (var i = 0; i < toggles.length; i++) {
          var id = "toggle_" + toggles[i].underscore();
          var html = $("<div></div>");
          var input = $("<input type='checkbox' id='" + id + "' />");
          var label = $("<label for='" + id + "'>" + toggles[i].humanize() + "</label>");

          input.click((function() {
            var name = toggles[i];
            return function() {
              view.config.toggles[name] = !view.config.toggles[name];
              view.update();
            }; 
          })());

          if (view.config.toggles[toggles[i]] === true) input.attr('checked', true);

          html.append(input);
          html.append(label);

          this.$.append(html);
        }
      };

      var populate = function() {
        if (!view || !view.builder) return;
        this.$.empty();

        drawLabels.call(this, view.builder.labels);
        drawToggles.call(this, view.builder.toggles);
      };

      this.__defineSetter__('view', function(val) {
        view = val;
        
        selector.css({
          left:   view.$.offset().left,
          top:    view.$.offset().top,
          width:  view.$.outerWidth(),
          height: view.$.outerHeight(),
        });
        selector.show();
        // FIXME: Without the fade out nested elements become untouchable
        selector.fadeOut("fast");
        
        populate.call(this);
      });
    };
    
    var Toolbar = function() {
      var addScreen = $("<button class='add-screen'>Add Screen</button>");
      var scale = $("<input type='range' class='scale' value='100' />");

      this.__proto__ = new Element('toolbar', null, root);

      this.$.append(scale);
      this.$.append(addScreen);
      
      addScreen.click(function() {
        application.createWindow();
      });

      scale.change(function() {
        application.scale = (parseFloat($(this).val()) + 25) / 125;
      });
    };

    /**
     * Where all the screens are displayed.
     */
    var Canvas = function() {
      this.__proto__ = new Element('canvas', null, root);
      
      var screens = $("<div></div>");
      screens.attr("id", "screens");

      this.$.append(screens);
    };

    this.inspectView = function(view) {
      inspector.view = view;
    };

    canvas = new Canvas();
    toolbar = new Toolbar(canvas.screenSet);
    inspector = new Inspector();

    application = new Application(canvas);
    application.createWindow();
  };

  interface = new Interface();
};


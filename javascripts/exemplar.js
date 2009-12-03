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
    var dataViews = [];
    var parent;

    config  = config  || {};
    builder = builder || {};

    // Ensure the appropriate sections exists
    config.toggles    = config.toggles    || {};
    config.labels     = config.labels     || {};
    config.options    = config.options    || {};
    config.configs    = config.configs    || {};
    config.data       = config.data       || [];
    
    builder.types     = builder.types     || {};
    builder.toggles   = builder.toggles   || [];
    builder.labels    = builder.labels    || [];
    builder.required  = builder.required  || {};
    builder.options   = builder.options   || {};
    
    // The data-views is always required
    builder.required["data-views"] = true;

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
     * Return a list of the attached subviews.
     */
    this.__defineGetter__("subviews", function() { return subviews; });

    /**
     * Used for traversal of the the heirachy when saving / destroying
     * and updating the inspector
     */
     this.__defineGetter__("parent", function() { return parent; });
     this.__defineSetter__("parent", function(val) { parent = val; });

    /**
     * Adds data of builder.dataType with the specified config, or just
     * default.
     */
    this.addData = function(config) {
      var type = views[(builder.dataType || "").camelize()];
      if (!type) return;

      var insert = this.$.prepend, target = this.$;

      if (dataViews.length > 0) {
        target = dataViews[dataViews.length - 1].$;
        insert = target.after;
      } else {
        for (var i = 0; i < builder.toggles.length; i++) {
          if (subviews[builder.toggles[i]]) {
            target = subviews[builder.toggles[i]].$;
            insert = target.after;
          }

          if (builder.toggles[i + 1] == 'data-views') break;
        }
      }
      
      var view = new type(config);
      view.parent = self;
      dataViews.push(view);

      insert.call(target, view.$);
    };

    /**
     * Generally called from the inspector to set new config vars.
     */
    this.update = function() {
      var insert = this.$.prepend, target = this.$, name;
      if (views[(builder.dataType || "").camelize()] &&
        builder.toggles.indexOf('data-views') == -1)
        builder.toggles.push('data-views')

      var autoSizeList = [];
      var size = this.$.height();
      var changedViews = false;

      // Create the internal views
      for (var i = 0; i < builder.toggles.length; i++) {
        name = builder.toggles[i];

        if (subviews[name]) {
          if (config.toggles[name] !== true) {
            subviews[name].destroy();
            changedViews = true;
            subviews[name] = undefined;
          }
          else {
            target = subviews[name].$;
            insert = subviews[name].$.after;
          }
        } else if (name == 'data-views') {
          if (dataViews.length > 0) {
            target = dataViews[dataViews.length - 1].$;
            insert = target.after;
          }
        } else {
          if (config.toggles[name] === true) {
            var className = builder.types[name] || name;
            var type = views[className.camelize()];
            
            if (type) {
              changedViews = true;
              var view = subviews[name] = new type(config.configs[name]);
              view.parent = self;
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
        this.$.find("> ." + name).html(config.labels[name] || "");
      }

      var set;
      // Set the option classes
      for (var i in builder.options) {
        set = builder.options[i];
        for (var j = 0; j < set.length; j++) this.$.removeClass(set[j]);
        this.$.addClass(config.options[i] || set[0] || "");
      }

      if (interface && changedViews)
        interface.updateInspector();
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
      if (!self.parent || self.parent.builder.dataType == className) {
        interface.inspectView(self);
        event.stopPropagation();
      }
    });

    this.update();
    for (var i = 0; i < config.data.length; i++) this.addData(config.data[i]);
  };

  views.StatusBar = function() {
    this.__proto__ = new views.View('status-bar');
    
    var time = $("<div class='time'></div>");

    var updateTime = function() {
      var t = (new Date).toTimeString().split(":");
      t = t[0] + ":" + t[1];
      time.text(t);
    };
    updateTime();
    setInterval(updateTime, 500);

    this.$.append("<div class='network'>EXEMPLAR</div>");
    this.$.append("<div class='battery'>73%</div>");
    this.$.append(time);
  };

  views.Keyboard = function() {
    this.__proto__ = new views.View('keyboard');
  };
  
  views.NavigationBar = function(config) {
    this.__proto__ = new views.View('navigation-bar', $.extend({
      configs: {
        back: {
          options: {style: 'back-button'},
          labels: {title: 'Back'}
        }, 
        edit: {
          options: {style: 'done-button'},
          labels: {title: 'Edit'}
        }
      },
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
    this.$.append("<input type='search' placeholder='Search' autosave='iphone' results='5' />");
  };
  
  views.TableViewGroup = function(config) {
    this.__proto__ = new views.View('table-view-group', $.extend({
      data: [{}, {}],
      toggles: {'table-view-header': true, 'table-view-footer': true}
    }, config), {
      toggles: ['table-view-header', 'data-views', 'table-view-footer'],
      dataType: 'table-view-cell'
    });
  };

  views.TableViewHeader = function(config) {
    this.__proto__ = new views.View('table-view-header', $.extend({
      labels: {title: 'Header'}
    }, config), {
      labels: ['title']
    });

    this.$.append("<div class='title'></div>");
    this.update();
  };

  views.TableViewCell = function(config) {
    this.__proto__ = new views.View('table-view-cell', $.extend({
      labels: {title: 'Table View Cell'}
    }, config), {
      labels: ['title']
    });

    this.$.append("<div class='disclosure'></div>");
    this.$.append("<div class='title'></div>");
    this.update();
  };

  views.TableViewFooter = function(config) {
    this.__proto__ = new views.View('table-view-footer', $.extend({
      labels: {title: 'Footer'}
    }, config), {
      labels: ['title']
    });

    this.$.append("<div class='title'></div>");
    this.update();
  };

  views.TableView = function(config) {
    this.__proto__ = new views.View('table-view', $.extend({
      autoSize: true
    }, config), {
      toggles: ['table-view-search'],
      dataType: 'table-view-group',
      options: {style: ['plain-table', 'grouped-table']}
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
  
  views.TabBar =  function(config) {
    this.__proto__ = new views.View('tab-bar', config, {
      dataType: 'tab-bar-button'
    });
  };

  views.Toolbar = function(config) {
    this.__proto__ = new views.View('toolbar', config, {
      dataType: 'toolbar-button'
    });
  };
  
  views.ToolbarButton = function(config) {
    this.__proto__ = new views.View('toolbar-button', $.extend({
      labels: {title: "?"}
    }, config), {
      labels: ['title'],
      options: {style: ['plain-button', 'bordered-button', 'done-button', 'back-button']}
    });

    this.$.append("<div class='title'></div>");
    this.update();
  };
  
  views.Window = function(config) {
    this.__proto__ = new views.View('window', $.extend({
      toggles: {'status-bar': true, 'navigation-bar': true, 'content-view': true}
    }, config), {
      toggles:  ['status-bar', 'navigation-bar', 'content-view', 'toolbar', 'tab-bar', 'keyboard'],
      required: {'content-view': true}
    });
  };

  views.WindowSet = function(config) {
    this.__proto__ = new views.View('window-set', $.extend({
      data: [{}],
      labels: {title: "New Application"}
    }, config), {
      labels: ['title'],
      dataType: 'window'
    });

    this.$.prepend("<div class='title'></div>");
    this.update();
  }
  
  /**
   * The collection of window sets.
   */
  var Application = function(root) {
    root = root || "body";
    this.__proto__ = new Element('application', null, root);

    var scale = 1.0;
    var windowSet = new views.WindowSet();

    this.$.draggable();

    this.__defineSetter__("scale", function(val) {
      val = parseFloat(val);
      if (isNaN(val)) return;

      scale = val;

      this.$.css("-webkit-transform", "scale(" + scale + ")");
    });
    this.__defineGetter__("scale", function() { return scale; });

    this.addElement(windowSet);

    /**
     * Adds a new Screen to the Canvas
     */
    this.createWindow = function() {
      windowSet.addData();
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
      
      var baseNumber = 0;
      var uniqueId = function() {
        return ('input' + baseNumber++);
      };

      /**
       * Draw the label text fields
       */
      var drawLabels = function(view, labels) {
        for (var i = 0; i < labels.length; i++) {
          var id = uniqueId();
          var html = $("<div></div>");
          var input = $("<input type='text' placeholder='" + labels[i].humanize() + "' id='" + id + "' />");

          input.keyup((function() {
            var name = labels[i];
            return function() {
              view.config.labels[name] = $(this).val();
              view.update();
            }; 
          })());

          if (view.config.labels[labels[i]] !== undefined)
            input.val(view.config.labels[labels[i]]);

          html.append(input);

          this.$.append(html);
        }
      };

      /**
       * Draw the toggle buttons
       */
      var drawToggles = function(view, toggles, required) {
        for (var i = 0; i < toggles.length; i++) {
          if (required[toggles[i]]) continue;

          var id = uniqueId();
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
      
      var drawOptions = function(view, options) {
        for (var i in options) {
          var id = "option_" + i.underscore();
          var html = $("<div></div>");
          var input = "<select id='" + id + "'>";

          for (var j = 0; j < options[i].length; j++)
            input += "<option value='" + options[i][j] + "'>" + options[i][j].humanize() + "</option>";

          input += "</select>";
          input = $(input);

          input.change((function() {
            var name = i;
            return function() {
              view.config.options[name] = $(this).val();
              view.update();
            }; 
          })());

          input.val(view.config.options[i]);
          
          html.append(input);

          this.$.append(html);
        }
      };

      this.update = function() {
        if (!view || !view.builder) return;
        this.$.empty();
        
        var self = this;

        // Traverse Tree and gather subviews' inspector fields
        var drawInputs = function(view) {
          drawLabels.call(self, view, view.builder.labels);
          drawToggles.call(self, view, view.builder.toggles, view.builder.required);
          drawOptions.call(self, view, view.builder.options);

          if (views[(view.builder.dataType || "").camelize()]) {
            var input = $("<button>Add " + view.builder.dataType.humanize() + "</button>");
            input.click(function() {
              view.addData();
            });
            self.$.append(input);
          }

          self.$.append("<hr />")

          for (var v in view.subviews)
            if (view.subviews[v])
              drawInputs(view.subviews[v]);
        };
        drawInputs(view);
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
        
        this.update();
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
    };

    this.inspectView = function(view) {
      inspector.view = view;
    };
    
    this.updateInspector = function() {
      inspector.update();
    };

    canvas = new Canvas();
    toolbar = new Toolbar(canvas.screenSet);
    inspector = new Inspector();

    application = new Application(canvas);
  };

  interface = new Interface();
};

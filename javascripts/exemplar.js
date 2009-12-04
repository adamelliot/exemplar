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

var Exemplar = function(saveData) {
  
  // This collection is used to dynamically create view objects.
  var views = {};
  var interface, remover, duplicator, app;

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
    builder.configs   = builder.configs   || {};
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
     * Return a list of the attached data views. Subviews are named, where
     * as data views are a list.
     */
    this.__defineGetter__("dataViews", function() { return dataViews; });

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
      var view = new type(config);
      var self = this;

      view.$.mouseover(function(event) {
        remover.show();
        duplicator.show();
        
        remover.css({
          left: view.$.offset().left - 16,
          top: view.$.offset().top - 16
        });
        duplicator.css({
          left: view.$.offset().left + (view.$.outerWidth() * app.scale) - 14,
          top: view.$.offset().top - 16
        });

        remover.unbind('click');
        remover.click(function(event) {
          self.removeData(view);
          remover.hide();
          duplicator.hide();
          event.stopPropagation();
        })

        duplicator.unbind('click');
        duplicator.click(function(event) {
          self.addData($.extend(true, {}, view.config));
          remover.hide();
          duplicator.hide();
          event.stopPropagation();
        })

        event.stopPropagation();
      });
      
      view.$.mousedown(function() {
        remover.hide();
        duplicator.hide();
      });

      view.$.mouseout(function(event) {
        remover.hide();
        duplicator.hide();
        event.stopPropagation();
      });

      view.parent = self;

      if (dataViews.length > 0) {
        target = dataViews[dataViews.length - 1].$;
        insert = target.after;

        target.removeClass("last");
        view.$.addClass("last");
      } else {
        view.$.addClass("first");
        view.$.addClass("last");

        for (var i = 0; i < builder.toggles.length; i++) {
          if (subviews[builder.toggles[i]]) {
            target = subviews[builder.toggles[i]].$;
            insert = target.after;
          }

          if (builder.toggles[i + 1] == 'data-views') break;
        }
      }
      
      dataViews.push(view);
      
      var stored = false;
      for (var i = 0; i < this.config.data.length; i++)
        if (this.config.data[i] == config) {
          this.config.data[i] = view.config;
          stored = true;
          break;
        }

      if (!stored) this.config.data.push(view.config);

      insert.call(target, view.$);
      // Update shit that needs sizing info
      this.update();
    };

    /**
     * Attempts to remove a view from this view's data. If the view is not
     * found nothing happens.
     */
    this.removeData = function(target) {
      for (var i = 0; i < dataViews.length; i++)
        if (dataViews[i] == target) {
          if (i == 0 && dataViews[i + 1])
            dataViews[i + 1].$.addClass('first');
          else if (i == (dataViews.length - 1) && dataViews[i - 2])
            dataViews[i - 1].$.addClass('last');
            
          this.config.data.splice(i, 1);
          dataViews.splice(i, 1);
          target.destroy();
          this.update();
        }
    }

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

      // Update All the views first (These are kinda like a hammer for a fly...but it works)
      for (var i in subviews)
        subviews[i].update();
      for (var i = 0; i < dataViews.length; i++)
        dataViews[i].update();

      // Create the internal views
      for (var i = 0; i < builder.toggles.length; i++) {
        name = builder.toggles[i];

        if (subviews[name]) {
          if (config.toggles[name] !== true) {
            subviews[name].destroy();
            delete this.config.configs[name];
            delete subviews[name];
            changedViews = true;
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
              var view = subviews[name] = new type(config.configs[name] || builder.configs[name]);
              config.configs[name] = view.config;
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
          if (subview.builder.autoSize === true)
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
      
      if (builder.customClasses === true && config.classes) {
        var classes = config.classes.split(" ");
        for (var i = 0; i < classes.length; i++)
          this.$.addClass(classes[i]);
      }

      // Only horizontally size inline-block elements
      if (dataViews[0] && dataViews[0].$.css("display") == 'inline-block' && this.builder.autoSizeData) {
        // The + 2 cleans up lots of views, as rounding down looks a little better
        var padding = parseInt(this.$.css("padding-left")) + parseInt(this.$.css("padding-right")) + 2;
        var width = ((this.$.innerWidth() - padding) / dataViews.length);
        for (var i = 0; i < dataViews.length; i++)
          dataViews[i].$.css({width: width});
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

    for (var i = 0; i < config.data.length; i++) this.addData(config.data[i]);
    this.update();
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
      toggles: {edit: true},
      labels:  {title: 'New Screen'}
    }, config), {
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
      types:   {back: 'toolbar-button', edit: 'toolbar-button'},
      toggles: ['back', 'edit'],
      labels:  ['title']
    });

    this.$.append("<div class='title'>?</div>");
    this.update();
  };

  views.ScopeBar = function(config) {
    this.__proto__ = new views.View('scope-bar', $.extend({
      data: [{options: {style:'selected'}}, {}],
    }, config), {
      dataType: 'scope-bar-button',
      autoSizeData: true
    });
    this.update();
  };

  views.ScopeBarButton = function(config) {
    this.__proto__ = new views.View('scope-bar-button', $.extend({
      labels: {title: "Scope"}
    }, config), {
      labels: ['title'],
      options: {style: ['unselected', 'selected']}
    });

    this.$.append("<div class='title'></div>");
    this.update();
  };

  views.TextView = function(config) {
    this.__proto__ = new views.View('text-view', $.extend({
      labels: {"lorem > .title": "Lorem Ipsum"}
    }, config), {
      labels: ['lorem > .title'],
      options: {style: ['normal', 'rounded']},
      autoSize: true
    });
    
    this.$.append("<div class='lorem'><div class='title'></div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec tempor cursus molestie. Praesent metus elit, semper vitae venenatis non, porttitor quis massa. Integer eget mi tempus ipsum tempor porta. Vivamus sed urna quam.</div>");
    this.update();
  };

  views.TableViewSearch = function(config) {
    this.__proto__ = new views.View('table-view-search', config);
    this.$.append("<input type='search' placeholder='Search' autosave='iphone' results='5' disabled='disabled' />");
  };
  
  views.CustomView = function(config) {
    this.__proto__ = new views.View('custom-view', config, {
      customClasses: true,
      autoSize: true
    });
    this.update();
  };
  
  views.TableViewGroup = function(config) {
    this.__proto__ = new views.View('table-view-group', $.extend({
      data: [{}, {}],
      toggles: {'table-view-header': true}
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
      labels: ['title', 'right', 'content'],
      options: {
        disclosure: ['disclosure', 'no-disclosure'],
        style: ['simple', 'complex']
      },
      customClasses: true
    });

    this.$.append("<div class='disclosure'></div>");
    this.$.append("<div class='right'></div>");
    this.$.append("<div class='title'></div>");
    this.$.append("<div class='content'></div>");
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
    this.__proto__ = new views.View('table-view', config, {
      toggles: ['table-view-search', 'scope-bar'],
      dataType: 'table-view-group',
      options: {style: ['plain-table', 'grouped-table']},
      autoSize: true
    });
  };

  /**
   * This is a special view who's vertical size is auto adjusted.
   */
  views.ContentView = function(config) {
    this.__proto__ = new views.View('content-view', config, {
      toggles: ['text-view', 'table-view', 'custom-view'],
      autoSize: true
    });
  };

  views.TabBarButton = function(config) {
    this.__proto__ = new views.View('tab-bar-button', $.extend({
      labels: {title: 'Tab'},
      options: {icon: 'star'}
    }, config), {
      labels: ['title'],
      options: {icon: ['add', 'bookmark', 'book', 'clock', 'inbox', 'palette', 'search', 'settings', 'star']}
    });

    this.$.append("<div class='icon'></div>");
    this.$.append("<div class='title'></div>");
    this.update();
  };

  views.TabBar =  function(config) {
    this.__proto__ = new views.View('tab-bar', $.extend({
        data: [{}, {}]
      }, config), {
      dataType: 'tab-bar-button',
      autoSizeData: true
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
      toggles:  ['status-bar', 'navigation-bar', 'scope-bar', 'content-view', 'toolbar', 'tab-bar', 'keyboard'],
      required: {'content-view': true}
    });
    this.update();
  };

  views.WindowSet = function(config) {
    this.__proto__ = new views.View('window-set', $.extend({
      data: [{}],
      labels: {title: "New Window Set"}
    }, config), {
      labels: ['title'],
      dataType: 'window'
    });

    this.$.prepend("<div class='title'></div>");
    this.$.append("<div style='clear:both'></div>");
    this.update();
  }
  
  /**
   * The collection of window sets.
   */
  views.Application = function(config) {
    this.__proto__ = new views.View('application', $.extend({
      data: [{}],
    }, config), {
      dataType: 'window-set'
    });

    var scale = 1.0;

    this.$.draggable();

    this.__defineSetter__("scale", function(val) {
      val = parseFloat(val);
      if (isNaN(val)) return;

      scale = val;

      this.$.css("-webkit-transform", "scale(" + scale + ")");
    });
    this.__defineGetter__("scale", function() { return scale; });

    var self = this;
    this.save = function() {
      var date = new Date();
      date.setTime(date.getTime() + (24 * 60 * 60 * 1000 * 365));
      var expires = "; expires=" + date.toGMTString();
      document.cookie = "exemplar=" + encodeURIComponent($.toJSON(self.config)) + expires;
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

      var view;
      var selector = $("<div id='selector'></div>");

      remover = $("<div id='remove_button'></div>");
      duplicator = $("<div id='duplicate_button'></div>");

      $(root).append(selector);
      $(root).append(remover);
      $(root).append(duplicator);

      selector.hide();
      remover.hide();
      duplicator.hide();
      
      remover.mouseover(function() {
        remover.show();
      });
      duplicator.mouseover(function() {
        duplicator.show();
      });
      
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
          
          if (view.builder.customClasses === true) {
            var input = $("<input type='text' placeholder='custom classes' />");
            input.val(view.config.classes || "")

            input.keyup(function() {
              view.config.classes = $(this).val();
              view.update();
            });
          }
          self.$.append(input);

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
          left:   view.$.offset().left - (view.$.outerWidth() - (view.$.outerWidth() * application.scale)) / 2,
          top:    view.$.offset().top - (view.$.outerHeight() - (view.$.outerHeight() * application.scale)) / 2,
          width:  view.$.outerWidth(),
          height: view.$.outerHeight(),

          "-webkit-transform": "scale(" + application.scale + ")"
        });
        selector.show();
        // FIXME: Without the fade out nested elements become untouchable
        selector.fadeOut("fast");

        this.update();
      });
    };

    var Toolbar = function() {
      var addScreen = $("<button class='add-window-set'>Add Window Set</button>");
      var reset = $("<button class='reset'>Reset</button>");
      var scale = $("<input type='range' class='scale' value='100' />");

      this.__proto__ = new Element('toolbar', null, root);

      this.$.append(scale);
      this.$.append(addScreen);
      this.$.append(reset);

      reset.click(function() {
        if (confirm("This will clear all your data, are you sure?")) {
          document.cookie = 'exemplar=';
          location.reload();
        }
      });

      setInterval(function() {
        application.save();
      }, 500);

      addScreen.click(function() {
        application.addData();
      });

      scale.change(function() {
        application.scale = (parseFloat($(this).val()) + 50) / 150;
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

    var data = document.cookie.split("; ");
    var cookies = {};
    for (var i = 0; i < data.length; i++) {
      var pair = data[i].split("=");
      cookies[pair[0]] = decodeURIComponent(pair[1]);
    }

    if (saveData)
      cookies.exemplar = decodeURIComponent(saveData);

    var config;
    if (cookies.exemplar)
      config = $.evalJSON(cookies.exemplar);

    app = application = new views.Application(config);
    canvas.addElement(application);
    application.update();
  };

  interface = new Interface();
};

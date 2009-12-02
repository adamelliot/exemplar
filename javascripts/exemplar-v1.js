/**
 * Mars landed, I made something to make life a little easier.
 */

var Exemplar = window.Exemplar || {};

/**
 * Basic drawing div, a screen is a stack of these.
 */
Exemplar.Screen = function(config) {
  /**
   * Generate targetable id
   */
  var newId = function() {
    var id = 666;

    newId = function() {
      return "screen_" + id++;
    };
  };

  /**
   * Base object for screen stack
   */
  var Base = function() {
    var id = newId();
    var container = $("<div></div>");
    
    return {
      get id() {
        return id;
      },
      get container() {
        return container;
      },

      set height(val) {
        container.css("height", val);
      }
    };
  };
  
  var BarButton = function(config) {
    config = config || {};

    var base = new Base;
    var html = base.container;
    var className = "";

    switch(config.type) {
      case "back":
        className = "back-button";
        break;
      case "borderless":
        className = "borderless-button";
        break;
      default:
        className = "button";
        break;
    }

    html.attr("class", className);
    html.text(config.title || "");

    html.css({float: (config.right === true ? "right" : "left")});

    return base;
  };
  
  var Keyboard = function(config) {
    var base = new Base;
    var html = base.container;

    html.attr("class", "keyboard");

    return base;
  };
  
  var StatusBar = function() {
    var base = new Base;
    var html = base.container;

    html.attr("class", "status-bar");
    html.text("2:71");

    return base;
  };

  var NavigationBar = function(config) {
    config = config || {};
    config.buttons = config.buttons || [];

    var base = new Base;
    var html = base.container;
    html.attr("class", "navigation-bar");

    if (config.buttons[0])
      html.append((new BarButton(config.buttons[0])).container);

    if (config.buttons[1]) {
      config.buttons[1].right = true;
      html.append((new BarButton(config.buttons[1])).container);
    }

    html.append("<div class='title'>" + (config.title || "?") + "</div>");

    return base;
  };

  var Toolbar = function(config) {
    config = config || {};
    config.buttons = config.buttons || [];
    
    var base = new Base;
    var html = base.container;
    html.attr("class", "toolbar");

    for (var i = 0; i < config.buttons.length; i++)
      html.append((new BarButton(config.buttons[i])).container);

    return base;
  };

  var TableSearch = function(config) {
    var base = new Base;
    var html = base.container;

    html.attr("class", "table-search");
    html.html("<input type='text' placeholder='Search' autosave='iphone' results='5' disabled='true' />");

    return base;
  };

  var TableHeader = function(config) {
    var base = new Base;
    var html = base.container;

    html.attr("class", config.grouped ? "grouped-table-header" : "table-header");
    html.text(config.text || "?")

    return base;
  };

  var TableCell = function(config) {
    var base = new Base;
    var html = base.container;

    html.attr("class", config.grouped ? "grouped-table-cell" : "table-cell");
    html.text(config.text || "?");
    console.log(config.disclosure);
    if (config.disclosure != false)
      html.append("<div class='disclosure'></div>");
    
    return base;
  };

  var TableView = function(config) {
    config = config || {};

    var base = new Base;
    var html = base.container;
    html.attr("class", config.grouped ? "grouped-table-view" : "table-view");

    html.css({height: config.height});
    
    var addData = function(data, grouped, disclosure) {
      for (var i = 0; i < data.length; i++) {
        var cell = new TableCell({grouped: grouped, text: data[i], disclosure:disclosure});
        
        if (config.grouped) {
          if (i == 0)
            cell.container.attr("class", cell.container.attr("class") + " first-grouped-table-cell");

          if (i == data.length - 1)
            cell.container.attr("class", cell.container.attr("class") + " last-grouped-table-cell");
        }

        html.append(cell.container);
      }
    };

    if (config.search ===  true)
      html.append((new TableSearch()).container);

    if (config.data instanceof Array)
      addData(config.data, config.grouped, config.disclosure);
    else
      for (var key in config.data) {
        var header = new TableHeader({grouped: config.grouped, text: key});
        html.append(header.container);
        addData(config.data[key], config.grouped, config.disclosure);
      }

    return base;

  };

  var Content = function(config) {
    config = config || {};

    var base = new Base;
    var html = base.container;
    html.attr("class", "content");

    var tableView = new TableView({
      search: config.search,
      height: config.height,
      grouped: config.grouped,
      data: config.data,
      disclosure: config.disclosure
    });

    html.append(tableView.container);

    return base;
  };

  var Screen = function(config) {
    var baseHeight = 320;
    
    config = config || {};

    var contentHeight = 480 - 20 - (config.navigationBar ? 45 : 0) -
      (config.toolbar ? 43 : 0) - (config.keyboard === true ? 216 : 0);
    config.content = config.content || {};
    config.content.height = contentHeight;
    
    var statusBar = new StatusBar(config.statusBar);
    var navigationBar = new NavigationBar(config.navigationBar);
    var content = new Content(config.content);
    var toolbar = new Toolbar(config.toolbar);
    var keyboard = new Keyboard();

    var base = new Base;
    var html = base.container;

    html.attr("class", "screen");
    config = config || {};

    html.css({
      width: 320,
      height: 480
    });
    
    html.append(statusBar.container);
    if (config.navigationBar) html.append(navigationBar.container);
    html.append(content.container);
    if (config.toolbar) html.append(toolbar.container);
    if (config.keyboard === true) html.append(keyboard.container);

    return base;
  };
  
  return new Screen(config);
};

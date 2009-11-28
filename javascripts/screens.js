function toolbarButtons(todo, search, discussion, glossary, notes, bookmarks) {
  var toolbar = [];
  
  // Left 3
  if (todo)       toolbar.push({ type: "borderless", title: "T" });
  if (search)     toolbar.push({ type: "borderless", title: "S" });
  if (discussion) toolbar.push({ type: "borderless", title: "D" });

  // Right 3
  if (bookmarks)  toolbar.push({ right: true, type: "borderless", title: "BM" });
  if (notes)      toolbar.push({ right: true, type: "borderless", title: "N" });
  if (glossary)   toolbar.push({ right: true, type: "borderless", title: "G" });

  return toolbar;
}

$(function() {
  var target = $("#screens");
  
  // Login
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Solaro Login"
    },
    content: {
      data: {Login: ["username", "password"]},
      grouped: true,
      disclosure: false
    },
    keyboard: true
  }).container);

  // Home
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Solaro",
      buttons: [{type: "back", title: "Back"}, {title: "Logout"}]
    },
    content: {
      data: ["Studying"]
    },
    toolbar: {
      buttons: toolbarButtons(true, false, false, false, true, true)
    }
  }).container);

  // Studying
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Studying",
      buttons: [{type: "back", title: "Back"}]
    },
    content: {
      data: {Courses: ["Math", "Science", "English"]},
      grouped: true
    },
    toolbar: {
      buttons: toolbarButtons(true, true, false, false, true, true)
    }
  }).container);

  // Search
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Search",
      buttons: [null, {type: "blue", title: "Cancel"}]
    },
    content: {
      search: true,
      data: {Math: ["Trigonometry"], Science: ["Force Decomposition"]}
    }
  }).container);

  // Search Result
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Trigonometry",
      buttons: [{type: "back", title: "Search"}, {title: "Cancel"}]
    },
    toolbar: {
      buttons: [{
        type: "borderless",
        title: "Open this lesson?"
      }, {
        type: "blue",
        title: "Yes",
        right: true
      }]
    }
  }).container);

  // Topic Level
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Math",
      buttons: [{type: "back", title: "Courses"}]
    },
    content: {
      data: ["Geometry", "Trigonometry"],
    },
    toolbar: {
      buttons: toolbarButtons(true, true, false, true, true, true)
    }
  }).container);

  // Section Level
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Trigonometry",
      buttons: [{type: "back", title: "Math"}]
    },
    content: {
      data: ["Sine Ratio", "Cosine Ratio", "Right Triangles"],
    },
    toolbar: {
      buttons: toolbarButtons(true, true, false, true, true, true)
    }
  }).container);

  // Lesson Level
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Sine Ratio",
      buttons: [{type: "back", title: "Trigonometry"}]
    },
    toolbar: {
      buttons: toolbarButtons(true, true, true, true, true, true)
    }
  }).container);

  // Glossery
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Glossary",
      buttons: [null, {type: "blue", title: "Done"}]
    },
    content: {
      search: true,
      data: {Math: ["Trigonometry"], Science: ["Force Decomposition"]},
    }
  }).container);

  // Glossary Term
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Right Angle",
      buttons: [{type: "back", title: "Glossary"}, {type: "blue", title: "Done"}]
    }
  }).container);

  // Discussion
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Discussion",
      buttons: [null, {type: "blue", title: "Done"}],
      search: true
    },
    toolbar: {}
  }).container);

  // Note Listing
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Notes",
      buttons: [null, {type: "blue", title: "Done"}]
    },
    content: {
      data: ["Triangles", "SOH CAH TOA"],
    },
    toolbar: {
      buttons: [{title:'+', type:"borderless"}]
    }
  }).container);

  // Note Creation
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Note",
      buttons: [{title: "Cancel"}, {type: "blue", title: "Save"}],
    },
    content: {
      data: [" "],
      grouped: true,
      disclosure: false
    },
    keyboard: true
  }).container);

  // Bookmark Placement
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Add Bookmark",
      buttons: [null, {type: "blue", title: "Cancel"}]
    }
  }).container);


  // Notes Search Result
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Notes Search",
      buttons: [null, {type: "blue", title: "Edit"}]
    },
    content: {
      search: true,
      data: {"Sine Ratio": ["Triangles", "SOH CAH TOA"]}
    }
  }).container);

  // Bookmark Search Result
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Notes Search",
      buttons: [null, {type: "blue", title: "Edit"}]
    },
    content: {
      search: true,
      data: {Trigonometry: ["Sine Ratio", "Cosine Ratio"]}
    }
  }).container);

  // TODO Box
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Todo List",
      buttons: [null, {type: "blue", title: "Done"}]
    },
    content: {
      data: {Math: ["Sine Ratio", "Cosine Ratio"], Discussions: ["Billy commented on..."]}
    }
  }).container);

  // TODO Box
  target.append(new Exemplar.Screen({
    navigationBar: {
      title: "Avatar",
      buttons: [null, {type: "blue", title: "Done"}]
    }
  }).container);

});
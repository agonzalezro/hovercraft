$(function() {
  $.ajaxSetup({
    'beforeSend': function(xhr) {
    xhr.setRequestHeader("accept", "application/json");
    }
  });
});

var current_slide = function() {
  var slides = $('.slide');
  var viewport_top = $('#presentation').offset().top;
  var viewport_height = $('#presentation').height();
  var viewport_bottom = viewport_top + viewport_height;
  for (var i = 0; i < slides.length; i++) {
    if ($(slides[i]).offset().top + (viewport_height / 3) > viewport_top)
      return $(slides[i]);
  }
};

$(function() {
  function loadFont(fontName) {
    var $ = document; // shortcut
    var head  = $.getElementsByTagName('head')[0];
    var link  = $.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'http://fonts.googleapis.com/css?family=' + fontName;
    link.media = 'all';
    head.appendChild(link);
  }

  var Slide = Backbone.Model.extend();

  var Image = Backbone.Model.extend();

  var Slides = Backbone.Collection.extend({
    model: Slide,
    initialize: function(presentation_id) {
      this.presentation_id = presentation_id;
      _.bindAll(this, "save");
    },
    parse: function(response) {
      this.author = response.author;
      return response.slides
    },
    url: function() {
      return "/presentations/" + this.presentation_id
    },
    save: function() {
      Backbone.sync("update", Slide, {
          contentType: 'application/json',
          url: this.url(),
          data: JSON.stringify(_.map(this.models, function(model) {
              return model.toJSON();
          })),
      });
    }
  });
  var Images = Backbone.Collection.extend({
    model: Image,
    initialize: function(slides){
      this.slides = slides;
      console.log(slides);
    }
  });


  var SlideView = Backbone.View.extend({
    tagName: "div",
    className: "slide",
    events: {
      "click .remove-slide": "onClickRemove",
      "keyup textarea": "onKeyUp"
    },
    onClickRemove: function(ev) {
      this.model.destroy();
      ev.stopPropagation();
      this.trigger("reset", this);
    },
    onKeyUp: _.debounce(function() {
      this.model.set("text", $("textarea", this.el).val());
      this.trigger("save", this);
    }, 5),
    template: _.template($("#slide-template").html()),
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      $(this.el).attr("id", "slide-" + this.model.id);
      $(this.el).data("slide-id", this.model.id);
      return this;
    }
  });

  var PresentationView = Backbone.View.extend({
    el: "#presentation",
    events: {
      "click #add-slide a": "onAddSlideButton"
    },
    initialize: function(presentation) {
      this.slides = presentation;
      this.slides.on("reset", this.render, this);
      this.slides.fetch({
        dataType: "json",
        url: "/presentations/" + presentation.presentation_id
      });
    },
    onAddSlideButton: function() {
      this.presentation.add({text: ""});
      this.render();
    },
    render: function() {
      var add_slide = $(this.el).find("#add-slide");

      $(this.el).empty();

      _.each(this.slides, function(slide) {
        var slideview = new SlideView({model: slide});
        slideview.on("reset", this.render, this);
        slideview.on("save", this.slides.save, this);
        $(this.el).append(slideview.render().el);
      }, this);

      $(this.el).append(add_slide);

      return this;
    }
  });

  var Font = Backbone.Model.extend();

  var Fonts = Backbone.Collection.extend({
    model: Font,
  });

  var FontView = Backbone.View.extend({
    tagName: "p",
    className: "font",
    events: {
      "click": "onClick"
    },
    onClick: function() {
      alert("clicked on font " + this.model.attributes.fontname);
      this.presentation
    },
    template: _.template($("#font-template").html()),
    render: function() {
      var jqel = $(this.el);
      jqel.html(this.template(this.model.toJSON()));
      jqel.css('font-family', this.model.attributes.fontname)
      return this;
    }

  });

  var FontsView = Backbone.View.extend({
    el: "#fonts",
    initialize: function(presentation) {
      this.fonts = fonts;
      this.render();
    },
    render: function() {
      _.each(this.fonts.models, function(font) {
        var fontview = new FontView({model: font});
        $(this.el).append(fontview.render().el);
      }, this);
    }
  });

  var MenuView = Backbone.View.extend({
    el: "#menu",
    template: _.template($("#menu-template").html()),
    initialize: function() {
      this.render();
    },
    render: function() {
      $(this.el).html(this.template());
      return this;
    }
  });


  var ImageView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#image-search-template').html()),
    events: {
      "click": "onClick"
    },
    initialize: function(slides){
      this.slides = slides;
    },
    onClick: function(event){
      event.stopPropagation();
      event.preventDefault();
      var image = this.model.attributes.image.url;
      var slide = current_slide().id;

      current_slide().css('background-image', 'url("' + image + '")');
      current_slide().css('background-size', '100% 100%');
    },
    render: function(){
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var ImageListView = Backbone.View.extend({
    el: '#image-search',
    events: {
      "keyup input": "search_image",
      "submit #image-search form": "onSubmit"
    },
    initialize: function(slides){
      this.slides = slides;
      this.images = new Images(slides);
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      _.bindAll(this, 'build_image_result'); // fixes loss of context for 'this' within methods
      this.images.bind('change', this.render);
      this.images.bind('reset', this.render);
      this.images.view = this;
      this.render();
      $('#image-search ul').css('opacity', 0);
    },
    render: function(){
      $('#image-search ul').empty();
      _.each(this.images.models, function(image) {
        var imageview = new ImageView({model: image});
        $('#image-search ul').append(imageview.render().el);
      }, this);
      return this;
    },
    search_image: _.debounce(function(event){
      if (event.keyCode != 13) { // Nothing to do when enter is pressed.
        var query = $('#image-search input')[0].value;
        if (query) {
          $('#image-search ul').fadeTo(300, 0.4);
          $.getJSON("/search/"+query, '', this.build_image_result);
        }
      }
    }, 800),
    build_image_result: function(data){
      $('#image-search ul').fadeTo(100, 0);
      this.images.reset(data.images);
      $('#image-search ul').fadeTo(600, 1);
    },
    onSubmit: function(event){
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  });

  var fonts = new Fonts();
  fonts.add([{fontname: "Strait"}, {fontname: "Faster One"}]);
  fonts.forEach(function(font) {
    console.log(font);
    loadFont(font.attributes.fontname);
  });

  loadFont("Strait");

  AppView = Backbone.View.extend({
    initialize: function(presentation_id) {
      var slides = new Slides(presentation_id);

      this.menuview = new MenuView();
      this.slidesview = new PresentationView(slides);
      this.imagelistview = new ImageListView(slides);
      this.fontsview = new FontsView(slides);
    }
  });

});

$(function() {
  $.ajaxSetup({
    'beforeSend': function(xhr) {
    xhr.setRequestHeader("accept", "application/json");
    }
  });
});

$(function() {
  var Slide = Backbone.Model.extend();

  var Image = Backbone.Model.extend();

  var Slides = Backbone.Collection.extend({
    model: Slide,
    parse: function(response) {
      this.author = response.author;
      return response.slides;
    }
  });
  var Images = Backbone.Collection.extend({
    model: Image
  });


  var SlideView = Backbone.View.extend({
    tagName: "div",
    className: "slide",
    events: {
      "click": "onClick",
      "click .remove-slide": "onClickRemove"
    },
    onClick: function() {
      alert('Click on slide');
    },
    onClickRemove: function(ev) {
      this.model.destroy();
      ev.stopPropagation();
      this.trigger("reset", this);
    },
    template: _.template($("#slide-template").html()),
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      $(this.el).attr("id", "slide-" + this.model.id);
      return this;
    }
  });


  var PresentationView = Backbone.View.extend({
    el: "#presentation",
    events: {
      "click #add-slide a": "onAddSlideButton"
    },
    initialize: function(presentation_id) {
      this.slides = new Slides();
      this.slides.on("reset", this.render, this);
      this.slides.fetch({
        dataType: "json",
        url: "/presentations/" + presentation_id
      });
    },
    onAddSlideButton: function() {
      this.slides.add({text: ""});
      this.render();
    },
    render: function() {
      var add_slide = $(this.el).find("#add-slide");

      $(this.el).empty();

      _.each(this.slides.models, function(slide) {
        var slideview = new SlideView({model: slide});
        slideview.on("reset", this.render, this);
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
      alert('Click on font');
    },
    template: _.template($("#font-template").html()),
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }

  });

  var FontsView = Backbone.View.extend({
    el: "#fonts",
    initialize: function(fonts) {
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
    onClick: function(event){
      event.stopPropagation();
      event.preventDefault();
      var image = this.model.attributes.image.url;
      $('#current-slide').css('background', 'url("' + image + '")');
      alert(image);
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
    initialize: function(){
      this.images = new Images();
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
    },
  });


  AppView = Backbone.View.extend({
    initialize: function(presentation_id) {
      var fonts = new Fonts();
      fonts.add([{fontname: "foo"}, {fontname: "bar"}]);

      this.menuview = new MenuView();
      this.slidesview = new PresentationView(presentation_id);
      this.imagelistview = new ImageListView();
      this.fontsview = new FontsView(fonts);
    }
  });
});

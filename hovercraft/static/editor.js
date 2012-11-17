$(function() {
  var Slide = Backbone.Model.extend();

  var Slides = Backbone.Collection.extend({
    model: Slide,
    url: "/json/1",
    parse: function(response) {
      this.author = response.author;
      return response.slides;
    }
  });

  var SlideView = Backbone.View.extend({
    tagName: "div",
    className: "slide",
    events: {
      "click": "onClick"
    },
    onClick: function() {
      alert('Click on slide');
    },
    template: _.template($("#slide-template").html()),
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var PresentationView = Backbone.View.extend({
    el: "#presentation",
    events: {
      "click #add-slide a": "onAddSlideButton"
    },
    initialize: function() {
      this.slides = new Slides();
      this.slides.on("reset", this.render, this);
      this.slides.fetch();
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
        $(this.el).append(slideview.render().el);
      }, this);

      $(this.el).append(add_slide);

      return this;
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

  var Image = Backbone.Model.extend();

  var Images = Backbone.Collection.extend({
    model: Image
  });

  var ImageView = Backbone.View.extend({
    el: $('#image-search'),
    image_list: $('#image-search ul'),
    events: {
      "keyup #image-search input": "search_image"
    },
    initialize: function(){
      this.images = new Images();
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      _.bindAll(this, 'build_image_result'); // fixes loss of context for 'this' within methods
      this.images.bind('change', this.render);
      this.images.bind('reset', this.render);
      this.images.view = this;
      this.render();
    },
    template: _.template($('#image-search-template').html()),
    render: function(){
      $(this.image_list).html(this.template({images: this.images.toJSON()}));
      $('#image-search ul').transparancy = '40%';
      return this;
    },
    search_image: _.debounce(function(){
      var query = $('#image-search input')[0].value;
      if (query)
        $('#image-search ul').transparancy = '40%';
        $.getJSON("/search/"+query, '', _.debounce(this.build_image_result, 500));
    }),
    build_image_result: function(data){
      this.images.reset(data);
    }
  });


  var AppView = Backbone.View.extend({
    el: "#wrapper",
    initialize: function() {
      this.menuview = new MenuView();
      this.slidesview = new PresentationView();
      this.imageview = new ImageView();
    }
  });

  var app = new AppView();
  app.render();


});

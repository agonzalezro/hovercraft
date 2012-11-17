$(function() {
  var Slide = Backbone.Model.extend();

  var Slides = Backbone.Collection.extend({
    model: Slide,
    url: "/json/1"
  });

  var SlideView = Backbone.View.extend({
    tagName: "p",
    template: _.template($("#slide-template").html()),
    initialize: function(slide) {
      this.slide = slide;
    },
    render: function() {
      $(this.el).html(this.template(this.slide.toJSON()));
      return this;
    }
  });

  var PresentationView = Backbone.View.extend({
    el: "#presentation",
    initialize: function() {
      _.bindAll(this, "onSlidesLoaded");
      this.slides = new Slides();
      this.slides.fetch({
          success: this.onSlidesLoaded,
      });
    },
    onSlidesLoaded: function(collection, response) {
      _.each(response.slides, function(slide) {
        console.log(slide_json.text);
        this.slides.add({text: slide.text});
      }, this);
      this.render();
    },
    render: function() {
      _.each(this.slides.models, function(slide) {
        var slideview = new SlideView(slide);
        $(this.el).append(slideview.render().el);
      }, this);
      return this;
    }
  });

  var AppView = Backbone.View.extend({
    el: "#wrapper",
    initialize: function(slides) {
      this.slidesview = new PresentationView();
    },
    render: function() {
      this.slidesview.render();
      return this;
    }
  });

  //var slides = new Slides();
  //slides.add([{text: "Hello world!"}, {text: "This is the second slide"}]);

  var app = new AppView();
  app.render();
});

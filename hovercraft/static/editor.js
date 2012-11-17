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

      _.each(this.slides.models, function(slide) {
        var slideview = new SlideView({model: slide});
        $(slideview.render().el).insertBefore(add_slide);
      }, this);

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

  var AppView = Backbone.View.extend({
    el: "#wrapper",
    initialize: function() {
      this.menuview = new MenuView();
      this.slidesview = new PresentationView();
    }
  });

  var app = new AppView();
  app.render();
});

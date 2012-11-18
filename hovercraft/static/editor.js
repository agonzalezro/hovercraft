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
    initialize: function(presentation_id) {
      this.presentation_id = presentation_id;
    },
    parse: function(response) {
      this.author = response.author;
      return response.slides;
    },
    save: function() {
      Backbone.sync("update", Slide, {
          contentType: 'application/json',
          url: "/presentations/" + this.presentation_id,
          data: JSON.stringify(_.map(this.models, function(model) {
              return model.toJSON();
          })),
          success: this.onSuccess,
          error: this.onError
      });
    }
  });
  var Images = Backbone.Collection.extend({
    model: Image
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
      console.log('hi');
      this.trigger("save", this);
    }, 200),
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
      this.slides = new Slides(presentation_id);
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
        slideview.on("save", this.slides.save, this);
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
      $('#image-search ul').css('opacity', 0);
    },
    template: _.template($('#image-search-template').html()),
    render: function(){
      $(this.image_list).html(this.template({images: this.images.toJSON()}));
      return this;
    },
    search_image: _.debounce(function(){
      var query = $('#image-search input')[0].value;
      if (query)
        $('#image-search ul').fadeTo(300, 0.4);
        $.getJSON("/search/"+query, '', this.build_image_result);
    }, 500),
    build_image_result: function(data){
      $('#image-search ul').fadeTo(100, 0);
      this.images.reset(data);
      $('#image-search ul').fadeTo(600, 1);
    }
  });


  AppView = Backbone.View.extend({
    initialize: function(presentation_id) {
      this.menuview = new MenuView();
      this.slidesview = new PresentationView(presentation_id);
      this.imageview = new ImageView();
    }
  });
});

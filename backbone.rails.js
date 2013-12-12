/**
  Backbone.Rails.js
  Makes Backbone.js play nicely with the default Rails setup, i.e.,
  no need to set:
     ActiveRecord::Base.include_root_in_json = false
    and build all of your models directly from `params` rather than
    `params[:model]`.

  Also handles CSRF tokens through request headers

  Load this file after backbone.js and before your application JS.
  
  Credits: 
  Rick O'Halloran (rohall rick.ohalloran@gmail.com)
  https://gist.github.com/trydionel/719080
  http://blog.softr.li/post/43146401263/finally-correctly-dealing-with-rails-csrf-protection

  The MIT License (MIT)

  Copyright (c) 2013 Rick O'Halloran (rick.ohalloran@gmail.com)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
**/ 
Backbone.RailsJSON = {
  // In order to properly wrap/unwrap Rails JSON data, we need to specify
  // what key the object will be wrapped with.
  _name : function() {
    if (!this.name) throw new Error("A 'name' property must be specified");
    return this.name;
  },
 
  // A test to indicate whether the given object is wrapped.
  isWrapped : function(object) {
    return (object.hasOwnProperty(this._name()) &&
        (typeof(object[this._name()]) == "object"));
  },
 
  // Extracts the object's wrapped attributes.
  unwrappedAttributes : function(object) {
    return object[this._name()];
  },
 
  // Wraps the model's attributes under the supplied key.
  wrappedAttributes : function() {
    var object = new Object;
    object[this._name()] = _.clone(this.attributes);
    return object;
  },
 
  // Sets up the new model's internal state so that it matches the
  // expected format. Should be called early in the model's constructor.
  maybeUnwrap : function(args) {
    if (args != undefined && this.isWrapped(args)) {
      this.set(this.unwrappedAttributes(args), { silent: true });
      this.unset(this._name(), { silent: true });
      this._previousAttributes = _.clone(this.attributes);
    }
  }
};
 
_.extend(Backbone.Model.prototype, Backbone.RailsJSON, {
  // This is called on all models coming in from a remote server.
  // Unwraps the given response from the default Rails format.
  parse : function(resp) {
    return this.unwrappedAttributes(resp);
  },
 
  // This is called just before a model is persisted to a remote server.
  // Wraps the model's attributes into a Rails-friendly format.
  toJSON : function(options) {
    // hack in rails auth token
    var object = this.wrappedAttributes();
    //var csrfName = $("meta[name='csrf-param']").attr('content');
    //var csrfValue = $("meta[name='csrf-token']").attr('content');
    //object[csrfName] = csrfValue;
    
    // Allows for additional top level params
    if (options && options.params) {
      for (var key in options.params) {
        object[key] = options.params[key];
      }
    }

    return object;
  },
 
  // A new default initializer which handles data directly from Rails as
  // well as unnested data.
  initialize : function(args) {
    this.maybeUnwrap(args);
  }
}); 

// Override Backbone.sync to add CSRF-TOKEN HEADER
// Original Credit: http://blog.softr.li/post/43146401263/finally-correctly-dealing-with-rails-csrf-protection
Backbone.sync = (function(original) {
  return function(method, model, options) {
    options.beforeSend = function(xhr) {
      xhr.setRequestHeader('X-CSRF-Token', $("meta[name='csrf-token']").attr('content'));
    };
    original(method, model, options);
  };
})(Backbone.sync);

function railsCSRF() {
  //var csrfName = $("meta[name='csrf-param']").attr('content');
  var csrfValue = $("meta[name='csrf-token']").attr('content');
  //return csrfName + "=" + csrfValue;
  return csrfValue;
}
FoodItems = new Mongo.Collection("foodItems");

if (Meteor.isClient) {
  Meteor.subscribe("foodItems");
  
  
  Template.body.helpers({
    foodItems: function () {
      if (Session.get("hideUnclaimed")) {
	return FoodItems.find({claimed: {$ne: false}}, {sort: {createdAt: -1}});
      } else {
	return FoodItems.find({},{sort: {createdAt: -1}});
      }
      
    },
    hideUnclaimed: function() {
      return Session.get("hideUnclaimed");
    },
    claimedCount: function() {
      return FoodItems.find({claimed: {$ne: false}}).count();
    }
    
  });
  
  Template.body.events({
    "submit .new-foodItem": function (event) {
      //called when a new food item is submitted
      
      var description = event.target.description.value;
      var location = event.target.location.value;
      
      Meteor.call("addFoodItem",description,location);
      /*
      FoodItems.insert({
	description: description,
	location: location,
	claimed: false,
	createdAt: new Date(), //current time
	creator: Meteor.userId(), //id of the logged user
	creatorUsername: Meteor.user().username //username of the logged in user
      });
      */
      
      event.target.description.value = "";
      event.target.location.value = "";
      return false;
    },
    "change .hide-unclaimed input": function(event) {
      Session.set("hideUnclaimed",event.target.checked);
    }
    
  });
  
  Template.foodItem.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });
  
  Template.foodItem.events({
    "click .claim": function() {
      Meteor.call("setClaimed",this._id);
      //FoodItems.update(this._id,{$set: {claimed: true}});
    },
    "click .delete": function() {
      Meteor.call("deleteFoodItem",this._id);
      //FoodItems.remove(this._id);
    }
  });
  
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
  
}

if (Meteor.isServer) {
  
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
  Meteor.publish("foodItems", function () {
    return FoodItems.find({
      $or: [
        { claimed: {$ne: true} },
	{ owner: this.userId }
      ]
    });
  });
  
}

Meteor.methods({
  addFoodItem: function(description,location) {
    //make sure a user is logged in
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    
    FoodItems.insert({
	description: description,
	location: location,
	claimed: false,
	createdAt: new Date(), //current time
	creator: Meteor.userId(), //id of the logged user
	creatorUsername: Meteor.user().username, //username of the logged in user
	owner: Meteor.userId() //the initial owner of a newly created foodItem is the user who created it
      });
  },
  deleteFoodItem: function (itemId) {
    if (FoodItems.findOne(itemId).owner!==Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    FoodItems.remove(itemId);
  },
  setClaimed: function (itemId) {
    if (FoodItems.findOne(itemId).claimed===true) {
      throw new Meteor.Error("not-authorized");
    }
    else {
      FoodItems.update(itemId, { $set: { claimed: true} });
      FoodItems.update(itemId, { $set: { owner: Meteor.userId()} });
    }
  }
  
});




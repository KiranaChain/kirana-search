var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStone = require('mongodb').GridStone,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

ProductProvider = function(){
  var that = this;
  mongodbUri = process.env.MONGOLAB_URI || 'mongodb://mongodb';
  MongoClient.connect(mongodbUri,function(err,db){
    if(err) {return console.dir(err);}
    that.db = db;
  })
}

ProductProvider.prototype.getCollection = function(callback){
  this.db.collection('products',function(error, product_collection){
    if(error) callback(error);
    else callback(null, product_collection);
  })
}

ProductProvider.prototype.findAll = function(callback){
  this.getCollection(function(error, product_collection){
    if(error) callback(error);
    else{
      product_collection.find().toArray(function(error, results){
        if(error) callback(error)
        else callback(null,results)
      })
    }
  });
}

ProductProvider.prototype.findById = function(id,callback){
  this.getCollection(function(error,product_collection){
    if(error) callback(error);
    else{
      product_collection.findOne({_id:product_collection.db.bson_serializer.ObjectID.createFromHexString(id)},function(error,result){
        if(error) callback(error);
        else callback(null,result)
      })
    }
  });
}

ProductProvider.prototype.save = function(products,callback){
  this.getCollection(function(error,product_collection){
    if(error) callback(error);
    else{
      if( typeof(products.length)=="undefined")
          products = [products];

        for( var i =0;i< products.length;i++ ) {
          products = products[i];
          products.created_at = new Date();
        }

        product_collection.insert(products, function() {
          callback(null, products);
        });
    }
  })
}

// update an Products
ProductProvider.prototype.update = function(productId, products, callback) {
  this.getCollection(function(error, product_collection) {
    if( error ) callback(error);
    else {
      product_collection.update(
        {_id: product_collection.db.bson_serializer.ObjectID.createFromHexString(productId)},
        products,
        function(error, products) {
          if(error) callback(error);
          else callback(null, products)
        });
    }
  });
};

// Delete an Product

ProductProvider.prototype.delete = function(productId, callback) {
	this.getCollection(function(error, product_collection) {
		if(error) callback(error);
		else {
			product_collection.remove(
				{_id: product_collection.db.bson_serializer.ObjectID.createFromHexString(productId)},
				function(error, product){
					if(error) callback(error);
					else callback(null, product)
				});
			}
	});
};

exports.ProductProvider = ProductProvider;


const esclient = require("../elasticsearch");
const baseCtrl = require("./base_controller");
const bodybuilder = require("bodybuilder");
const prdApiConfig = require("../shared/ProductApiConfig");
const ProductProvider = require('./db/mongo_setup').ProductProvider;

var productProvider = new ProductProvider();

const index = "product";
const type = "default";

module.exports = {
  /**
   *
   * @param {*} req request Object
   * @param {*} res response Object
   * @param {*} next
   * simple get using default values
   */
  get(req, res, next) {
    baseCtrl.get(req, res, next, index, type);
  },

  /**
   * Get the configuration
   */

  getConfig(req, res) {
    res.send(prdApiConfig);
  },

  /**
   * Get the dynamic configuration stats by using aggregation
   * @property {field} req.params.name
   * @returns {aggregations}
   */

  getStatsConfig(req, res) {
    let { field } = req.params;
    let body = bodybuilder();

    body = body.aggregation("stats", field);
    body = body.rawOption("size", "0");
    body = body.build();

    esclient
      .search({ index, type, body })
      .then(data => {
        res.send(data);
      })
      .catch(next);
  },

  /**
   *
   * @property {name} req.params.name - Name of the product.
   * @returns {Hits[]}
   */

  getProductByName(req, res, next) {
    const { name } = req.body;

    esclient
      .search({
        index,
        type,
        body: {
          query: {
            match: {
              name
            }
          }
        }
      })
      .then(data => {
        res.send(data.hits.hits);
      })
      .catch(next);
  },

  /**
   * Search products by criteria.
   * @property {body} req.body - Searching Criteria.
   * @returns {Hits[]}
   */

  search(req, res, next) {
    const query = req.body;

    console.log(JSON.stringify(query, undefined, 2));

    let body = bodybuilder();

    let searchTextObj;

    if (query.searchText) {
      if (query.options === prdApiConfig.enumSearchOptions.isSearchExactMatch) {
        searchTextObj = query.searchText;
        body = body.query("match_phrase", "name", searchTextObj);
        body = body.orQuery("match_phrase", "description", searchTextObj);
        body = body.orQuery("match_phrase", "tags", searchTextObj);
      } else if (
        query.options === prdApiConfig.enumSearchOptions.isSearchProximity
      ) {
        searchTextObj = {
          query: query.searchText,
          slop: prdApiConfig.maxEditDistanceConfig
        };
        body = body.query("match_phrase", "name", searchTextObj);
        body = body.orQuery("match_phrase", "description", searchTextObj);
        body = body.orQuery("match_phrase", "tags", searchTextObj);
      } else {
        if (query.options === prdApiConfig.enumSearchOptions.isSearchFuzzy) {
          searchTextObj = {
            query: query.searchText,
            fuzziness: prdApiConfig.maxFuzzyConfig
          };
        } else {
          searchTextObj = query.searchText;
        }

        body = body.query("match", "name", searchTextObj);
        body = body.orQuery("match", "description", searchTextObj);
        body = body.orQuery("match", "tags", searchTextObj);
      }
    }
    body = body.rawOption("highlight", {
      pre_tags: ["<strong>"],
      post_tags: ["</strong>"],
      fields: { name: {} }
    });

    if (query.rangePrices) {
      const minPrice = query.rangePrices[0];
      const maxPrice = query.rangePrices[1];
      if (maxPrice || minPrice) {
        if (maxPrice && minPrice) {
          body = body.query("range", "price", { gte: minPrice, lte: maxPrice });
        } else if (maxPrice) {
          body = body.query("range", "price", { lte: maxPrice });
        } else {
          body = body.query("range", "price", { gte: minPrice });
        }
      }
    }
    if (query.isActive) {
      body = body.andQuery("match", "is_active", query.isActive);
    }

    if (query.isInStock) {
      body = body.andQuery("range", "in_stock", { gte: 0 });
    }

    if (query.isBestSeller) {
      body = body.andQuery("range", "sold", {
        gte: prdApiConfig.soldBarrierStatusRangeConfig.max
      });
    }

    body = body.build();

    esclient
      .search({
        index,
        type,
        body
      })
      .then(data => {
        res.send(data.hits.hits);
      })
      .catch(next);
  },

  /**
   * Product Mongodb Route Functions
   */

  findAll(req,res){
    productProvider.findAll(function(error, products){
      res.render('index', {
            title: 'Products',
            products:products
        });
      });
    },

    saveNew(req,res){
      productProvider.save({
        name: req.param('name'),
        title: req.param('title')
    }, function( error, docs) {
        res.redirect('/')
    });
    },

    fetchNewProduct(req,res){
      res.render('product_new', {
        title: 'New product'
    });
    },

    getEditProduct(req,res){
      productProvider.findById(req.params.id, function(error, product) {
        res.render('product_edit',
        {
          _id: product._id.toHexString(),
          name: product.name,
          title: product.title,
        });
      });
    },
    editProduct(req,res){
      employeeProvider.update(req.params.id,{
        name: req.param('name'),
        title: req.param('title')
      }, function(error, docs) {
        res.redirect('/')
      });
    },

    removeproduct(req,res){
      employeeProvider.delete(req.params.id, function(error, docs) {
        res.redirect('/')
      });
    }
};


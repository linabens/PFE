const ProductModel = require('../models/ProductModel');

class ProductService {
  async list(options) {
    return ProductModel.findAll(options);
  }
  async get(id) {
    return ProductModel.findById(id);
  }
}

module.exports = new ProductService();

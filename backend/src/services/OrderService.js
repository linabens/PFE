const OrderModel = require('../models/OrderModel');

class OrderService {
  // you can add business logic here; currently thin wrapper
  async create(orderData, items, client) {
    return OrderModel.createOrder(orderData, items, client);
  }
  async getById(id) {
    return OrderModel.findById(id);
  }
}

module.exports = new OrderService();

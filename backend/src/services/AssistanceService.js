const AssistanceModel = require('../models/AssistanceModel');

class AssistanceService {
  async createRequest(tableId) {
    return AssistanceModel.createRequest(tableId);
  }
  async markHandled(id) {
    return AssistanceModel.markHandled(id);
  }
}

module.exports = new AssistanceService();

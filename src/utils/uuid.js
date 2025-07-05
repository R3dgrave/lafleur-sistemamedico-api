const { v4: uuidv4 } = require("uuid");

const generateUuid = () => uuidv4();

module.exports = { generateUuid };

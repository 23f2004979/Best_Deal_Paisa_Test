const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Resolve Prisma client from root node_modules (where prisma generate outputs)
const { PrismaClient } = require(path.join(__dirname, '../../../node_modules/@prisma/client'));
const prisma = new PrismaClient();
module.exports = prisma;

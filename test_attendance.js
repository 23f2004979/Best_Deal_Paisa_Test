const prisma = require('./server/src/config/db');
const attendanceController = require('./server/src/controllers/attendanceController');

async function test() {
  const req = {
    query: {},
    user: { id: 2, role: 'MANAGER' } // Rahul Manager
  };
  const res = {
    json: (data) => console.log('SUCCESS:', data),
    status: (code) => ({
      json: (data) => console.log('ERROR', code, data)
    })
  };
  await attendanceController.getAttendance(req, res);
}

test().catch(console.error);

const prisma = require('./server/src/config/db');

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, managerId: true, teamLeadId: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

checkUsers().catch(console.error);

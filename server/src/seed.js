const path = require('path');
const rootDir = path.join(__dirname, '../..');
const { PrismaClient } = require(path.join(rootDir, 'node_modules/@prisma/client'));
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(rootDir, '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  const hash = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@bestdealpaisa.com' },
    update: {},
    create: {
      empId: 'ADM-1001',
      name: 'Master Admin',
      email: 'admin@bestdealpaisa.com',
      passwordHash: hash,
      role: 'MASTER_ADMIN',
      status: 'ACTIVE',
      baseSalary: 50000,
    }
  });

  // Create a demo manager
  const mgrHash = await bcrypt.hash('Manager@123', 10);
  const mgr = await prisma.user.upsert({
    where: { email: 'manager@bestdealpaisa.com' },
    update: {},
    create: {
      empId: 'MGR-1001',
      name: 'Rahul Manager',
      email: 'manager@bestdealpaisa.com',
      passwordHash: mgrHash,
      role: 'MANAGER',
      status: 'ACTIVE',
      baseSalary: 35000,
    }
  });

  // Create a demo team lead
  const tlHash = await bcrypt.hash('TeamLead@123', 10);
  const tl = await prisma.user.upsert({
    where: { email: 'teamlead@bestdealpaisa.com' },
    update: {},
    create: {
      empId: 'TL-1001',
      name: 'Priya TeamLead',
      email: 'teamlead@bestdealpaisa.com',
      passwordHash: tlHash,
      role: 'TEAM_LEAD',
      status: 'ACTIVE',
      baseSalary: 25000,
      managerId: mgr.id,
    }
  });

  // Create a demo telecaller
  const tcHash = await bcrypt.hash('TeleCaller@123', 10);
  await prisma.user.upsert({
    where: { email: 'telecaller@bestdealpaisa.com' },
    update: {},
    create: {
      empId: 'TC-1001',
      name: 'Amit TeleCaller',
      email: 'telecaller@bestdealpaisa.com',
      passwordHash: tcHash,
      role: 'TELE_CALLER',
      status: 'ACTIVE',
      baseSalary: 15000,
      teamLeadId: tl.id,
    }
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:      admin@bestdealpaisa.com / Admin@123');
  console.log('  Manager:    manager@bestdealpaisa.com / Manager@123');
  console.log('  Team Lead:  teamlead@bestdealpaisa.com / TeamLead@123');
  console.log('  TeleCaller: telecaller@bestdealpaisa.com / TeleCaller@123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

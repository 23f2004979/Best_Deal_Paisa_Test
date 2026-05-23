const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const prismaPath = path.join(root, 'node_modules', '.bin', 'prisma');
const schemaPath = path.join(root, 'prisma', 'schema.prisma');

try {
  execSync(`"${prismaPath}" generate --schema="${schemaPath}"`, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DOTENV_CONFIG_PATH: path.join(root, '.env') }
  });
  console.log('Done!');
} catch(e) {
  console.error('Failed:', e.message);
}

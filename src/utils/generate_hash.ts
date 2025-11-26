import * as bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Por favor proporciona una contraseña como argumento.');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log(`Contraseña: ${password}`);
  console.log(`Hash: ${hash}`);
});

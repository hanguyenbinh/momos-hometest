import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
// initialize the Prisma Client
const prisma = new PrismaClient();

async function main() {
  const numOfUsers = 10;
  const jobs = [];
  for (let i = 0; i < numOfUsers; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = i + faker.internet.email({ firstName, lastName });
    const password = await bcrypt.hash('123456', 10);
    console.log(firstName, lastName, email, password);
    jobs.push(
      prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password,
        },
      }),
    );
  }
  await prisma.$transaction(jobs);
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close the Prisma Client at the end
    await prisma.$disconnect();
  });

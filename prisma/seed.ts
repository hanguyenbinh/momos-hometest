import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
// initialize the Prisma Client
const prisma = new PrismaClient();

async function main() {
  const numOfUsers = 10;
  const numOfGoods = 100;
  const numOfCustomers = 600;
  const numOfOrders = 1000;
  const minProductQuantity = 5;
  const maxProductQuantity = 100;
  const jobs = [];
  for (let i = 0; i < numOfUsers; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = i + faker.internet.email({firstName, lastName});
    const password = await bcrypt.hash('123456', 10);
    console.log(firstName, lastName, email, password)
    jobs.push(prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password
      }
    }))
  }
  for (let i = 0; i < numOfGoods; i++) {
    const name = faker.commerce.productName();
    const quantity = Math.floor(Math.random() * (maxProductQuantity - minProductQuantity + 1)) + minProductQuantity;
    const unitPrice = parseFloat(faker.commerce.price({ min: 5, max: 100 }))
    jobs.push(prisma.goods.create({
      data: {
        name,
        quantity,
        unitPrice
      }
    }))
  }

  for (let i = 0; i < numOfCustomers; i++) {
    const name = faker.person.fullName();
    const phone = faker.phone.number();

    jobs.push(prisma.customer.create({
      data: {
        name,
        phone,
      }
    }))
  }
  await prisma.$transaction(jobs);

  const orderJobs = []

  for (let i = 0; i < numOfOrders; i++) {
    const itemLength = Math.floor(Math.random() * (20)) + 1;
    const items = [];
    for (let j = 0; j < itemLength; j++) {
      const itemId = Math.floor(Math.random() * (numOfGoods)) + 1;
      if (!items.includes(itemId)) items.push(itemId);
    }
    const customerId = Math.floor(Math.random() * (numOfCustomers)) + 1;
    const goods = await prisma.goods.findMany({
      where: {
        id: {
          in: items
        }
      }
    })

    

    
    let total = 0;
    const newGoods = []
    goods.forEach(item=>{
      total+=parseFloat(item.unitPrice.toString())
      const quantity = Math.floor(Math.random() * (item.quantity)) + 1;      
      newGoods.push({...item, quantity})
      orderJobs.push(prisma.goods.update({
        where: {
          id: item.id
        },
        data: {
          quantity: item.quantity = quantity
        }
      }))
    })


    orderJobs.push(prisma.order.create({
      data: {
      customerId: customerId,
        total,
        items: {
          create: newGoods.map(item => {
            return {
              goods: {
                connect: {
                  id: item.id
                }
              },
              quantity: item.quantity              
            }
          })
        }
      }
    }))
  }

  await prisma.$transaction(orderJobs);
  

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
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function createUser() {
  return db.user.create({
    data: {
      email: "test@example.com",
      firstName: "Jan",
      lastName: "Doe",
    },
  });
}

function getShelves(userId: string) {
  return [
    {
      userId,
      name: "Dairy",
      items: {
        create: [
          { userId, name: "Milk" },
          { userId, name: "Eggs" },
          { userId, name: "Cheese" },
        ],
      },
    },
    {
      userId,
      name: "Fruits",
      items: {
        create: [
          { userId, name: "Apples" },
          { userId, name: "Oranges" },
          { userId, name: "Grapes" },
        ],
      },
    },
  ];
}
async function seed() {
  const user = await createUser();
  await Promise.all(
    getShelves(user.id).map((shelf) => db.pantryShelf.create({ data: shelf }))
  );
}

seed();

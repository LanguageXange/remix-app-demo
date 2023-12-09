import db from "~/db.server";
import { handleDelete } from "./utils";
export function getUser(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function getUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}

// create a user if it doesn't exist
export function createUser(email: string, firstName: string, lastName: string) {
  return db.user.create({
    data: {
      email,
      firstName,
      lastName,
    },
  });
}

// delete a user by email

export function deleteUser(email: string) {
  return handleDelete(async () => {
    const user = await getUser(email);

    if (!user) {
      return null;
    }

    await db.myRecipe.deleteMany({ where: { userId: user.id } });
    await db.pantryShelf.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  });
}

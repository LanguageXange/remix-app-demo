import db from "~/db.server";
export function getUser(email: string) {
  return db.user.findUnique({ where: { email } });
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

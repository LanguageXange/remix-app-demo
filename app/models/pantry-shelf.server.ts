import db from "~/db.server";

// model abstraction so that if anything changes to the API we only need to update this file
export function getAllShelves() {
  return db.pantryShelf.findMany();
}

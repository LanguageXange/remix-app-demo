import db from "~/db.server";
import { handleDelete } from "./utils";

// model abstraction so that if anything changes to the API we only need to update this file
export function getAllShelves(userId: string, query: string | null) {
  return db.pantryShelf.findMany({
    where: {
      userId,
      name: {
        contains: query ?? "",
        mode: "insensitive",
      },
    },
    include: {
      items: {
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function createShelf(userId: string) {
  return db.pantryShelf.create({
    data: {
      userId,
      name: "My New Shelf",
    },
  });
}

// code: 'P2025',
// clientVersion: '5.6.0',
// meta: { cause: 'Record to delete does not exist.' }
export function deleteShelf(shelfId: string) {
  return handleDelete(() =>
    db.pantryShelf.delete({
      where: {
        id: shelfId,
      },
    })
  );
}

export async function saveShelfName(shelfId: string, shelfName: string) {
  return db.pantryShelf.update({
    where: {
      id: shelfId,
    },
    data: {
      name: shelfName,
    },
  });
}

export function getShelfById(id: string) {
  return db.pantryShelf.findUnique({ where: { id } });
}

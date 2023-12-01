import db from "~/db.server";

import { handleDelete } from "./utils";

export function createShelfItem(userId: string, shelfId: string, name: string) {
  return db.pantryItem.create({
    data: {
      userId,
      shelfId,
      name,
    },
  });
}

export function deleteShelfItem(itemId: string) {
  return handleDelete(() =>
    db.pantryItem.delete({
      where: {
        id: itemId,
      },
    })
  );
}

export function getShelfItemById(id: string) {
  return db.pantryItem.findUnique({
    where: { id },
  });
}

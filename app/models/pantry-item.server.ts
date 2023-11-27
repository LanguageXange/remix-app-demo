import db from "~/db.server";

import { handleDelete } from "./utils";

export function createShelfItem(shelfId: string, name: string) {
  return db.pantryItem.create({
    data: {
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

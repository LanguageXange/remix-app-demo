import db from "~/db.server";

// model abstraction so that if anything changes to the API we only need to update this file
export function getAllShelves(query: string | null) {
  return db.pantryShelf.findMany({
    where: {
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

export function createShelf() {
  return db.pantryShelf.create({
    data: {
      name: "new shelf 2",
    },
  });
}

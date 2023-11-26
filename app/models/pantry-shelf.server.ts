import { Prisma } from "@prisma/client";
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
      name: "My New Shelf",
    },
  });
}

// code: 'P2025',
// clientVersion: '5.6.0',
// meta: { cause: 'Record to delete does not exist.' }
export async function deleteShelf(shelfId: string) {
  try {
    const updatedDB = await db.pantryShelf.delete({
      where: {
        id: shelfId,
      },
    });

    return updatedDB;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        console.log(err.message);
        return err.message;
      }
    }
    throw Error();
  }
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

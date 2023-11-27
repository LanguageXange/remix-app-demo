import { Prisma } from "@prisma/client";

// delete item and delete shelf function share some similarities
export async function handleDelete<T>(deleteFn: () => T) {
  try {
    const deletedRecord = await deleteFn();
    // need to return something otherwise we will see this error
    // You defined an action for route "routes/app.pantry" but didn't return anything from your `action` function. Please return a value or `null`.

    return deletedRecord;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        console.log(err.message);
        return err.message;
      }
    }
    throw err;
  }
}

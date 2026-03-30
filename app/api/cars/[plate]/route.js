import { connectDB } from "@/lib/mongodb";
import UserCar from "@/models/UserCars";

export async function DELETE(req, { params }) {
  await connectDB();

  // NEXT.JS 15 FIX: Unwrapping the params promise
  const { plate } = await params; 

  try {
    const deletedCar = await UserCar.findOneAndDelete({
      plateNumber: plate
    });

    if (!deletedCar) {
      return Response.json({ error: "Car not found" }, { status: 404 });
    }

    return Response.json({ message: "Car deleted successfully from fleet" });
  } catch (error) {
    return Response.json({ error: "Failed to delete car" }, { status: 500 });
  }
}
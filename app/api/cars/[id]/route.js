import { connectDB } from "@/lib/mongodb";
import UserCar from "@/models/UserCars";

// ---------------------------------------------------------
// PATCH: Update Status (On Duty / Available)
// ---------------------------------------------------------
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    
    // Next.js 15: params is a promise that must be awaited
    const { id } = await params; 
    
    // FIXED: Changed 'request' to 'req' to match the function argument
    const body = await req.json();

   const updatedCar = await UserCar.findByIdAndUpdate(
  id,
  { $set: { status: body.status } }, 
  { 
    returnDocument: 'after', // This replaces { new: true }
    runValidators: true 
  }
);

    if (!updatedCar) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return Response.json(updatedCar);
  } catch (error) {
    console.error("PATCH Error:", error);
    return Response.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

// ---------------------------------------------------------
// DELETE: Remove Vehicle from Fleet
// ---------------------------------------------------------
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;

    const deletedCar = await UserCar.findByIdAndDelete(id);

    if (!deletedCar) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return Response.json({ message: "Vehicle successfully removed from fleet" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return Response.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
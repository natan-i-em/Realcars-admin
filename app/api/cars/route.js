import { connectDB } from "@/lib/mongodb";
import UserCar from "@/models/UserCars";

export async function GET() {
  try {
    await connectDB();
    const cars = await UserCar.find({}).sort({ createdAt: -1 });

    // ALWAYS return a JSON array, even if empty []
    return Response.json(cars || []); 
  } catch (error) {
    console.error("GET Error:", error);
    return Response.json([], { status: 500 });
  }
}
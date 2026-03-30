import { connectDB } from "@/lib/mongodb"
import UserCar from "@/models/UserCars"

export async function GET() {

  await connectDB()

  const cars = await UserCar.find().sort({ createdAt: -1 })

  return Response.json(cars)
}
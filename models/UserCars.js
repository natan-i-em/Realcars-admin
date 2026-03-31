import mongoose from "mongoose"

const UserCarSchema = new mongoose.Schema({
  telegramId: String,
  fullName: String,
  phone: String,
  plateNumber: String,
  carModel: String,
  carYear: Number,
  carPhotos: [String],
  maxRentDays: String,
  rentType: String,
  // ADD THIS FIELD:
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.models.UserCar || mongoose.model("UserCar", UserCarSchema)
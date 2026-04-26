import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  imageUrl: { type: String },
}, { timestamps: true });

specialtySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Specialty = mongoose.model('Specialty', specialtySchema);
export default Specialty;

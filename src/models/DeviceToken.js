import mongoose from 'mongoose';

const deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  deviceType: { type: String },
  deviceName: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

deviceTokenSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
export default DeviceToken;

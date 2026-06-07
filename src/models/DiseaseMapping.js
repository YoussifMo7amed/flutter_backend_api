import mongoose from 'mongoose';

const diseaseMappingSchema = new mongoose.Schema({
  diseaseName: {
    type: String,
    required: true,
    trim: true
  },
  normalizedName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: true
  },
  aliases: [{
    type: String,
    lowercase: true,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexing for faster searches
diseaseMappingSchema.index({ normalizedName: 1 });
diseaseMappingSchema.index({ aliases: 1 });

const DiseaseMapping = mongoose.model('DiseaseMapping', diseaseMappingSchema);

export default DiseaseMapping;

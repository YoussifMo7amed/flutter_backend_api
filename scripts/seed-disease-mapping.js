import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DiseaseMapping from '../src/models/DiseaseMapping.js';
import Specialty from '../src/models/Specialty.js';

dotenv.config();

const diseaseSeedData = [
  // Brain
  { diseaseName: 'Glioma', specialty: 'Neurology', aliases: ['brain glioma'] },
  { diseaseName: 'Meningioma', specialty: 'Neurology', aliases: ['brain meningioma'] },
  { diseaseName: 'Pituitary Tumor', specialty: 'Neurology', aliases: ['pituitary', 'brain pituitary'] },
  { diseaseName: 'No Tumor', specialty: 'General Medicine', aliases: ['notumor'] },

  // Skin
  { diseaseName: 'Melanoma', specialty: 'Dermatology', aliases: [] },
  { diseaseName: 'Basal Cell Carcinoma', specialty: 'Dermatology', aliases: ['bcc'] },
  { diseaseName: 'Melanocytic Nevi', specialty: 'Dermatology', aliases: ['melanocytic nevi (moles)', 'mole', 'nevus'] },
  { diseaseName: 'Seborrheic Keratosis', specialty: 'Dermatology', aliases: [] },
  { diseaseName: 'Actinic Keratosis', specialty: 'Dermatology', aliases: ['akiec'] },
  { diseaseName: 'Benign Keratosis', specialty: 'Dermatology', aliases: ['bkl'] },
  { diseaseName: 'Dermatofibroma', specialty: 'Dermatology', aliases: ['df'] },
  { diseaseName: 'Vascular Lesion', specialty: 'Dermatology', aliases: ['vasc'] },

  // Heart
  { diseaseName: 'Tricuspid Valve Disease', specialty: 'Cardiology', aliases: ['tricuspid valve disease'] },
  { diseaseName: 'Coronary Artery Disease', specialty: 'Cardiology', aliases: ['cad'] },

  // Digestive
  { diseaseName: 'Acute Pancreatitis', specialty: 'Gastroenterology', aliases: [] }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const data of diseaseSeedData) {
      // Find specialty ID
      const specialty = await Specialty.findOne({
        name: { $regex: new RegExp('^' + data.specialty + '$', 'i') }
      });

      if (!specialty) {
        console.warn('Specialty ' + data.specialty + ' not found, skipping ' + data.diseaseName);
        continue;
      }

      const normalized = data.diseaseName.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ');
      
      await DiseaseMapping.findOneAndUpdate(
        { normalizedName: normalized },
        {
          diseaseName: data.diseaseName,
          normalizedName: normalized,
          specialty: specialty._id,
          aliases: data.aliases
        },
        { upsert: true, new: true }
      );
      
      console.log('Seeded mapping: ' + data.diseaseName + ' -> ' + data.specialty);
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seed();

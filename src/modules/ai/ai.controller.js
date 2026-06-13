import fs from 'fs';
import path from 'path';
import AIAnalysis from '../../models/AIAnalysis.js';
import DiseaseMapping from "../../models/DiseaseMapping.js";
import Specialty from '../../models/Specialty.js';
import Doctor from '../../models/Doctor.js';
import * as aiService from './ai.service.js';
import { sendResponse } from '../../utils/response.js';


const normalizePrediction = (prediction) => {
  return prediction
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ');
};

const detectSpecialtyByKeywords = async (normalized) => {
  const rules = [
    {
      specialty: 'Neurology',
      keywords: ['tumor', 'glioma', 'meningioma', 'pituitary', 'headache', 'seizure', 'brain']
    },
    {
      specialty: 'Dermatology',
      keywords: ['skin', 'rash', 'keratosis', 'melanoma', 'nevus', 'mole', 'carcinoma', 'akiec', 'bcc', 'bkl', 'df', 'vasc', 'itching', 'redness']
    },
    {
      specialty: 'Cardiology',
      keywords: ['heart', 'cardiac', 'valve', 'chest', 'tricuspid', 'coronary']
    },
    {
      specialty: 'Gastroenterology',
      keywords: ['stomach', 'pancreatitis', 'abdominal', 'liver', 'digestive']
    }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(keyword => normalized.includes(keyword))) {
      return rule.specialty;
    }
  }
  return 'General Medicine';
};

const mapSpecialty = async (prediction) => {
  if (!prediction) return null;

  const normalized = normalizePrediction(prediction);

  // 1. Search in DiseaseMapping
  let mapping = await DiseaseMapping.findOne({
    $or: [
      { normalizedName: normalized },
      { aliases: normalized }
    ]
  });

  if (mapping) {
    return mapping.specialty;
  }

  // 2. Intelligent fallback specialty detection
  const detectedSpecialtyName = await detectSpecialtyByKeywords(normalized);
  
  const specialty = await Specialty.findOne({
    name: { $regex: new RegExp('^' + detectedSpecialtyName + '$', 'i') }
  });

  if (specialty) {
    // 3. Automatically create new mapping
    try {
      await DiseaseMapping.create({
        diseaseName: prediction,
        normalizedName: normalized,
        specialty: specialty._id
      });
      console.log('Automatically created mapping: ' + prediction + ' -> ' + detectedSpecialtyName);
    } catch (error) {
      // Ignore duplicates if multiple requests come at once
      if (error.code !== 11000) console.error('Error auto-creating mapping:', error);
    }
    return specialty._id;
  }

  return null;
};
const getRecommendedDoctors = async (specialtyId) => {
  if (!specialtyId) return [];
  const doctors = await Doctor.find({ specialtyId, isApproved: true })
    .populate('userId', 'fullName imageUrl')
    .limit(3);
  
  return doctors.map(doc => ({
    id: doc._id.toString(),
    fullName: doc.userId?.fullName || 'Doctor',
    imageUrl: doc.userId?.imageUrl || '',
    consultationFee: doc.consultationFee
  }));
};

export const processSymptoms = async (req, res) => {
  const { symptoms } = req.body;
  
  try {
    const aiResult = await aiService.checkSymptoms(symptoms);
    
    const suggestedSpecialtyId = await mapSpecialty(aiResult.prediction);
    const recommendedDoctors = await getRecommendedDoctors(suggestedSpecialtyId);

    const analysis = await AIAnalysis.create({
      userId: req.user._id,
      type: 'symptoms',
      input: symptoms,
      prediction: aiResult.prediction,
      confidence: aiResult.confidence,
      riskLevel: aiResult.riskLevel,
      recommendation: aiResult.recommendation,
      explanation: aiResult.explanation,
      suggestedSpecialty: suggestedSpecialtyId
    });

    return sendResponse(res, 201, 'Symptom analysis completed', {
      analysis,
      recommendedDoctors
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const processImage = async (req, res) => {
  const { type } = req.body; // 'skin' or 'brain'
  
  if (!['skin', 'brain'].includes(type)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return sendResponse(res, 400, 'Invalid image type. Must be skin or brain.');
  }

  try {
    const aiResult = await aiService.analyzeImage(req.file.path, type);
    
    const suggestedSpecialtyId = await mapSpecialty(aiResult.prediction);
    const recommendedDoctors = await getRecommendedDoctors(suggestedSpecialtyId);

    const analysis = await AIAnalysis.create({
      userId: req.user._id,
      type,
      input: `/uploads/${req.file.filename}`,
      prediction: aiResult.prediction,
      confidence: aiResult.confidence,
      riskLevel: aiResult.riskLevel,
      recommendation: aiResult.recommendation,
      explanation: aiResult.explanation,
      suggestedSpecialty: suggestedSpecialtyId
    });

    return sendResponse(res, 201, `${type.charAt(0).toUpperCase() + type.slice(1)} analysis completed`, {
      analysis,
      recommendedDoctors
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    return sendResponse(res, 500, error.message);
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await AIAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('suggestedSpecialty', 'name');
    
    return sendResponse(res, 200, 'AI history retrieved', history);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getAnalysisById = async (req, res) => {
  try {
    const analysis = await AIAnalysis.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('suggestedSpecialty', 'name');

    if (!analysis) return sendResponse(res, 404, 'Analysis not found');

    const recommendedDoctors = await getRecommendedDoctors(analysis.suggestedSpecialty?._id);

    return sendResponse(res, 200, 'Analysis details retrieved', {
      analysis,
      recommendedDoctors
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const deleteAnalysis = async (req, res) => {
  try {
    const result = await AIAnalysis.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!result) return sendResponse(res, 404, 'Analysis not found');

    // Also delete the image file if it's an image analysis
    if (result.type !== 'symptoms' && result.input.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'src', result.input);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return sendResponse(res, 200, 'Analysis deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

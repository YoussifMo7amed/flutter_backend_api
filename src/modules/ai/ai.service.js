import fs from 'fs';
import path from 'path';

const normalizeAIResponse = (response) => {
  // FastAPI sometimes returns {code,message,data}
  // and sometimes returns direct object
  const data = response.data || response || {};

  let recommendation = '';

  if (Array.isArray(data.recommendations)) {
    recommendation = data.recommendations.join('. ');
  } else if (data.recommendation) {
    recommendation = data.recommendation;
  }

  return {
    prediction:
      data.possible_diagnosis ||
      data.prediction ||
      'Unknown',

    confidence: data.confidence > 1 
  ? Math.round(data.confidence) 
  : Math.round(data.confidence * 100),


    riskLevel:
      data.severity ||
      data.risk ||
      data.risk_level ||
      'Normal',

    recommendation,

    explanation:
      data.description ||
      data.explanation ||
      '',

    suggestedSpecialty:
      data.specialty?.name ||
      data.suggested_specialty ||
      null,

    raw: response
  };
};

export const checkSymptoms = async (symptomsText) => {
  const response = await fetch(`${process.env.AI_SERVICE_URL}/ai/symptoms/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms: symptomsText })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI Service Error: ${error}`);
  }

  const result = await response.json();
  return normalizeAIResponse(result);
};

export const analyzeImage = async (filePath, type) => {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  formData.append('file', blob, path.basename(filePath));

  const endpoint = type === 'skin' ? '/ai/skin/check' : '/ai/image/analyze';
  
  const response = await fetch(`${process.env.AI_SERVICE_URL}${endpoint}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI Service Error: ${error}`);
  }

  const result = await response.json();
  return normalizeAIResponse(result);
};

import rawModelData from './phishing_model.json';

export interface PhishingModelData {
  modelVersion: string;
  trainedSamples: number;
  numFeatures: number;
  intercept: number;
  vocabulary: Record<string, number>;
  idf: number[];
  coefficients: number[];
}

export const PHISHING_MODEL: PhishingModelData = rawModelData as PhishingModelData;

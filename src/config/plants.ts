import { Plant } from '../types';

export const PLANTS: Plant[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    optimalTemp: { min: 18, max: 27 },
    optimalHumidity: { min: 60, max: 80 },
    optimalSoilMoisture: { min: 60, max: 80 },
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    optimalTemp: { min: 15, max: 22 },
    optimalHumidity: { min: 50, max: 70 },
    optimalSoilMoisture: { min: 50, max: 70 },
  },
  {
    id: 'basil',
    name: 'Basil',
    optimalTemp: { min: 20, max: 30 },
    optimalHumidity: { min: 40, max: 60 },
    optimalSoilMoisture: { min: 50, max: 70 },
  },
  {
    id: 'pepper',
    name: 'Bell Pepper',
    optimalTemp: { min: 20, max: 28 },
    optimalHumidity: { min: 50, max: 70 },
    optimalSoilMoisture: { min: 60, max: 80 },
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    optimalTemp: { min: 20, max: 30 },
    optimalHumidity: { min: 70, max: 90 },
    optimalSoilMoisture: { min: 70, max: 90 },
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    optimalTemp: { min: 15, max: 26 },
    optimalHumidity: { min: 60, max: 80 },
    optimalSoilMoisture: { min: 60, max: 80 },
  },
];

export const DEFAULT_PLANT = PLANTS[0];

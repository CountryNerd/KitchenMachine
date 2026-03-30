import { describe, it, expect } from 'vitest';
import { convert, ConversionInput } from './conversion';

describe('Cooking Device Conversion', () => {
    it('converts oven to convection', () => {
        const input: ConversionInput = {
            sourceDevice: 'oven',
            targetDevice: 'convection',
            temperature: 350,
            time: 30
        };
        const result = convert(input);
        expect(result.temperature).toBe(325); // Drops 25 degrees
        expect(result.time).toBe(30); // Time stays the same
    });

    it('converts oven to airfryer', () => {
        const input: ConversionInput = {
            sourceDevice: 'oven',
            targetDevice: 'airfryer',
            temperature: 400,
            time: 20
        };
        const result = convert(input);
        expect(result.temperature).toBe(375); // Drops 25 degrees
        expect(Math.round(result.time)).toBe(16); // Time drops by 20% (20 * 0.8 = 16)
    });

    it('converts airfryer to oven', () => {
        const input: ConversionInput = {
            sourceDevice: 'airfryer',
            targetDevice: 'oven',
            temperature: 375,
            time: 16
        };
        const result = convert(input);
        expect(result.temperature).toBe(400); // Inverse, adds 25
        expect(Math.round(result.time)).toBe(20); // Inverse, divides by 0.8
    });

    it('handles same device conversion transparently', () => {
        const input: ConversionInput = {
            sourceDevice: 'convection',
            targetDevice: 'convection',
            temperature: 325,
            time: 45
        };
        const result = convert(input);
        expect(result.temperature).toBe(325);
        expect(result.time).toBe(45);
    });
});

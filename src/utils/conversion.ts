export type DeviceType = 'oven' | 'convection' | 'airfryer' | 'grill';

export interface ConversionInput {
    sourceDevice: DeviceType;
    targetDevice: DeviceType;
    temperature: number;
    time: number;
}

export interface ConversionResult {
    temperature: number;
    time: number;
}

/**
 * Conversion logic based on standard cooking guidelines:
 * - Convection ovens cook ~25°F cooler than regular ovens
 * - Air fryers cook ~25°F cooler and ~20% faster than regular ovens
 * - Grills approximate oven temps but may vary by recipe
 */
export function convert(input: ConversionInput): ConversionResult {
    const { sourceDevice, targetDevice, temperature, time } = input;

    // If same device, no conversion needed
    if (sourceDevice === targetDevice) {
        return { temperature, time };
    }

    // Convert to "oven" as baseline first
    let baseTemp = temperature;
    let baseTime = time;

    switch (sourceDevice) {
        case 'convection':
            baseTemp = temperature + 25;
            break;
        case 'airfryer':
            baseTemp = temperature + 25;
            baseTime = time / 0.8;
            break;
        case 'grill':
            // Grill temps are roughly equivalent to oven
            break;
    }

    // Convert from baseline to target
    let resultTemp = baseTemp;
    let resultTime = baseTime;

    switch (targetDevice) {
        case 'convection':
            resultTemp = baseTemp - 25;
            break;
        case 'airfryer':
            resultTemp = baseTemp - 25;
            resultTime = baseTime * 0.8;
            break;
        case 'grill':
            // Grill temps are roughly equivalent to oven
            break;
    }

    return {
        temperature: Math.round(resultTemp),
        time: Math.round(resultTime),
    };
}

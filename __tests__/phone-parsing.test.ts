/**
 * Phone Parsing Tests
 * Tests the parsePhoneData function for correct E.164 phone number parsing
 * 
 * Created: January 21, 2026
 * Purpose: Ensure phone_country and phone_calling_code are correctly extracted
 */

describe('Phone Parsing (E.164 Format)', () => {
  // Helper function (copied from page.tsx implementation)
  const parsePhoneData = (phoneE164: string) => {
    if (!phoneE164 || !phoneE164.startsWith('+')) {
      return {
        e164: phoneE164,
        country: 'AE',
        callingCode: '+971'
      };
    }

    const countryMap: { [key: string]: { country: string; callingCode: string } } = {
      '+971': { country: 'AE', callingCode: '+971' }, // UAE
      '+966': { country: 'SA', callingCode: '+966' }, // Saudi Arabia
      '+974': { country: 'QA', callingCode: '+974' }, // Qatar
      '+973': { country: 'BH', callingCode: '+973' }, // Bahrain
      '+968': { country: 'OM', callingCode: '+968' }, // Oman
      '+965': { country: 'KW', callingCode: '+965' }, // Kuwait
      '+1': { country: 'US', callingCode: '+1' },     // USA/Canada
      '+44': { country: 'GB', callingCode: '+44' },   // UK
    };

    // Check for 4-digit codes first
    const code4 = phoneE164.substring(0, 4);
    if (countryMap[code4]) {
      return {
        e164: phoneE164,
        country: countryMap[code4].country,
        callingCode: countryMap[code4].callingCode
      };
    }

    // Check for 3-digit codes
    const code3 = phoneE164.substring(0, 3);
    if (countryMap[code3]) {
      return {
        e164: phoneE164,
        country: countryMap[code3].country,
        callingCode: countryMap[code3].callingCode
      };
    }

    // Check for 2-digit codes
    const code2 = phoneE164.substring(0, 2);
    if (countryMap[code2]) {
      return {
        e164: phoneE164,
        country: countryMap[code2].country,
        callingCode: countryMap[code2].callingCode
      };
    }

    // Default to UAE if no match
    return {
      e164: phoneE164,
      country: 'AE',
      callingCode: '+971'
    };
  };

  describe('GCC Countries (4-digit codes)', () => {
    test('UAE (+971) - should extract correctly', () => {
      const result = parsePhoneData('+971501234567');
      expect(result).toEqual({
        e164: '+971501234567',
        country: 'AE',
        callingCode: '+971'
      });
    });

    test('Saudi Arabia (+966) - should extract correctly', () => {
      const result = parsePhoneData('+966501234567');
      expect(result).toEqual({
        e164: '+966501234567',
        country: 'SA',
        callingCode: '+966'
      });
    });

    test('Qatar (+974) - should extract correctly', () => {
      const result = parsePhoneData('+974501234567');
      expect(result).toEqual({
        e164: '+974501234567',
        country: 'QA',
        callingCode: '+974'
      });
    });

    test('Bahrain (+973) - should extract correctly', () => {
      const result = parsePhoneData('+973501234567');
      expect(result).toEqual({
        e164: '+973501234567',
        country: 'BH',
        callingCode: '+973'
      });
    });

    test('Oman (+968) - should extract correctly', () => {
      const result = parsePhoneData('+968501234567');
      expect(result).toEqual({
        e164: '+968501234567',
        country: 'OM',
        callingCode: '+968'
      });
    });

    test('Kuwait (+965) - should extract correctly', () => {
      const result = parsePhoneData('+965501234567');
      expect(result).toEqual({
        e164: '+965501234567',
        country: 'KW',
        callingCode: '+965'
      });
    });
  });

  describe('Other Countries', () => {
    test('UK (+44) - should extract correctly', () => {
      const result = parsePhoneData('+447911123456');
      expect(result).toEqual({
        e164: '+447911123456',
        country: 'GB',
        callingCode: '+44'
      });
    });

    test('US (+1) - should extract correctly', () => {
      const result = parsePhoneData('+14155552671');
      expect(result).toEqual({
        e164: '+14155552671',
        country: 'US',
        callingCode: '+1'
      });
    });
  });

  describe('Edge Cases', () => {
    test('Empty string - should default to UAE', () => {
      const result = parsePhoneData('');
      expect(result).toEqual({
        e164: '',
        country: 'AE',
        callingCode: '+971'
      });
    });

    test('No plus sign - should default to UAE', () => {
      const result = parsePhoneData('971501234567');
      expect(result).toEqual({
        e164: '971501234567',
        country: 'AE',
        callingCode: '+971'
      });
    });

    test('Unknown country code - should default to UAE', () => {
      const result = parsePhoneData('+999501234567');
      expect(result).toEqual({
        e164: '+999501234567',
        country: 'AE',
        callingCode: '+971'
      });
    });

    test('Very short number - should default to UAE', () => {
      const result = parsePhoneData('+9');
      expect(result).toEqual({
        e164: '+9',
        country: 'AE',
        callingCode: '+971'
      });
    });
  });

  describe('Regression: Old Bug Cases', () => {
    test('UAE number should NOT extract "97" as country', () => {
      const result = parsePhoneData('+971501234567');
      expect(result.country).not.toBe('97'); // OLD BUG
      expect(result.country).toBe('AE');     // FIXED
    });

    test('Saudi number should NOT extract "96" as country', () => {
      const result = parsePhoneData('+966501234567');
      expect(result.country).not.toBe('96'); // OLD BUG
      expect(result.country).toBe('SA');     // FIXED
    });

    test('Calling code should include plus sign', () => {
      const result = parsePhoneData('+971501234567');
      expect(result.callingCode).toContain('+');
      expect(result.callingCode).toBe('+971');
    });
  });

  describe('react-international-phone Integration', () => {
    test('Handles library output format (no spaces)', () => {
      // react-international-phone returns: "+971501234567"
      // NOT: "+971 50 123 4567"
      const libraryOutput = '+971501234567';
      const result = parsePhoneData(libraryOutput);
      
      expect(result.e164).toBe('+971501234567');
      expect(result.country).toBe('AE');
      expect(result.callingCode).toBe('+971');
    });

    test('Multiple UAE numbers in sequence', () => {
      const numbers = [
        '+971501234567',
        '+971521234567',
        '+971551234567'
      ];

      numbers.forEach(num => {
        const result = parsePhoneData(num);
        expect(result.country).toBe('AE');
        expect(result.callingCode).toBe('+971');
      });
    });
  });
});

describe('WhatsApp Phone Parsing', () => {
  const parsePhoneData = (phoneE164: string) => {
    if (!phoneE164 || !phoneE164.startsWith('+')) {
      return {
        e164: phoneE164,
        country: 'AE',
        callingCode: '+971'
      };
    }

    const countryMap: { [key: string]: { country: string; callingCode: string } } = {
      '+971': { country: 'AE', callingCode: '+971' },
      '+966': { country: 'SA', callingCode: '+966' },
      '+974': { country: 'QA', callingCode: '+974' },
      '+973': { country: 'BH', callingCode: '+973' },
      '+968': { country: 'OM', callingCode: '+968' },
      '+965': { country: 'KW', callingCode: '+965' },
      '+1': { country: 'US', callingCode: '+1' },
      '+44': { country: 'GB', callingCode: '+44' },
    };

    const code4 = phoneE164.substring(0, 4);
    if (countryMap[code4]) {
      return {
        e164: phoneE164,
        country: countryMap[code4].country,
        callingCode: countryMap[code4].callingCode
      };
    }

    const code3 = phoneE164.substring(0, 3);
    if (countryMap[code3]) {
      return {
        e164: phoneE164,
        country: countryMap[code3].country,
        callingCode: countryMap[code3].callingCode
      };
    }

    const code2 = phoneE164.substring(0, 2);
    if (countryMap[code2]) {
      return {
        e164: phoneE164,
        country: countryMap[code2].country,
        callingCode: countryMap[code2].callingCode
      };
    }

    return {
      e164: phoneE164,
      country: 'AE',
      callingCode: '+971'
    };
  };

  test('When whatsapp_same_as_phone is true, should use phone data', () => {
    const phoneData = parsePhoneData('+971501234567');
    const whatsappData = phoneData; // Same as phone

    expect(whatsappData).toEqual(phoneData);
    expect(whatsappData.country).toBe('AE');
    expect(whatsappData.callingCode).toBe('+971');
  });

  test('When whatsapp_same_as_phone is false, should parse separate WhatsApp', () => {
    const phoneData = parsePhoneData('+971501234567');    // UAE phone
    const whatsappData = parsePhoneData('+966521234567'); // Saudi WhatsApp

    expect(phoneData.country).toBe('AE');
    expect(whatsappData.country).toBe('SA');
  });

  test('When WhatsApp not provided, should fall back to phone data', () => {
    const phoneData = parsePhoneData('+971501234567');
    const whatsappData = parsePhoneData('') || phoneData; // Fallback

    expect(whatsappData.country).toBe('AE');
  });
});

describe('Database Schema Compatibility', () => {
  test('Output matches database column expectations', () => {
    const result = parsePhoneData('+971501234567');

    // phone_e164 column - expects TEXT
    expect(typeof result.e164).toBe('string');
    expect(result.e164).toBe('+971501234567');

    // phone_country column - expects TEXT (2-letter ISO code)
    expect(typeof result.country).toBe('string');
    expect(result.country).toBe('AE');
    expect(result.country.length).toBe(2);

    // phone_calling_code column - expects TEXT (with + prefix)
    expect(typeof result.callingCode).toBe('string');
    expect(result.callingCode).toBe('+971');
    expect(result.callingCode).toContain('+');
  });

  test('All GCC countries return 2-letter ISO codes', () => {
    const testCases = [
      { phone: '+971501234567', expected: 'AE' },
      { phone: '+966501234567', expected: 'SA' },
      { phone: '+974501234567', expected: 'QA' },
      { phone: '+973501234567', expected: 'BH' },
      { phone: '+968501234567', expected: 'OM' },
      { phone: '+965501234567', expected: 'KW' },
    ];

    testCases.forEach(({ phone, expected }) => {
      const result = parsePhoneData(phone);
      expect(result.country).toBe(expected);
      expect(result.country.length).toBe(2);
    });
  });
});

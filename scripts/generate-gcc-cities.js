const fs = require('fs');
const path = require('path');
const {
  getCountryByCode,
  getStatesOfCountry,
  getAllCitiesOfCountry,
  getCitiesOfState,
} = require('@countrystatecity/countries');

// GCC country codes
const GCC_COUNTRIES = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'];

async function generateGCCCities() {
  const gccData = {
    countries: [],
    citiesByCountry: {},
    statesByCountry: {},
  };

  for (const countryCode of GCC_COUNTRIES) {
    const country = await getCountryByCode(countryCode);
    if (!country) {
      console.warn(`Country ${countryCode} not found`);
      continue;
    }

    console.log(`Processing ${countryCode} - ${country.name}...`);

    // Add country info
    gccData.countries.push({
      code: country.iso2,
      name: country.name,
    });

    // Get states for this country
    const countryStates = await getStatesOfCountry(countryCode);
    console.log(`  States:`, countryStates?.length || 0);
    
    if (Array.isArray(countryStates) && countryStates.length > 0) {
      gccData.statesByCountry[countryCode] = countryStates.map((state) => ({
        code: state.iso2,
        name: state.name,
      }));
    } else {
      gccData.statesByCountry[countryCode] = [];
    }

    // Get cities for this country
    const countryCities = await getAllCitiesOfCountry(countryCode);
    console.log(`  Cities:`, countryCities?.length || 0);
    
    // If states exist, organize cities by state
    if (Array.isArray(countryStates) && countryStates.length > 0) {
      gccData.citiesByCountry[countryCode] = {};
      for (const state of countryStates) {
        const stateCities = await getCitiesOfState(countryCode, state.iso2);
        if (Array.isArray(stateCities)) {
          gccData.citiesByCountry[countryCode][state.iso2] = stateCities
            .map((city) => city.name)
            .sort();
        }
      }
    } else {
      // No states, just list cities directly
      if (Array.isArray(countryCities)) {
        gccData.citiesByCountry[countryCode] = countryCities
          .map((city) => city.name)
          .sort()
          .slice(0, 100); // Limit to top 100 cities if no states
      } else {
        gccData.citiesByCountry[countryCode] = [];
      }
    }
  }

  return gccData;
}

// Generate the data
(async () => {
  const data = await generateGCCCities();

  // Write to file
  const outputPath = path.join(__dirname, '..', 'data', 'gcc-cities.json');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log('\n✅ GCC cities data generated successfully!');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Countries: ${data.countries.length}`);
  Object.keys(data.citiesByCountry).forEach((countryCode) => {
    const cities = data.citiesByCountry[countryCode];
    const cityCount = Array.isArray(cities) ? cities.length : Object.keys(cities).length;
    console.log(`   ${countryCode}: ${cityCount} ${Array.isArray(cities) ? 'cities' : 'states with cities'}`);
  });
})();

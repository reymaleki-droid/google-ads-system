const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://pidopvklxjmmlfutkrhd.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZG9wdmtseGptbWxmdXRrcmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQwMTk1NCwiZXhwIjoyMDgxOTc3OTU0fQ.TaDzgSun5y5O9RKNh3IKU3XFSVq73MSQUMJW_cV3QMk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Running database migration...\n');
  
  try {
    // Step 1: Add booking_timezone column
    console.log('1️⃣  Adding booking_timezone column...');
    const { error: error1 } = await supabase.rpc('exec', {
      query: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_timezone TEXT DEFAULT 'Asia/Dubai';`
    });
    if (error1 && !error1.message.includes('already exists')) {
      console.log('   Note:', error1.message);
    } else {
      console.log('   ✓ booking_timezone column added');
    }

    // Step 2: Add local_start_display column
    console.log('2️⃣  Adding local_start_display column...');
    const { error: error2 } = await supabase.rpc('exec', {
      query: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS local_start_display TEXT;`
    });
    if (error2 && !error2.message.includes('already exists')) {
      console.log('   Note:', error2.message);
    } else {
      console.log('   ✓ local_start_display column added');
    }

    // Step 3: Update existing rows
    console.log('3️⃣  Updating existing bookings...');
    const { data: updated, error: error3 } = await supabase
      .from('bookings')
      .update({ booking_timezone: 'Asia/Dubai' })
      .is('booking_timezone', null)
      .select('id');
    
    if (error3) {
      console.log('   Note:', error3.message);
    } else {
      console.log(`   ✓ Updated ${updated?.length || 0} existing bookings`);
    }

    // Step 4: Verify columns exist
    console.log('4️⃣  Verifying migration...');
    const { data: testData, error: error4 } = await supabase
      .from('bookings')
      .select('id, booking_timezone, local_start_display')
      .limit(1);
    
    if (error4) {
      console.error('   ✗ Verification failed:', error4.message);
    } else {
      console.log('   ✓ Migration verified successfully!');
    }

    console.log('\n✅ Migration completed!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📝 Manual SQL required - see supabase/MIGRATION_INSTRUCTIONS.md');
  }
}

runMigration();

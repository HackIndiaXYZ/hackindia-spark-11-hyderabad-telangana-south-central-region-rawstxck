import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Testing RLS policies as anonymous user...\n');

  // 1. Should be ABLE to insert into cli_sessions
  console.log('Test 1: Attempting to insert into cli_sessions (expected: SUCCESS)');
  const { data: sessionData, error: sessionErr } = await supabase
    .from('cli_sessions')
    .insert([{ status: 'waiting' }])
    .select()
    .single();

  if (sessionErr) {
    console.error('❌ Failed! Anonymous insert to cli_sessions was blocked.', sessionErr.message);
  } else {
    console.log(`✅ Success! Inserted session ID: ${sessionData.id}`);
  }

  // 2. Should be BLOCKED from inserting into repos
  console.log('\nTest 2: Attempting to insert into repos (expected: BLOCKED/FAILURE)');
  const { error: repoErr } = await supabase
    .from('repos')
    .insert([{
      name: 'test-repo',
      bank_id: 'securepush-test-test',
      provider: 'groq'
    }]);

  if (repoErr) {
    console.log('✅ Success! Anonymous insert to repos was blocked as expected.');
    console.log('   Error message:', repoErr.message);
  } else {
    console.error('❌ Failed! Anonymous insert to repos succeeded. RLS is not properly enforcing owner_id!');
  }

  console.log('\nSmoke test complete.');
}

runTest();

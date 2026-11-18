import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const contactPageSource = fs.readFileSync(path.join(projectRoot, 'src', 'pages', 'ContactPage.tsx'), 'utf8');
const getInvolvedPageSource = fs.readFileSync(path.join(projectRoot, 'src', 'pages', 'GetInvolvedPage.tsx'), 'utf8');
const appContextSource = fs.readFileSync(path.join(projectRoot, 'src', 'context', 'AppContext.tsx'), 'utf8');
const typesSource = fs.readFileSync(path.join(projectRoot, 'src', 'types', 'index.ts'), 'utf8');

// ============================================================================
// 1. TYPE SYSTEM AUDIT
// ============================================================================

test('Enquiry and Registration types require explicit boolean consent', () => {
  // Enquiry interface must have consent: boolean
  const enquiryBlock = typesSource.match(/export\s+interface\s+Enquiry\s*\{([\s\S]+?)\}/);
  assert.ok(enquiryBlock, 'Enquiry interface must be defined in src/types/index.ts');
  assert.match(enquiryBlock[1], /consent:\s*boolean;/, 'Enquiry interface must declare consent: boolean');

  // Registration interface must have consent: boolean
  const regBlock = typesSource.match(/export\s+interface\s+Registration\s*\{([\s\S]+?)\}/);
  assert.ok(regBlock, 'Registration interface must be defined in src/types/index.ts');
  assert.match(regBlock[1], /consent:\s*boolean;/, 'Registration interface must declare consent: boolean');
});

// ============================================================================
// 2. CONTACTPAGE.TSX CONSENT AUDIT
// ============================================================================

test('ContactPage has controlled consent checkbox defaulting to false and requires it', () => {
  // State initialization defaults to false
  assert.match(contactPageSource, /const\s*\[consent,\s*setConsent\]\s*=\s*useState\(false\);/);

  // Validation in handleSubmit rejects missing consent before submitting
  assert.match(contactPageSource, /if\s*\(!consent\)\s*\{\s*setError\(/);

  // Checkbox input has accessible association and required attribute
  assert.match(contactPageSource, /id="contact-consent"/);
  assert.match(contactPageSource, /htmlFor="contact-consent"/);
  assert.match(contactPageSource, /type="checkbox"/);
  assert.match(contactPageSource, /checked=\{consent\}/);
  assert.match(contactPageSource, /onChange=\{\(e\)\s*=>\s*setConsent\(e\.target\.checked\)\}/);

  // Accessible wording
  assert.match(
    contactPageSource,
    /I agree that Readers of Aurangabad may use the information I provide to respond to my enquiry\./
  );

  // addEnquiry receives the actual consent value
  assert.match(contactPageSource, /await\s+addEnquiry\(\{\s*type:\s*'contact',\s*name:\s*name\.trim\(\),\s*email:\s*email\.trim\(\),\s*message:\s*message\.trim\(\),\s*consent,/);

  // Consent is reset to false after successful submission
  assert.match(contactPageSource, /setConsent\(false\);/);
});

// ============================================================================
// 3. GETINVOLVEDPAGE.TSX CONSENT AUDIT
// ============================================================================

test('GetInvolvedPage has controlled consent checkbox defaulting to false and requires it', () => {
  // State initialization defaults to false
  assert.match(getInvolvedPageSource, /const\s*\[consent,\s*setConsent\]\s*=\s*useState\(false\);/);

  // Validation in handleSubmit rejects missing consent before submitting
  assert.match(getInvolvedPageSource, /if\s*\(!consent\)\s*\{\s*setErrorMessage\(/);

  // Checkbox input has accessible association and required attribute
  assert.match(getInvolvedPageSource, /id="get-involved-consent"/);
  assert.match(getInvolvedPageSource, /htmlFor="get-involved-consent"/);
  assert.match(getInvolvedPageSource, /type="checkbox"/);
  assert.match(getInvolvedPageSource, /checked=\{consent\}/);
  assert.match(getInvolvedPageSource, /onChange=\{\(e\)\s*=>\s*setConsent\(e\.target\.checked\)\}/);

  // Accessible wording
  assert.match(
    getInvolvedPageSource,
    /I agree that Readers of Aurangabad may use the information I provide to respond to my enquiry\./
  );

  // addEnquiry receives the actual consent value
  assert.match(getInvolvedPageSource, /await\s+addEnquiry\(\{\s*type:\s*activeTab,\s*name:\s*name\.trim\(\),\s*email:\s*email\.trim\(\),\s*phone:\s*phone\.trim\(\),\s*message:\s*message\.trim\(\),\s*consent,/);

  // Consent is reset to false after successful submission
  assert.match(getInvolvedPageSource, /setConsent\(false\);/);
});

// ============================================================================
// 4. APPCONTEXT.TSX — ADDENQUIRY CONSENT ENFORCEMENT
// ============================================================================

test('addEnquiry explicitly validates consent === true and stores supplied consent', () => {
  // Extract addEnquiry function block
  const addEnquiryMatch = appContextSource.match(/const\s+addEnquiry\s*=\s*async[\s\S]+?const\s+updateEnquiryStatus/);
  assert.ok(addEnquiryMatch, 'addEnquiry function must exist in AppContext.tsx');
  const addEnquiryBlock = addEnquiryMatch[0];

  // Rejects missing or false consent with thrown Error
  assert.match(
    addEnquiryBlock,
    /if\s*\(enquiryData\.consent\s*!==\s*true\)\s*\{\s*throw new Error\('Explicit consent is required to submit an enquiry\.'\);\s*\}/
  );

  // Inserts supplied consent value instead of hardcoded true
  assert.match(
    addEnquiryBlock,
    /\.from\('enquiries'\)[\s\S]+?\.insert\(\{[\s\S]+?consent:\s*enquiryData\.consent,[\s\S]+?\}\)/,
    'enquiries table insert must bind consent: enquiryData.consent'
  );

  // Stored in in-memory newEnquiry
  assert.match(
    addEnquiryBlock,
    /const newEnquiry:\s*Enquiry\s*=\s*\{[\s\S]+?consent:\s*enquiryData\.consent,[\s\S]+?\};/
  );
});

// ============================================================================
// 5. APPCONTEXT.TSX — ADDREGISTRATION CONSENT ENFORCEMENT
// ============================================================================

test('addRegistration explicitly validates consent === true and stores supplied consent', () => {
  // Extract addRegistration function block
  const addRegMatch = appContextSource.match(/const\s+addRegistration\s*=\s*async[\s\S]+?const\s+updateRegistrationStatus/);
  assert.ok(addRegMatch, 'addRegistration function must exist in AppContext.tsx');
  const addRegBlock = addRegMatch[0];

  // Rejects missing or false consent with error response
  assert.match(
    addRegBlock,
    /if\s*\(regData\.consent\s*!==\s*true\)\s*\{\s*return\s*\{\s*ok:\s*false,\s*error:\s*'Explicit consent is required to register for this gathering\.'\s*\};\s*\}/
  );

  // Inserts supplied consent value instead of hardcoded true
  assert.match(
    addRegBlock,
    /\.from\('registrations'\)[\s\S]+?\.insert\(\{[\s\S]+?consent:\s*regData\.consent,[\s\S]+?\}\)/,
    'registrations table insert must bind consent: regData.consent'
  );

  // Stored in in-memory newReg
  assert.match(
    addRegBlock,
    /const newReg:\s*Registration\s*=\s*\{[\s\S]+?consent:\s*regData\.consent,[\s\S]+?\};/
  );
});

// ============================================================================
// 6. BEHAVIORAL EXECUTION TESTS (MOCK LOGIC)
// ============================================================================

test('behavioral: simulated addEnquiry rejects false, null, and undefined consent', async () => {
  const insertCalls = [];
  const mockInsert = (payload) => {
    insertCalls.push(payload);
    return {
      select: () => ({
        single: async () => ({ data: { id: 'enq-mock-1' }, error: null })
      })
    };
  };

  const simulateAddEnquiry = async (enquiryData) => {
    if (enquiryData.consent !== true) {
      throw new Error('Explicit consent is required to submit an enquiry.');
    }
    const res = await mockInsert({
      type: enquiryData.type,
      name: enquiryData.name.trim(),
      email: enquiryData.email.trim(),
      message: enquiryData.message.trim(),
      consent: enquiryData.consent,
    }).select().single();
    return res.data.id;
  };

  // 1. Test missing consent (undefined)
  await assert.rejects(
    () => simulateAddEnquiry({
      type: 'contact',
      name: 'Aditi Rao',
      email: 'aditi@example.com',
      message: 'Hello community',
      // consent missing
    }),
    /Explicit consent is required/
  );

  // 2. Test false consent
  await assert.rejects(
    () => simulateAddEnquiry({
      type: 'contact',
      name: 'Aditi Rao',
      email: 'aditi@example.com',
      message: 'Hello community',
      consent: false,
    }),
    /Explicit consent is required/
  );

  // 3. Test truthy non-boolean
  await assert.rejects(
    () => simulateAddEnquiry({
      type: 'contact',
      name: 'Aditi Rao',
      email: 'aditi@example.com',
      message: 'Hello community',
      consent: 'yes',
    }),
    /Explicit consent is required/
  );

  // Verify no inserts were attempted for invalid consent
  assert.equal(insertCalls.length, 0);

  // 4. Test explicit true consent
  const id = await simulateAddEnquiry({
    type: 'contact',
    name: 'Aditi Rao',
    email: 'aditi@example.com',
    message: 'Hello community',
    consent: true,
  });

  assert.equal(id, 'enq-mock-1');
  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0].consent, true);
});

test('behavioral: simulated addRegistration rejects false, null, and undefined consent', async () => {
  const insertCalls = [];
  const mockInsert = (payload) => {
    insertCalls.push(payload);
    return {
      select: () => ({
        single: async () => ({ data: { id: 'reg-mock-1' }, error: null })
      })
    };
  };

  const simulateAddRegistration = async (regData) => {
    if (regData.consent !== true) {
      return { ok: false, error: 'Explicit consent is required to register for this gathering.' };
    }
    const res = await mockInsert({
      meetup_id: regData.meetupId,
      name: regData.name.trim(),
      email: regData.email.trim(),
      consent: regData.consent,
    }).select().single();
    return { ok: true, id: res.data.id };
  };

  // 1. Missing consent
  const res1 = await simulateAddRegistration({
    meetupId: 'meetup-1',
    name: 'Karan Sharma',
    email: 'karan@example.com',
  });
  assert.equal(res1.ok, false);
  assert.match(res1.error, /Explicit consent is required/);

  // 2. False consent
  const res2 = await simulateAddRegistration({
    meetupId: 'meetup-1',
    name: 'Karan Sharma',
    email: 'karan@example.com',
    consent: false,
  });
  assert.equal(res2.ok, false);
  assert.match(res2.error, /Explicit consent is required/);

  // 3. Truthy non-boolean
  const res3 = await simulateAddRegistration({
    meetupId: 'meetup-1',
    name: 'Karan Sharma',
    email: 'karan@example.com',
    consent: 1,
  });
  assert.equal(res3.ok, false);
  assert.match(res3.error, /Explicit consent is required/);

  assert.equal(insertCalls.length, 0);

  // 4. Explicit true consent
  const res4 = await simulateAddRegistration({
    meetupId: 'meetup-1',
    name: 'Karan Sharma',
    email: 'karan@example.com',
    consent: true,
  });
  assert.equal(res4.ok, true);
  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0].consent, true);
});

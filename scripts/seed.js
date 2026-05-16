// scripts/seed.js
// Medipath HMS — Database Seed
// Creates admin user, departments, and sample data

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Medipath HMS database…\n');

  // ─── Departments ────────────────────────────────────────────────────────────
  console.log('Creating departments…');
  const departments = await Promise.all([
    prisma.department.upsert({ where: { code: 'OPD' },  update: {}, create: { name: 'Outpatient Department (OPD)', code: 'OPD', type: 'CLINICAL', location: 'Ground Floor - Block A' } }),
    prisma.department.upsert({ where: { code: 'AE' },   update: {}, create: { name: 'Accident & Emergency', code: 'AE', type: 'CLINICAL', location: 'Ground Floor - Block B' } }),
    prisma.department.upsert({ where: { code: 'MED' },  update: {}, create: { name: 'General Medicine Ward', code: 'MED', type: 'CLINICAL', location: '1st Floor - Block A' } }),
    prisma.department.upsert({ where: { code: 'SURG' }, update: {}, create: { name: 'Surgery', code: 'SURG', type: 'CLINICAL', location: '2nd Floor - Block A' } }),
    prisma.department.upsert({ where: { code: 'PAED' }, update: {}, create: { name: 'Paediatrics', code: 'PAED', type: 'CLINICAL', location: '1st Floor - Block B' } }),
    prisma.department.upsert({ where: { code: 'OBGY' }, update: {}, create: { name: 'Obstetrics & Gynaecology', code: 'OBGY', type: 'CLINICAL', location: '3rd Floor - Block A' } }),
    prisma.department.upsert({ where: { code: 'ICU' },  update: {}, create: { name: 'Intensive Care Unit (ICU)', code: 'ICU', type: 'CLINICAL', location: '2nd Floor - Block B' } }),
    prisma.department.upsert({ where: { code: 'LAB' },  update: {}, create: { name: 'Laboratory', code: 'LAB', type: 'DIAGNOSTIC', location: 'Ground Floor - Block C' } }),
    prisma.department.upsert({ where: { code: 'RAD' },  update: {}, create: { name: 'Radiology', code: 'RAD', type: 'DIAGNOSTIC', location: 'Ground Floor - Block C' } }),
    prisma.department.upsert({ where: { code: 'PHARM' },update: {}, create: { name: 'Pharmacy', code: 'PHARM', type: 'SUPPORT', location: 'Ground Floor - Block D' } }),
    prisma.department.upsert({ where: { code: 'DENT' }, update: {}, create: { name: 'Dental', code: 'DENT', type: 'CLINICAL', location: '1st Floor - Block C' } }),
    prisma.department.upsert({ where: { code: 'PHYSIO'},update: {}, create: { name: 'Physiotherapy', code: 'PHYSIO', type: 'CLINICAL', location: '1st Floor - Block D' } }),
    prisma.department.upsert({ where: { code: 'ADMIN' },update: {}, create: { name: 'Administration', code: 'ADMIN', type: 'ADMINISTRATIVE', location: 'Ground Floor - Main Block' } }),
  ]);
  console.log(`  ✓ ${departments.length} departments`);

  const opdDept = departments.find(d => d.code === 'OPD');
  const labDept = departments.find(d => d.code === 'LAB');
  const pharmDept = departments.find(d => d.code === 'PHARM');

  // ─── Admin User ────────────────────────────────────────────────────────────
  console.log('\nCreating admin user…');
  const adminHash = await bcrypt.hash('Admin@2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medipath.co.ke' },
    update: {},
    create: {
      email: 'admin@medipath.co.ke',
      passwordHash: adminHash,
      role: 'ADMIN',
      isVerified: true,
      staffProfile: {
        create: {
          firstName: 'System', lastName: 'Administrator',
          gender: 'MALE', phone: '0700000000',
          staffNumber: 'AD-2024-0001',
          role: 'ADMIN',
          departmentId: departments.find(d => d.code === 'ADMIN')?.id,
          joinDate: new Date(),
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log(`  ✓ Admin: admin@medipath.co.ke / Admin@2024`);

  // ─── Doctor ────────────────────────────────────────────────────────────────
  console.log('\nCreating sample doctor…');
  const doctorHash = await bcrypt.hash('Doctor@2024', 12);
  await prisma.user.upsert({
    where: { email: 'dr.mwangi@medipath.co.ke' },
    update: {},
    create: {
      email: 'dr.mwangi@medipath.co.ke',
      passwordHash: doctorHash,
      role: 'DOCTOR',
      isVerified: true,
      staffProfile: {
        create: {
          firstName: 'David', lastName: 'Mwangi',
          gender: 'MALE', phone: '0711111111',
          staffNumber: 'DR-2024-0001',
          role: 'DOCTOR', title: 'Dr.',
          specialisation: 'Internal Medicine',
          licenseNumber: 'KMB-12345',
          qualifications: ['MBChB (UoN)', 'MMed Internal Medicine'],
          departmentId: opdDept?.id,
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log(`  ✓ Doctor: dr.mwangi@medipath.co.ke / Doctor@2024`);

  // ─── Nurse ─────────────────────────────────────────────────────────────────
  const nurseHash = await bcrypt.hash('Nurse@2024', 12);
  await prisma.user.upsert({
    where: { email: 'nurse.wanjiku@medipath.co.ke' },
    update: {},
    create: {
      email: 'nurse.wanjiku@medipath.co.ke',
      passwordHash: nurseHash,
      role: 'NURSE',
      isVerified: true,
      staffProfile: {
        create: {
          firstName: 'Amina', lastName: 'Wanjiku',
          gender: 'FEMALE', phone: '0722222222',
          staffNumber: 'NS-2024-0001',
          role: 'NURSE', title: 'RN',
          qualifications: ['BScN (KU)'],
          licenseNumber: 'NCK-67890',
          departmentId: opdDept?.id,
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log(`  ✓ Nurse: nurse.wanjiku@medipath.co.ke / Nurse@2024`);

  // ─── Receptionist ──────────────────────────────────────────────────────────
  const rcHash = await bcrypt.hash('Reception@2024', 12);
  await prisma.user.upsert({
    where: { email: 'reception@medipath.co.ke' },
    update: {},
    create: {
      email: 'reception@medipath.co.ke',
      passwordHash: rcHash,
      role: 'RECEPTIONIST',
      isVerified: true,
      staffProfile: {
        create: {
          firstName: 'Grace', lastName: 'Njeri',
          gender: 'FEMALE', phone: '0733333333',
          staffNumber: 'RC-2024-0001',
          role: 'RECEPTIONIST',
          departmentId: opdDept?.id,
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log(`  ✓ Receptionist: reception@medipath.co.ke / Reception@2024`);

  // ─── Pharmacist ────────────────────────────────────────────────────────────
  const phHash = await bcrypt.hash('Pharma@2024', 12);
  await prisma.user.upsert({
    where: { email: 'pharmacy@medipath.co.ke' },
    update: {},
    create: {
      email: 'pharmacy@medipath.co.ke',
      passwordHash: phHash,
      role: 'PHARMACIST',
      isVerified: true,
      staffProfile: {
        create: {
          firstName: 'Peter', lastName: 'Ochieng',
          gender: 'MALE', phone: '0744444444',
          staffNumber: 'PH-2024-0001',
          role: 'PHARMACIST',
          qualifications: ['BPharm (UoN)'],
          departmentId: pharmDept?.id,
          status: 'ACTIVE',
        },
      },
    },
  });

  // ─── Lab Technician ────────────────────────────────────────────────────────
  const ltHash = await bcrypt.hash('LabTech@2024', 12);
  await prisma.user.upsert({
    where: { email: 'lab@medipath.co.ke' },
    update: {},
    create: {
      email: 'lab@medipath.co.ke',
      passwordHash: ltHash,
      role: 'LAB_TECHNICIAN',
      isVerified: true,
      staffProfile: {
        create: {
          firstName: 'Mary', lastName: 'Kamau',
          gender: 'FEMALE', phone: '0755555555',
          staffNumber: 'LT-2024-0001',
          role: 'LAB_TECHNICIAN',
          qualifications: ['Diploma Med Lab Tech'],
          departmentId: labDept?.id,
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log(`  ✓ Pharmacist & Lab Tech created`);

  // ─── Sample Patient ────────────────────────────────────────────────────────
  console.log('\nCreating sample patient…');
  const patHash = await bcrypt.hash('Patient@2024', 12);
  await prisma.user.upsert({
    where: { email: 'patient@medipath.co.ke' },
    update: {},
    create: {
      email: 'patient@medipath.co.ke',
      passwordHash: patHash,
      role: 'PATIENT',
      isVerified: true,
      patient: {
        create: {
          firstName: 'John', lastName: 'Muriuki',
          dateOfBirth: new Date('1985-06-15'),
          gender: 'MALE', phone: '0766666666',
          nationalId: '12345678',
          county: 'Nairobi', subCounty: 'Westlands',
          bloodGroup: 'O_POSITIVE',
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          emergencyContact: 'Jane Muriuki',
          emergencyPhone: '0777777777',
          emergencyRelation: 'Spouse',
          patientNumber: 'MED-2024-00001',
        },
      },
    },
  });
  console.log(`  ✓ Patient: patient@medipath.co.ke / Patient@2024`);

  // ─── Lab Tests ─────────────────────────────────────────────────────────────
  console.log('\nCreating lab test catalogue…');
  const labTests = [
    { name: 'Full Blood Count (FBC)', code: 'FBC', category: 'Haematology', unitPrice: 800, turnaroundHours: 2, normalRange: 'See reference ranges', units: 'Various' },
    { name: 'Renal Function Tests (RFT)', code: 'RFT', category: 'Biochemistry', unitPrice: 1200, turnaroundHours: 4, units: 'mmol/L' },
    { name: 'Liver Function Tests (LFT)', code: 'LFT', category: 'Biochemistry', unitPrice: 1200, turnaroundHours: 4, units: 'U/L' },
    { name: 'Blood Sugar (Fasting)', code: 'FBS', category: 'Biochemistry', unitPrice: 300, turnaroundHours: 1, normalRange: '3.9 - 5.5', units: 'mmol/L' },
    { name: 'HIV Rapid Test', code: 'HIV', category: 'Serology', unitPrice: 500, turnaroundHours: 1 },
    { name: 'Malaria RDT', code: 'MRDT', category: 'Parasitology', unitPrice: 400, turnaroundHours: 1 },
    { name: 'Urinalysis (UA)', code: 'UA', category: 'Urinalysis', unitPrice: 300, turnaroundHours: 1 },
    { name: 'Chest X-Ray', code: 'CXR', category: 'Radiology', unitPrice: 1500, turnaroundHours: 2 },
    { name: 'Thyroid Function Tests (TFT)', code: 'TFT', category: 'Endocrinology', unitPrice: 2000, turnaroundHours: 24 },
    { name: 'Lipid Profile', code: 'LIPID', category: 'Biochemistry', unitPrice: 1500, turnaroundHours: 4, units: 'mmol/L' },
    { name: 'HbA1c', code: 'HBA1C', category: 'Biochemistry', unitPrice: 1800, turnaroundHours: 4, normalRange: '< 6.5%', units: '%' },
    { name: 'Blood Culture & Sensitivity', code: 'BCS', category: 'Microbiology', unitPrice: 3000, turnaroundHours: 72 },
    { name: 'Sputum AFB / Gene Xpert', code: 'TB', category: 'Microbiology', unitPrice: 2500, turnaroundHours: 48 },
    { name: 'Pregnancy Test (uHCG)', code: 'HCG', category: 'Serology', unitPrice: 300, turnaroundHours: 1 },
    { name: 'CD4 Count', code: 'CD4', category: 'Immunology', unitPrice: 2500, turnaroundHours: 4, units: 'cells/μL' },
  ];

  let labCreated = 0;
  for (const test of labTests) {
    await prisma.labTest.upsert({ where: { code: test.code }, update: {}, create: { ...test, departmentId: labDept?.id } });
    labCreated++;
  }
  console.log(`  ✓ ${labCreated} lab tests`);

  // ─── Sample Drugs ─────────────────────────────────────────────────────────
  console.log('\nCreating drug formulary…');
  const drugs = [
    { name: 'Amoxicillin 500mg Capsules', genericName: 'Amoxicillin', category: 'Antibiotic', form: 'Capsule', strength: '500mg', unit: 'Capsule', stockQuantity: 5000, reorderLevel: 500, unitPrice: 8, requiresPrescription: true },
    { name: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol', category: 'Analgesic/Antipyretic', form: 'Tablet', strength: '500mg', unit: 'Tablet', stockQuantity: 10000, reorderLevel: 1000, unitPrice: 3, requiresPrescription: false },
    { name: 'Metformin 500mg Tablets', genericName: 'Metformin HCl', category: 'Antidiabetic', form: 'Tablet', strength: '500mg', unit: 'Tablet', stockQuantity: 3000, reorderLevel: 300, unitPrice: 12, requiresPrescription: true },
    { name: 'Amlodipine 5mg Tablets', genericName: 'Amlodipine', category: 'Antihypertensive', form: 'Tablet', strength: '5mg', unit: 'Tablet', stockQuantity: 2000, reorderLevel: 200, unitPrice: 18, requiresPrescription: true },
    { name: 'Artemether/Lumefantrine 20/120mg', genericName: 'Artemether/Lumefantrine', category: 'Antimalarial', form: 'Tablet', strength: '20/120mg', unit: 'Tablet', stockQuantity: 2000, reorderLevel: 200, unitPrice: 25, requiresPrescription: true },
    { name: 'Ciprofloxacin 500mg Tablets', genericName: 'Ciprofloxacin', category: 'Antibiotic', form: 'Tablet', strength: '500mg', unit: 'Tablet', stockQuantity: 1500, reorderLevel: 150, unitPrice: 22, requiresPrescription: true },
    { name: 'ORS Sachets', genericName: 'Oral Rehydration Salts', category: 'Rehydration', form: 'Sachet', strength: '1 litre', unit: 'Sachet', stockQuantity: 2000, reorderLevel: 200, unitPrice: 15, requiresPrescription: false },
    { name: 'IV Normal Saline 500ml', genericName: 'Sodium Chloride 0.9%', category: 'IV Fluid', form: 'IV Bag', strength: '0.9%', unit: 'Bag', stockQuantity: 500, reorderLevel: 50, unitPrice: 220, requiresPrescription: true },
    { name: 'Diclofenac 50mg Tablets', genericName: 'Diclofenac Sodium', category: 'NSAID', form: 'Tablet', strength: '50mg', unit: 'Tablet', stockQuantity: 2000, reorderLevel: 200, unitPrice: 10, requiresPrescription: true },
    { name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol', category: 'Bronchodilator', form: 'Inhaler', strength: '100mcg/dose', unit: 'Inhaler', stockQuantity: 200, reorderLevel: 20, unitPrice: 350, requiresPrescription: true },
  ];

  let drugCreated = 0;
  for (const drug of drugs) {
    const exists = await prisma.drug.findFirst({ where: { name: drug.name } });
    if (!exists) { await prisma.drug.create({ data: drug }); drugCreated++; }
  }
  console.log(`  ✓ ${drugCreated} drugs added to formulary`);

  // ─── System Config ─────────────────────────────────────────────────────────
  console.log('\nCreating system config…');
  const configs = [
    { key: 'hospital_name', value: 'Medipath General Hospital', group: 'GENERAL' },
    { key: 'hospital_address', value: 'P.O. Box 12345, Nairobi, Kenya', group: 'GENERAL' },
    { key: 'hospital_phone', value: '+254 20 123 4567', group: 'GENERAL' },
    { key: 'hospital_email', value: 'info@medipath.co.ke', group: 'GENERAL' },
    { key: 'hospital_website', value: 'https://medipath.co.ke', group: 'GENERAL' },
    { key: 'consultation_fee_opd', value: '500', group: 'BILLING' },
    { key: 'consultation_fee_specialist', value: '1500', group: 'BILLING' },
    { key: 'admission_fee', value: '2000', group: 'BILLING' },
    { key: 'currency', value: 'KES', group: 'BILLING' },
    { key: 'nhif_facility_code', value: 'MED001', group: 'INSURANCE' },
  ];
  for (const config of configs) {
    await prisma.systemConfig.upsert({ where: { key: config.key }, update: { value: config.value }, create: config });
  }
  console.log(`  ✓ ${configs.length} system config entries`);

  console.log('\n✅ Seeding complete!\n');
  console.log('─────────────────────────────────────────────────');
  console.log('🔑 Default Credentials:');
  console.log('   Admin       : admin@medipath.co.ke / Admin@2024');
  console.log('   Doctor      : dr.mwangi@medipath.co.ke / Doctor@2024');
  console.log('   Nurse       : nurse.wanjiku@medipath.co.ke / Nurse@2024');
  console.log('   Receptionist: reception@medipath.co.ke / Reception@2024');
  console.log('   Pharmacist  : pharmacy@medipath.co.ke / Pharma@2024');
  console.log('   Lab Tech    : lab@medipath.co.ke / LabTech@2024');
  console.log('   Patient     : patient@medipath.co.ke / Patient@2024');
  console.log('─────────────────────────────────────────────────\n');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

#!/usr/bin/env node

/**
 * Test script for database creation functionality
 * This script demonstrates the automated database creation system
 */

const { createAndVerifyDatabase } = require('../src/lib/db-creation');

async function testDatabaseCreation() {
  console.log('🚀 Testing Automated Database Creation System...\n');

  try {
    // Test the full database creation and verification process
    const result = await createAndVerifyDatabase({
      skipUserCreation: false, // Create user as well
    });

    console.log('📊 Database Creation Results:');
    console.log('================================');
    console.log(`Overall Success: ${result.overallSuccess ? '✅' : '❌'}`);
    console.log(`Summary: ${result.summary}\n`);

    console.log('📋 Database Result:');
    console.log(`- Success: ${result.databaseResult.success ? '✅' : '❌'}`);
    console.log(`- Created: ${result.databaseResult.created ? 'Yes' : 'No'}`);
    console.log(`- Database: ${result.databaseResult.databaseName}`);
    console.log(`- Charset: ${result.databaseResult.charset}`);
    console.log(`- Collation: ${result.databaseResult.collation}`);
    console.log(`- Errors: ${result.databaseResult.errors.length}\n`);

    if (result.userResult) {
      console.log('👤 User Result:');
      console.log(`- Success: ${result.userResult.success ? '✅' : '❌'}`);
      console.log(`- Created: ${result.userResult.created ? 'Yes' : 'No'}`);
      console.log(`- Username: ${result.userResult.username}`);
      console.log(`- Permissions Granted: ${result.userResult.permissionsGranted ? '✅' : '❌'}`);
      console.log(`- Errors: ${result.userResult.errors.length}\n`);
    }

    console.log('🔍 Verification Result:');
    console.log(`- Overall Success: ${result.verificationResult.overallSuccess ? '✅' : '❌'}`);
    console.log(`- Database Verified: ${result.verificationResult.databaseVerified ? '✅' : '❌'}`);
    console.log(`- User Verified: ${result.verificationResult.userVerified ? '✅' : '❌'}`);
    console.log(`- Permissions Verified: ${result.verificationResult.permissionsVerified ? '✅' : '❌'}`);
    console.log(`- Charset Correct: ${result.verificationResult.charsetCorrect ? '✅' : '❌'}`);
    console.log(`- Collation Correct: ${result.verificationResult.collationCorrect ? '✅' : '❌'}`);
    console.log(`- Health Status: ${result.verificationResult.verificationReport.summary.overallHealth}\n`);

    if (result.verificationResult.verificationReport.details.issues.length > 0) {
      console.log('⚠️ Issues Found:');
      result.verificationResult.verificationReport.details.issues.forEach(issue => {
        console.log(`- ${issue}`);
      });
      console.log();
    }

    if (result.verificationResult.verificationReport.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      result.verificationResult.verificationReport.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
      console.log();
    }

    console.log('🎉 Database creation test completed!');
    
    if (result.overallSuccess) {
      console.log('✅ All systems are ready for use!');
      process.exit(0);
    } else {
      console.log('⚠️ Some issues were found. Please review the results above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Database creation test failed:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDatabaseCreation();
}

module.exports = { testDatabaseCreation };

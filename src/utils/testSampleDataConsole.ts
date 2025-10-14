// Quick test to verify sample data works with the CV API
import { testSampleDataTransformation } from './testSampleData';

// Add this to the console for manual testing
type TestFunction = () => { success: boolean; payload?: unknown; validation?: unknown; error?: unknown };
(window as { testSampleAPIPayload?: TestFunction }).testSampleAPIPayload = testSampleDataTransformation;

console.log('🧪 Sample data test utility loaded');
console.log('Run testSampleAPIPayload() in the console to test sample data transformation');

export { testSampleDataTransformation };
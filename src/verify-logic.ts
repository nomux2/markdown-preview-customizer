import * as MarkdownIt from 'markdown-it';
import { extendMarkdownIt } from './markdown-it-plugin';

// Mock VS Code environment is not needed for logic test if we decouple dependency
// But markdown-it-plugin depends on 'markdown-it-container' which is fine.

console.log('--- Starting Logic Verification ---');

const md = new MarkdownIt({
    html: true,
    breaks: true
});

// Apply our plugin
extendMarkdownIt(md);

// Test Cases
const testCases = [
    {
        name: 'Alert Container',
        input: '::: alert Warning\nContent\n:::',
        expectedPartial: '<div class="antigravity-container alert">'
    },
    {
        name: 'Alert Title',
        input: '::: alert Warning\nContent\n:::',
        expectedPartial: '<span class="antigravity-container-title">Warning</span>'
    },
    {
        name: 'Card Container',
        input: '::: card\n# Title\nBody\n:::',
        expectedPartial: '<div class="antigravity-card">'
    },
    {
        name: 'Columns Container',
        input: '::: columns\n::: column\nA\n:::\n:::',
        expectedPartial: '<div class="antigravity-columns">'
    }
];

let failed = 0;

testCases.forEach(test => {
    const output = md.render(test.input);
    if (output.includes(test.expectedPartial)) {
        console.log(`[PASS] ${test.name}`);
    } else {
        console.error(`[FAIL] ${test.name}`);
        console.error(`Expected to contain: ${test.expectedPartial}`);
        console.error(`Actual output: ${output}`);
        failed++;
    }
});

if (failed === 0) {
    console.log('--- All Logic Tests Passed ---');
    process.exit(0);
} else {
    console.error(`--- ${failed} Tests Failed ---`);
    process.exit(1);
}

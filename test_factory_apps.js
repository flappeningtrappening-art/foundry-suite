const BASE_URL = "http://localhost:3400";

async function testThreadGenerator() {
    console.log("\n--- [TEST: FOUNDRY X (Thread Generator)] ---");
    try {
        const response = await fetch(`${BASE_URL}/threadGeneratorFlow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    topic: "The impact of AI on the local real estate market in New Mexico",
                    styleSamples: [
                        "Listen, if you're not looking at the data, you're flying blind. 🧵",
                        "Here is the cold, hard truth about what's coming next. 👇"
                    ]
                }
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        console.log("THREAD RESULT:");
        console.log(JSON.stringify(data.result, null, 2));
    } catch (error) {
        console.error("Thread Generator Failed:", error.message);
    }
}

async function testColdEmailOutreach() {
    console.log("\n--- [TEST: FOUNDRY OUTREACH (Cold Email)] ---");
    try {
        const response = await fetch(`${BASE_URL}/coldEmailFlow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    recipientInfo: "CEO of a major New Mexico construction firm",
                    myProduct: "SPECTRE Forensic Audit Suite",
                    valueProp: "Automated detection of property discrepancies that saves millions in litigation",
                    cta: "Book a 15-min forensic demo",
                    tone: "Aggressive yet professional",
                    caseId: "00000000-0000-0000-0000-000000000000"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        console.log("EMAIL RESULT:");
        console.log(JSON.stringify(data.result, null, 2));
    } catch (error) {
        console.error("Cold Email Failed:", error.message);
    }
}

async function runTests() {
    await testThreadGenerator();
    await testColdEmailOutreach();
}

runTests();
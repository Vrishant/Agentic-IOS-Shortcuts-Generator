const { GoogleGenAI } = require("@google/genai");
const OpenAI = require("openai");
require("dotenv").config();

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// OpenAI client (lazy initialization)
let openai = null;
function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

async function checkGeminiModels() {
  console.log("\n========== GEMINI MODELS ==========");
  try {
    console.log("Checking commonly available Gemini models...");

    const candidates = [
      "gemini-2.5-flash",
      // "gemini-2.0-flash",
      // "gemini-1.5-pro-exp-0827",
      // "gemini-1.5-pro",
      // "gemini-pro",
      // "gemini-1.0-pro"
    ];

    for (const modelName of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ SUCCESS: '${modelName}' is working!`);
        return true;
      } catch (e) {
        console.log(`❌ Failed: '${modelName}'`);
        console.log(`   Error: ${e.message?.split('\n')[0] || e}`);
      }
    }

    console.log("\n⚠️ No Gemini models succeeded");
    return false;
  } catch (error) {
    console.error("Fatal Error checking Gemini models:", error);
    return false;
  }
}

// async function checkOpenAIModels() {
//   console.log("\n========== OPENAI MODELS ==========");
//   const client = getOpenAIClient();
  
//   if (!client) {
//     console.log("⚠️ OPENAI_API_KEY not found in environment variables");
//     return false;
//   }

//   try {
//     console.log("Checking commonly available OpenAI models...");

//     const candidates = [
//       "gpt-4o",
//       "gpt-4o-mini",
//       "gpt-4-turbo",
//       "gpt-4",
//       "gpt-3.5-turbo"
//     ];

//     for (const modelName of candidates) {
//       try {
//         const completion = await client.chat.completions.create({
//           model: modelName,
//           messages: [{ role: "user", content: "Hello" }],
//           max_tokens: 5
//         });
//         console.log(`✅ SUCCESS: '${modelName}' is working!`);
//         return true;
//       } catch (e) {
//         console.log(`❌ Failed: '${modelName}'`);
//         console.log(`   Error: ${e.message?.split('\n')[0] || e}`);
//       }
//     }

//     console.log("\n⚠️ No OpenAI models succeeded");
//     return false;
//   } catch (error) {
//     console.error("Fatal Error checking OpenAI models:", error);
//     return false;
//   }
// }

async function listModels() {
  console.log("======================================");
  console.log("       MODEL AVAILABILITY CHECK      ");
  console.log("======================================");

  // Check both providers
  const geminiSuccess = await checkGeminiModels();
  // const openaiSuccess = await checkOpenAIModels();

  console.log("\n======================================");
  console.log("              SUMMARY                 ");
  console.log("======================================");
  console.log(`Gemini: ${geminiSuccess ? '✅ At least one model works' : '❌ No models available'}`);
  // console.log(`OpenAI: ${openaiSuccess ? '✅ At least one model works' : '❌ No models available'}`);
  console.log("======================================");
}

listModels();


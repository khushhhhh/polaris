import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from "convex/browser";
import { Inngest } from "inngest";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  }
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

if (!internalKey) {
  console.error("POLARIS_CONVEX_INTERNAL_KEY not found in .env.local!");
  process.exit(1);
}

console.log("Convex URL:", convexUrl);
console.log("Internal Key:", internalKey);

// Initialize Convex Client
const convex = new ConvexHttpClient(convexUrl);

// Initialize Inngest Client pointing to local dev server
const inngest = new Inngest({ 
  id: "polaris", 
  eventKey: "local",
  urls: {
    event: "http://localhost:8288/e/local",
  }
});

async function runTests() {
  console.log("\n🚀 Starting End-to-End Feature Verification Tests...\n");

  const ownerId = "test_user_123";

  // Test 1: Project & Conversation Creation
  console.log("--- Test 1: Project & Conversation Creation ---");
  const { projectId, conversationId } = await convex.mutation(
    api.system.createProjectWithConversation,
    {
      internalKey,
      projectName: "e2e-test-project",
      conversationTitle: "E2E Test Conversation",
      ownerId,
    }
  );
  console.log(`✅ Project created with ID: ${projectId}`);
  console.log(`✅ Conversation created with ID: ${conversationId}`);

  // Test 2: File Explorer operations (Folders and Files)
  console.log("\n--- Test 2: File Explorer Operations ---");
  
  // Create a folder named "src"
  const folderId = await convex.mutation(api.system.createFolder, {
    internalKey,
    projectId,
    name: "src",
  });
  console.log(`✅ Folder "src" created with ID: ${folderId}`);

  // Create a file "index.js" inside "src"
  const fileId = await convex.mutation(api.system.createFile, {
    internalKey,
    projectId,
    name: "index.js",
    content: "// Hello World",
    parentId: folderId,
  });
  console.log(`✅ File "src/index.js" created with ID: ${fileId}`);

  // Get project files and check
  let files = await convex.query(api.system.getProjectFiles, {
    internalKey,
    projectId,
  });
  console.log(`✅ Checked project files list. Total files/folders found: ${files.length}`);
  const hasFolder = files.some(f => f.name === "src" && f.type === "folder");
  const hasFile = files.some(f => f.name === "index.js" && f.type === "file" && f.parentId === folderId);
  if (hasFolder && hasFile) {
    console.log("   👉 File/Folder hierarchies verified successfully.");
  } else {
    throw new Error("Folder or file not found in file list!");
  }

  // Test 3: Editing (Update File Content)
  console.log("\n--- Test 3: Editing (File Content Update) ---");
  const updatedCode = "console.log('Hello E2E Test');";
  await convex.mutation(api.system.updateFile, {
    internalKey,
    fileId,
    content: updatedCode,
  });
  console.log("✅ File content updated.");

  const fileDoc = await convex.query(api.system.getFileById, {
    internalKey,
    fileId,
  });
  if (fileDoc && fileDoc.content === updatedCode) {
    console.log("   👉 Verified file content updated successfully.");
  } else {
    throw new Error("File content update verification failed!");
  }

  // Rename the file to "main.js"
  await convex.mutation(api.system.renameFile, {
    internalKey,
    fileId,
    newName: "main.js",
  });
  console.log("✅ File renamed to 'main.js'.");
  const renamedDoc = await convex.query(api.system.getFileById, {
    internalKey,
    fileId,
  });
  if (renamedDoc && renamedDoc.name === "main.js") {
    console.log("   👉 Verified file rename successfully.");
  } else {
    throw new Error("File rename verification failed!");
  }

  // Test 4: Chat System & AI Agent processing (mock mode)
  console.log("\n--- Test 4: Chat System & AI Integration (Mock Fallback) ---");
  
  // Create user message
  const userMsgId = await convex.mutation(api.system.createMessage, {
    internalKey,
    conversationId,
    projectId,
    role: "user",
    content: "build a simple calculator for me",
  });
  console.log(`✅ User message created: ${userMsgId}`);

  // Create assistant message placeholder (status: processing)
  const assistantMsgId = await convex.mutation(api.system.createMessage, {
    internalKey,
    conversationId,
    projectId,
    role: "assistant",
    content: "",
    status: "processing",
  });
  console.log(`✅ Assistant message placeholder created: ${assistantMsgId}`);

  // Send the event to trigger Inngest
  console.log("✅ Sending message/sent event to Inngest dev server...");
  await inngest.send({
    name: "message/sent",
    data: {
      messageId: assistantMsgId,
      conversationId,
      projectId,
      message: "build a simple calculator for me",
    },
  });

  // Poll Convex for Assistant's response to be updated and completed by Inngest
  console.log("🕒 Waiting for Inngest background process to complete...");
  let attempts = 0;
  let assistantResponseDone = false;
  let responseContent = "";
  
  while (attempts < 20) {
    await new Promise(r => setTimeout(r, 1000));
    
    // Fetch recent messages
    const messages = await convex.query(api.system.getRecentMessages, {
      internalKey,
      conversationId,
      limit: 10,
    });
    
    const assistantMsg = messages.find(m => m._id === assistantMsgId);
    if (assistantMsg && assistantMsg.status === "completed") {
      assistantResponseDone = true;
      responseContent = assistantMsg.content;
      break;
    }
    attempts++;
  }

  if (assistantResponseDone) {
    console.log(`✅ Inngest background process finished successfully!`);
    console.log(`👉 Assistant Response: "${responseContent}"`);
  } else {
    throw new Error("Timed out waiting for Inngest background process!");
  }

  // Verify the mock calculator file is generated by the mock handler
  const projectFiles = await convex.query(api.system.getProjectFiles, {
    internalKey,
    projectId,
  });
  const hasCalculator = projectFiles.some(f => f.name === "index.html" && f.type === "file");
  if (hasCalculator) {
    console.log("✅ Verified index.html generated by mock agent successfully.");
  } else {
    throw new Error("index.html not generated by agent!");
  }

  // Test 5: File Deletion Cleanup
  console.log("\n--- Test 5: Deletion ---");
  await convex.mutation(api.system.deleteFile, {
    internalKey,
    fileId: folderId, // deleting folder "src"
  });
  console.log("✅ Folder deleted recursively.");

  const filesAfterDelete = await convex.query(api.system.getProjectFiles, {
    internalKey,
    projectId,
  });
  const hasDeletedFolder = filesAfterDelete.some(f => f._id === folderId);
  const hasDeletedFile = filesAfterDelete.some(f => f._id === fileId);
  
  if (!hasDeletedFolder && !hasDeletedFile) {
    console.log("✅ Checked files after deletion. Recursive cleanup verified.");
  } else {
    throw new Error("Folder/file was not fully deleted!");
  }

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Feature verification complete.\n");
}

runTests().catch(err => {
  console.error("\n❌ E2E FEATURE VERIFICATION TESTS FAILED:\n", err);
  process.exit(1);
});

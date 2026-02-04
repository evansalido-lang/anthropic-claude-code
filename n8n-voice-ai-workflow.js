const C={name:'ElevenLabs Voice Agent - RAG',path:'elevenlabs-voice-agent',collection:'your-collection-name',model:'gemini-1.5-flash',temp:0.7,embedModel:'text-embedding-3-small',topK:5,prompt:`You are a voice assistant. Use knowledge_base tool before answering. Keep responses concise (2-3 sentences). Speak naturally. Avoid jargon and formatting.`};

const webhook=()=>({parameters:{httpMethod:'POST',path:C.path,responseMode:'responseNode',options:{}},id:'w1',name:'ElevenLabs Webhook',type:'n8n-nodes-base.webhook',typeVersion:2,position:[0,0]});

const extract=()=>({parameters:{mode:'runOnceForAllItems',jsCode:`const d=$input.first().json.body;return[{json:{query:d.text||d.transcript||'',cid:d.conversation_id||'default'}}];`},id:'e1',name:'Extract Query',type:'n8n-nodes-base.code',typeVersion:2,position:[200,0]});

const agent=()=>({parameters:{promptType:'define',text:'={{ $json.query }}',options:{systemMessage:C.prompt}},id:'a1',name:'AI Agent',type:'@n8n/n8n-nodes-langchain.agent',typeVersion:1.7,position:[400,0]});

const gemini=(id='cred1')=>({parameters:{model:C.model,options:{temperature:C.temp}},id:'g1',name:'Gemini',type:'@n8n/n8n-nodes-langchain.lmChatGoogleGemini',typeVersion:1,position:[300,200],credentials:{googleGeminiApi:{id,name:'Gemini'}}});

const qdrant=(id='cred2')=>({parameters:{qdrantCollection:{__rl:true,mode:'list',value:C.collection},options:{}},id:'q1',name:'Qdrant',type:'@n8n/n8n-nodes-langchain.vectorStoreQdrant',typeVersion:1,position:[600,400],credentials:{qdrantApi:{id,name:'Qdrant'}}});

const embed=(id='cred3')=>({parameters:{model:C.embedModel,options:{}},id:'em1',name:'Embeddings',type:'@n8n/n8n-nodes-langchain.embeddingsOpenAi',typeVersion:1,position:[600,500],credentials:{openAiApi:{id,name:'OpenAI'}}});

const tool=()=>({parameters:{name:'knowledge_base',description:'Search knowledge base for answers.',topK:C.topK},id:'t1',name:'KB Tool',type:'@n8n/n8n-nodes-langchain.toolVectorStore',typeVersion:1,position:[500,200]});

const memory=()=>({parameters:{sessionIdType:'customKey',sessionKey:'={{ $json.cid }}'},id:'m1',name:'Memory',type:'@n8n/n8n-nodes-langchain.memoryBufferWindow',typeVersion:1.3,position:[400,200]});

const format=()=>({parameters:{mode:'runOnceForAllItems',jsCode:`const r=$input.first().json.output;return[{json:{response:r,text:r}}];`},id:'f1',name:'Format',type:'n8n-nodes-base.code',typeVersion:2,position:[600,0]});

const respond=()=>({parameters:{respondWith:'json',responseBody:'={{ JSON.stringify($json) }}',options:{responseCode:200}},id:'r1',name:'Respond',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.1,position:[800,0]});

const nodes=(cr={})=>[webhook(),extract(),agent(),gemini(cr.g),qdrant(cr.q),embed(cr.e),tool(),memory(),format(),respond()];

const conn=()=>({'ElevenLabs Webhook':{main:[[{node:'Extract Query',type:'main',index:0}]]},'Extract Query':{main:[[{node:'AI Agent',type:'main',index:0}]]},'AI Agent':{main:[[{node:'Format',type:'main',index:0}]]},'Gemini':{ai_languageModel:[[{node:'AI Agent',type:'ai_languageModel',index:0}]]},'Memory':{ai_memory:[[{node:'AI Agent',type:'ai_memory',index:0}]]},'KB Tool':{ai_tool:[[{node:'AI Agent',type:'ai_tool',index:0}]]},'Qdrant':{ai_vectorStore:[[{node:'KB Tool',type:'ai_vectorStore',index:0}]]},'Embeddings':{ai_embedding:[[{node:'Qdrant',type:'ai_embedding',index:0}]]},'Format':{main:[[{node:'Respond',type:'main',index:0}]]}});

const build=(o={})=>{if(o.config)Object.assign(C,o.config);return{name:C.name,nodes:nodes(o.creds||{}),connections:conn(),settings:{executionOrder:'v1'},staticData:null,tags:[],triggerCount:1,pinData:{}}};

const exp=(o={})=>JSON.stringify(build(o),null,2);

if(require.main===module)console.log(exp());

module.exports={C,build,exp,nodes,conn};

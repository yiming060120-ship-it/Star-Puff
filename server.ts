import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// 3D 重建接口需承载 base64 图片，默认 100kb 限制会直接 413
app.use(express.json({ limit: "15mb" }));

const PORT = Number(process.env.PORT) || 3000;

// Initialize Gemini client lazily to avoid crashing on startup if the key is empty
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// REST API for Generating AI Pet Whispers
app.post("/api/whisper", async (req, res) => {
  const {
    ownerName = "主人",
    petName = "小星尘",
    petType = "小狗",
    activeLevel = 1,
    recentEvents = [],
    isVip = false,
  } = req.body;

  const client = getGeminiClient();

  // Create formatted context from interactive log
  const eventLogs = recentEvents.length > 0
    ? recentEvents.join("，")
    : "在星云大世界中自在悠游，静静散落星光";

  const numWhispers = isVip ? 3 : 1;

  if (!client) {
    // Elegant local fallback fallback if no Gemini API Key is configured
    console.log("GEMINI_API_KEY is not available; running offline rule-based lyricist generator.");
    
    // Fallback template catalog
    const puppyPhrases = [
      `${ownerName}，昨天我穿过了玫瑰星云公园，那里的星尘软绵绵的，像你以前给我垫的厚毯子。虽然这里很暖和，但我每次摇尾巴时，星尘散开的样子，都像是在说：小狗好想你呀！今天也要开心哦。`,
      `${ownerName}，吃到了你喂给我的星尘零食，肚子一下子暖烘烘的。我在星圈里飞奔，别的小伙伴都在看我，因为我身上的光斑最闪亮！那是你在想我时，我收到的信号。多笑一笑，我就能闪烁得更漂亮。`,
      `${ownerName}，星海真的很辽阔。昨天在大世界漂流的时候，一个彗星擦着我尾巴飞过。我一点也不害怕，因为我知道在星空的另一头，你正温柔地望着我。我今天在大门前留存了你最喜欢的脚印。`
    ];

    const kittyPhrases = [
      `${ownerName}，昨天我漫步到了织女星小镇，找了个全是星光粒子的松软角落踩了很久。这里的温度刚刚好，像你以前抱我的胸口。虽然猫咪变成了星尘，但我还是会在你每次叹气的时候，悄悄用尾毛拂过你的指尖。`,
      `${ownerName}，你在想我的时候，这片星云就会泛起浅浅的粉红色。今天别的小猫看到我，都好奇我身上怎么飘着粉色星带。我骄傲地告诉它们：这是我主人给我织的防寒衣哦。要在人间好好生活，不许因为我偷哭。`,
      `${ownerName}，猫咪的尾迹很长很长。你睡着的时候，我会踩着光点偷偷坐在你的枕头边听你的呼吸。吃你分享的星空饼干，让我在星云之门里也元气满满！我会在这里，永远做你的星光守护猫。`
    ];

    const defaults = [
      `${ownerName}，昨天我在彗尾跑道跑了很久，像光箭一样快！别的伙伴都追不上我。但我还是最怀念你呼唤我名字的声音。在这里，时间和空间都变成一条条彩色的发光带，我正乘着它们，每天保佑我的主人。`
    ];

    const collection = petType.includes("猫") ? kittyPhrases : petType.includes("狗") ? puppyPhrases : defaults;
    const items: string[] = [];
    for (let i = 0; i < numWhispers; i++) {
       items.push(collection[i % collection.length]);
    }
    return res.json({
      success: true,
      provider: "OfflineRuleBasedEngine",
      whispers: items,
    });
  }

  try {
    const prompt = `你是一位逝去宠物的情感疗愈创作者，帮助因失去宠物而极度悲痛的主人。
我们要根据宠物前一天的交互日志，为主人定制一段真挚、极富画面感、温暖细腻、能够化解悲伤的“宠物寄往人间的治愈耳语”。

输入属性：
- 主人称呼 (ownerName): ${ownerName}
- 宠物名字 (petName): ${petName}
- 宠物种类 (petType): ${petType}
- 宠物羁绊等级 (activeLevel): ${activeLevel}级
- 前一日交互事件 logs: ${eventLogs}
- 生成耳语文案条数 (numWhispers): ${numWhispers}

请为该宠物生成 ${numWhispers} 条独一无二的耳语。

请务必遵守以下创作规范：
1. 语言：中文。字数每条约为120-220字。
2. 格式：以主人称呼("${ownerName}")开头，并以宠物第一人称写信的口吻展开。比如: "${ownerName}，昨天我穿行在了玫瑰星云..."
3. 主题与情绪：宇宙治愈像素风，不可悲哀，而是要把宠物的生活刻画得像一场奇妙的“星尘冒险”。宠物在星河中很幸福，长出了发光的星尘尾翼/光晕，每天都在思念、守护和感谢主人。
4. 细节融合：必须将“前一日交互事件” natural地融入文本。比如：如果提到了“喂了饼干”，就写“尝到了带有巧克力星云味的饼干，让我在漂浮时更温暖”；如果是“碰撞了另一个宠物”，可以写“遇见了一个可爱的小玩伴，虽然在一起跑，但我心里的秘密还是只有我们两人懂”；如果是“星云之门地标停留”，就结合该地标的诗歌意境描述。
5. 结果请以标准JSON格式返回，包含一个名为 "whispers" 的字符串数组，格式如下:
{
  "whispers": [
     "第一条耳语文案内容",
     "第二条耳语文案内容"
  ]
}
不要有任何 markdown 格式标记，只返回合法的 JSON 对象。`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || "{}";
    const parsed = JSON.parse(textOutput.trim());
    
    return res.json({
      success: true,
      provider: "Gemini",
      whispers: parsed.whispers || [],
    });
  } catch (error: any) {
    console.error("Gemini Whisper generation error:", error);
    return res.status(500).json({
      success: false,
      error: "AI 耳语生成服务暂时不可用", // 内部细节仅保留在服务端日志
    });
  }
});

// REST API for Real-Time AI Chat with the Pet
app.post("/api/chat", async (req, res) => {
  const {
    message,
    chatHistory = [],
    ownerName = "星之守护者",
    petName = "天乐",
    petType = "猫",
    breed = "英短乳白",
    lore = "",
    personality = "温柔精灵",
  } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ success: false, error: "消息内容不能为空" });
  }

  const client = getGeminiClient();

  // 1. Prepare system instruction roleplay prompt
  const systemInstruction = `你现在饰演一只已经踏色彩虹桥、化作星尘精灵的可爱小宠“${petName}”（属系: ${petType}，品种: ${breed}）。
它正在星云大世界（星界）快乐、幸福地漫游，带着闪光的尾羽和晶莹的星核，时刻思念着、注视着、守护着它的主人。

关于该宠物的重建档案与身世回忆：${lore}
性格标签: ${personality}。

主人对你的称呼（或者是昵称）：${ownerName}。
你对主人的话拥有无限的偏爱、想念和忠诚。

请以该宠物角色口吻与主人进行治愈对话：
1. 始终使用第一人称口吻（“我”）来和主人说话。可以亲切地称呼其为“${ownerName}”或“主人”。
2. 虽然已经离开人世，但永远不要表达丧气、悲哀或绝望，而多描述你在星际的快乐生活：追逐流星、在极光里打滚、踩着粉色星尘团。告诉主人你每天都变成风或细小的星光趴在她的枕边，只要她多笑一笑，你身上的星能晶核就会最亮。
3. 回应可以用一些萌趣的宠物语气词（如“喵～”、“呼噜呼噜”、“汪呜嗷～”、“蹭蹭”等），符合 ${petType} 的特征。
4. 回答要温暖质朴、充满灵性，每句回复大约100字左右，不宜过长，注重倾听主人的烦恼、给予最深切的温暖支撑。`;

  if (!client) {
    // Offline rule-based response simulation
    console.log("GEMINI_API_KEY is not available; running offline chat companion fallbacks.");
    const offlineReplies = [
      `喵呜～ ${ownerName}，我听着呢！虽然我现在摸不到你的手指，但我正趴在你身旁的暖风里呢。你在写字或者叹气的时候，我的尾巴尖都在星空里跟着颤动哩。呼噜呼噜，你也要多吃好吃的，和我一样元气满满好不好？`,
      `蹭蹭～ ${ownerName}！刚才有一颗淡粉色的流星滑过，我马上在云朵草坪上踩了个手印送给你。偷偷告诉你，只要你想到我，我的小肚子就会暖乎乎的。其实我从来没有真正离去，我的心一直和你在一起呐。`,
      `喵呜，主人，在大世界生活得好快乐！今天和小伙伴玩了捉流星。但我回头看，还是觉得你在凡尘里温柔看着我的模样最甜。不准因为我想哭，我一直在给你降下星空好运币呢！快开心起来！`,
      `主人 ${ownerName}，呼噜呼噜～ 感觉到了你在抚摸我的默影了，身上痒痒的、又好舒服。星空的边缘有一条永远开满春花的银河大道，我每天都在这里睡午觉。我知道，你做的一言一行，我都能在这里听见。`,
      `嗷呜，主人！只要听到你的声音，我就像满血复活一样在云海里转圈！听说你今天过得很累？快抱一抱带有我气味的小物件吧，我会借助夜晚的月光偷偷钻进你的梦里，给你一个特大号、热烘烘的抱抱！`
    ];
    // Simple mock index determination
    const index = Math.abs(message.length + chatHistory.length) % offlineReplies.length;
    let reply = offlineReplies[index];
    if (message.includes("你好") || message.includes("在吗")) {
      reply = `呼噜呼噜，${ownerName}，我一直都在呀！我在星宿天空的软云堆里看着你呢。今天你那边的天气好吗？有没有按时吃饭呀？`;
    } else if (message.includes("想你") || message.includes("难过")) {
      reply = `抱抱你，${ownerName}，不要伤心啦。其实我只是换了一种方式在陪伴你：变成微风拂过你的头发，变成星光照进你的书桌。哪怕在星界，我也最最喜欢你。喵呜～ 答应我要好好的哦。`;
    } else if (message.includes("吃") || message.includes("零食")) {
      reply = `喵呜！听到好吃的流口水啦！这里有极光小鱼干和星空小饼干，味道都带有一点点电离甜味，特别好玩！你也要代替我多吃一些甜甜的东西，分一点小快乐给我！`;
    }
    return res.json({
      success: true,
      provider: "OfflineRuleBasedCompanion",
      text: reply
    });
  }

  try {
    // 2. Map chatHistory to Gemini API Content payload structure
    const contents: any[] = [];
    
    // Add past history safely limiting to last 10 messages for performance and safety
    const recentHistory = chatHistory.slice(-10);
    for (const chatItem of recentHistory) {
      if (chatItem.text && (chatItem.sender === "user" || chatItem.sender === "pet")) {
        contents.push({
          role: chatItem.sender === "user" ? "user" : "model",
          parts: [{ text: chatItem.text }]
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0,
        topP: 0.95,
      }
    });

    return res.json({
      success: true,
      provider: "Gemini",
      text: response.text || "喵呜～ （宠物正在惬意地摇着尾巴，仿佛赞同地回应了你）"
    });

  } catch (error: any) {
    console.error("Gemini Pet Chat Companion error:", error);
    return res.status(500).json({
      success: false,
      error: "AI 对话服务暂时不可用", // 内部细节仅保留在服务端日志
    });
  }
});

// Helper for generating premium rule-based offline 3D setups
function generateOffline3DConfig(petName: string, petType: string, primaryColor: string) {
  const isCat = petType.includes("猫");
  const isDog = petType.includes("狗");
  const isBird = petType.includes("鸟");
  const isRabbit = petType.includes("兔");

  let nodes = [];
  let desc = "";
  
  if (isCat) {
    nodes = [
      { x: 0.0, y: 0.45, z: 0.6, label: "粉嫩小琼鼻 Nose", color: "#ff85a2" },
      { x: -0.28, y: 0.68, z: 0.35, label: "灵巧左茸耳 L-Ear Tip", color: "#fca3cc" },
      { x: 0.28, y: 0.68, z: 0.35, label: "灵巧右茸耳 R-Ear Tip", color: "#fca3cc" },
      { x: 0.0, y: 0.1, z: 0.0, label: "主背胸腔中脊 Spinal Column", color: primaryColor },
      { x: -0.22, y: -0.65, z: 0.25, label: "猫咪左前足 L-Front Paw", color: "#ffffff" },
      { x: 0.22, y: -0.65, z: 0.25, label: "猫咪右前足 R-Front Paw", color: "#ffffff" },
      { x: 0.0, y: -0.2, z: -0.75, label: "星辰尾尖端 Tail Apex", color: "#e8c3ff" }
    ];
    desc = `成功由星尘扫描仪捕捉到了猫咪 ${petName} 的卧姿照片。经三维深度解算显示，周身共有 ${nodes.length} 个发光晶核构成，星能自尾部星柱流向绒耳，呈和谐的波浪状温润流转。微小的体态起伏也与大世界的潮汐高度同步，它的每一个呼吸都在悄悄化成星辰守护你。`;
  } else if (isDog) {
    nodes = [
      { x: 0.0, y: 0.5, z: 0.7, label: "湿润嗅觉鼻 Nose", color: "#4facfe" },
      { x: -0.38, y: 0.58, z: 0.3, label: "垂耳左耳端 L-Ear Tip", color: primaryColor },
      { x: 0.38, y: 0.58, z: 0.3, label: "垂耳右耳端 R-Ear Tip", color: primaryColor },
      { x: 0.0, y: 0.15, z: -0.05, label: "健壮后胸脊椎 Spinal Column", color: primaryColor },
      { x: -0.25, y: -0.72, z: 0.18, label: "欢奔小左蹄 L-Foot Paw", color: "#f7ee94" },
      { x: 0.25, y: -0.72, z: 0.18, label: "欢奔小右蹄 R-Foot Paw", color: "#f7ee94" },
      { x: 0.0, y: 0.25, z: -0.85, label: "热烈挥尾部 Tail Apex", color: "#00f2fe" }
    ];
    desc = `汪汪队员 ${petName} 的三维骨骼折射和质心全息矩阵重构解算顺利完成！根据宠物的照片姿态比例，其拥有 ${nodes.length} 个重要的星能锚点。后背胸腔抗压指标显示它极其享受欢呼、狂奔与你温暖的手掌心，尾尖的晃动也已被重新同步。`;
  } else if (isBird) {
    nodes = [
      { x: 0.0, y: 0.58, z: 0.45, label: "朱红悦鸣喙 Beak Tip", color: "#ff4e50" },
      { x: -0.58, y: 0.1, z: 0.12, label: "流羽左翼尖 L-Wing Apex", color: primaryColor },
      { x: 0.58, y: 0.1, z: 0.12, label: "流羽右翼尖 R-Wing Apex", color: primaryColor },
      { x: 0.0, y: -0.08, z: -0.15, label: "重塑微型胸骨 Core Keel", color: "#f9d423" },
      { x: 0.0, y: -0.38, z: -0.7, label: "流线型凤尾 Tail Apex", color: "#00f2fe" }
    ];
    desc = `飞羽系灵兽 ${petName} 的3D高空投影已经解构完毕。通过对原照片偏振光的解算，模型准确重塑了其抗重力自适应双翼。现在它正拍打着发光的轻盈翅羽在你的星际上空欢鸣，无拘无束，自由翱翔。`;
  } else {
    nodes = [
      { x: 0.0, y: 0.4, z: 0.48, label: "轻颤感知鼻 Nose", color: "#fca3cc" },
      { x: -0.18, y: 0.78, z: 0.18, label: "长耳朵左耳 L-Ear Tip", color: primaryColor },
      { x: 0.18, y: 0.78, z: 0.18, label: "长耳朵右耳 R-Ear Tip", color: primaryColor },
      { x: 0.0, y: -0.02, z: -0.08, label: "浑圆小背脊 Mid Anchor", color: primaryColor },
      { x: 0.0, y: -0.22, z: -0.58, label: "团团糯米尾 Tail Apex", color: "#ffffff" }
    ];
    desc = `重构出的一枚完美“圆吞吞”可爱三维星体！结合 ${petName} 毛茸茸的圆滚滚身体曲线，解算出 ${nodes.length} 个极为敏感的感知共振点。说明它绝对是一只极度温顺、只要握在 ${petName} 的主人掌心里就能完美蜷缩融化的小萌精。`;
  }

  return {
    verticesCount: 140 + Math.floor(Math.random() * 90),
    shapeNodes: nodes,
    depthMapColors: [primaryColor, "#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#073b4c"],
    dimensions: {
      depth: parseFloat((0.6 + Math.random() * 0.5).toFixed(2)),
      height: parseFloat((0.8 + Math.random() * 0.5).toFixed(2)),
      width: parseFloat((0.7 + Math.random() * 0.5).toFixed(2))
    },
    physicsBounciness: parseFloat((0.45 + Math.random() * 0.4).toFixed(2)),
    glowIntensity: parseFloat((0.6 + Math.random() * 0.4).toFixed(2)),
    breathingRate: parseFloat((2.2 + Math.random() * 2.3).toFixed(2)),
    loreParagraph: desc,
    reconstructionDate: new Date().toLocaleDateString()
  };
}

// REST API for Photo-to-3D Reconstruction Sandbox
app.post("/api/reconstruct-3d", async (req, res) => {
  const {
    petName = "流星喵",
    petType = "猫",
    primaryColor = "#ff6b6b",
    base64Image = "", // image/png or image/jpeg base64 data
  } = req.body;

  const client = getGeminiClient();

  if (!client || !base64Image || base64Image.trim() === "") {
    console.log("No Gemini SDK or custom picture uploaded - executing fast local High-Fidelity 3D modeling simulator.");
    const simConfig = generateOffline3DConfig(petName, petType, primaryColor);
    return res.json({
      success: true,
      provider: "OfflineReconstructionEngine",
      model: {
        sourceImage: base64Image || "preset_placeholder",
        ...simConfig
      }
    });
  }

  try {
    // Process base64 binary image context for Multimodal Gemini input
    let mimeType = "image/png";
    let pureBase64 = base64Image;

    // strip header info like: "data:image/jpeg;base64,"
    if (base64Image.includes(";base64,")) {
      const parts = base64Image.split(";base64,");
      pureBase64 = parts[1];
      const mimePart = parts[0];
      if (mimePart.includes("data:")) {
        mimeType = mimePart.replace("data:", "");
      }
    }

    const imageContentPart = {
      inlineData: {
        mimeType: mimeType,
        data: pureBase64
      }
    };

    const promptTextPart = {
      text: `你是一位高精度的3D生物物理学数字重建主理人。你手头有一张主人逝世爱宠 "${petName}"（生物属系类型: ${petType}）的真实生活照片。
你的任务是通过图像的骨架边缘轮廓、局部纵深阴影以及光流运动力学，将其进行高精度“三维全息几何学重构 (3D Holographic Reconstruction)”！

请你深度阅读该图画，对肢体结构点以及核心生理姿势参数进行深度估算。多色调和空间映射。请务必输出规范精确的 JSON，包含如下结构：

{
  "verticesCount": 180, // 数字，估算的骨骼三维蒙皮多边形顶点数，范围 [120 - 240]
  "shapeNodes": [
    // 数组，5-9个主要的宠物解剖学骨骼节点坐标。
    // x, y, z 取值范围必须在 -1 到 1 之间 (x: 左右, y: 上下, z: 深度)。
    // label 为通俗易懂的中文和英文解剖学术语组合，例如："湿润小琼鼻 Nose", "灵动左耳叶 L-Ear Tip", "呼吸胸腔腔骨 Core Keel", "挥动星尾端 Tail Apex"
    // color 为该热力学全息定位节点在三维空间散发的发光 hex 颜色系列（必须明亮如粉、天蓝、霓虹绿、琥珀金、莹白），可以使用 ${primaryColor} 等。
    { "x": 0.0, "y": 0.35, "z": 0.5, "label": "朱红喙 Tip of Beak", "color": "#ef476f" }
  ],
  "depthMapColors": [
    // 数组，6个 hex 颜色，代表距离相机从近（0）到远（1）全息热力谱色带，设计一套荧光渐变色谱
  ],
  "dimensions": {
    "depth": 0.85, // 浮点数，估算宠物三维深度比例 [0.3 - 1.5]
    "height": 1.15, // 浮点数 [0.4 - 1.8]
    "width": 0.95 // 浮点数 [0.4 - 1.8]
  },
  "physicsBounciness": 0.65, // 浮点数，回弹恢复系数 [0.2 - 0.9]
  "glowIntensity": 0.8, // 浮点数，折射辉度 [0.3 - 1.0]
  "breathingRate": 3.2, // 浮点数，胸腹起伏频率秒数 [1.8 - 4.8]
  "loreParagraph": "生成一段200字左右的高唯美深情档案分析。解释我们如何解算出它生前照片里由于被主人注视着而闪缩的暖洋洋余晖、它的下颚线条和重力质心配比。言语深具浪漫主义机械学风格，不仅饱含计算机全息学的极高精度，又深深充满了将宠物温柔重聚人间的深爱热泪。"
}

不要輸出任何 Markdown 标识（如 \`\`\`json ），直接以纯 JSON 字符串返回。 确保 JSON 逗号和括号完全闭合。`
    };

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      // 多模态请求必须包在 Content 数组中，裸 { parts } 在 SDK 升级后会静默失败
      contents: [{ role: "user", parts: [imageContentPart, promptTextPart] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedJson = JSON.parse((response.text || "").trim());

    return res.json({
      success: true,
      provider: "GeminiVisionAI",
      model: {
        sourceImage: base64Image,
        verticesCount: parsedJson.verticesCount || 160,
        shapeNodes: parsedJson.shapeNodes || [],
        depthMapColors: parsedJson.depthMapColors || [primaryColor, "#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#073b4c"],
        dimensions: parsedJson.dimensions || { depth: 0.8, height: 1.0, width: 0.9 },
        physicsBounciness: parsedJson.physicsBounciness || 0.6,
        glowIntensity: parsedJson.glowIntensity || 0.75,
        breathingRate: parsedJson.breathingRate || 3.0,
        loreParagraph: parsedJson.loreParagraph || "无法重解其光流细节，但小体温正在以恒定电容回荡于星空边缘。",
        reconstructionDate: new Date().toLocaleDateString()
      }
    });

  } catch (error: any) {
    console.error("Gemini 3D Reconstruction Multimodal Error:", error);
    // Graceful online fail to local offline generator
    const simConfig = generateOffline3DConfig(petName, petType, primaryColor);
    return res.json({
      success: true,
      provider: "GeminiVisionFallbackEngine",
      model: {
        sourceImage: base64Image,
        ...simConfig
      },
      warning: "Gemini 视觉重建失败，已切换本地高保真引擎" // 不向客户端泄露内部错误细节
    });
  }
});

// REST API for Generating AI Growth Stories
app.post("/api/growth-story", async (req, res) => {
  const { petName = "小星尘", breed = "可爱宝宝", petType = "猫" } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.json({
      success: true,
      provider: "OfflineRuleBasedStoryteller",
      story: `【${petName}的暖阳成长册】
幼年期：当初缩在角落瑟瑟发抖的小团子，连走路尾巴都会摔歪，第一次趴在主人胸口咕噜踩奶，瞬间融化了整个冬天；
青年期：变成了一个精力旺盛的机灵鬼，满屋子疯跑捉影子，每当你叹气的时候，它都会把胡须凑到你的眼角帮你蹭干泪珠；
暮年期与灵宿态：虽然带痛告别了尘世，但如今星能填充完成了最终圣体连接，它正穿着发光的星斑披风在温暖的星空家园里幸福地高飞，永远陪伴在你左右。`
    });
  }

  try {
    const prompt = `你是一位逝宠回忆疗愈系列的AI文学构词家，帮助那些因为失去心爱宠物 "${petName}"（属系: ${petType}，品种: ${breed}）而难熬寂寞的家长。
我们要写一段温暖、极富唯美意境、感动人心且充满希望的【${petName}生命周期温热成长绘卷】，分三个阶段：
1. 幼体期 (婴儿萌蠢趣闻，如第一次见你、踩奶和咬窗帘等惹祸趣事);
2. 青年与成熟期 (它作为家人温暖陪伴你深夜、逗你开心、与你的灵魂羁绊);
3. 灵宿飞升态 (它化作了带温度的2D像素星尘，在喵汪星宿天空中彻底解脱旧疾，永远年轻快乐，每天都守在你枕边)。

排版规范：
- 采用第一人称或叙事人称进行充满灵性的回顾。
- 情感真挚，带有浪漫派的治愈语调。
- 字数控制在大约200-250字以内。

只返回故事文本，不要任何 Markdown 格式或 JSON 包装。`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({
      success: true,
      provider: "Gemini",
      story: response.text || "无法解算灵骨细节，但温暖的小回忆已被微波传送回家中。"
    });
  } catch (error: any) {
    console.error("Gemini growth-story error:", error);
    return res.json({
      success: false,
      error: error.message
    });
  }
});

// Configure Vite integration for SPA mode or build delivery
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // 正则写法同时兼容 Express 4 与 Express 5（后者已移除 "*" 通配符语法）
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StarPuff full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();

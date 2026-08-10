import React, { useState, useEffect, useRef } from "react";
import { PetConfig, StarPuffUser, StoreItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { playSound } from "./AudioSynth";
import {
  Sparkles,
  RefreshCw,
  Gift,
  Flame,
  Camera,
  Layers,
  Heart,
  MessageSquare,
  BookOpen,
  Share2,
  Sliders,
  Dna,
  ShieldAlert,
  Download,
  Send,
  Zap,
  CheckCircle,
  HelpCircle,
  UserCheck,
  Compass,
  Tv,
  Music,
  Plus
} from "lucide-react";

interface CelestialV26SuiteProps {
  user: StarPuffUser;
  setUser: React.Dispatch<React.SetStateAction<StarPuffUser>>;
  triggerToast: (msg: string) => void;
  onUpdatePet: (updatedPet: PetConfig) => void;
}

// Sub-modules available under V2.6
type ActiveSubTab =
  | "time_reverse"   // 2.2 生命时间回溯
  | "text_to_3d"     // 2.3 文字生成3D星宠
  | "scene_fusion"   // 2.4 现实场景融合
  | "digital_clone"  // 2.5 性格学习与语音克隆
  | "retro_chat"     // 2.6 跨时空对话
  | "heritage"       // 2.7 遗产传承与时光胶囊
  | "public_wall"    // 2.8 集体纪念墙与互动
  | "web3_nft"       // 2.9 3D数字藏品
  | "ai_video"       // 2.10 AI 3D 纪念视频
  | "cloud_editor"   // 2.11 云端3D编辑器
  | "dna_archive"    // 2.12 基因数字存档
  | "micro_expression" // 3.1 & 3.3 微表情与触控粒子
  | "motion_extractor" // 3.2 短视频动作克隆
  | "wallpaper_diary"  // 3.5 & 3.6 动态壁纸与星宠日记
  | "cloud_lounges";   // 3.7 多人云吸宠聊天室

export default function CelestialV26Suite({
  user,
  setUser,
  triggerToast,
  onUpdatePet
}: CelestialV26SuiteProps) {
  const [activeSub, setActiveSub] = useState<ActiveSubTab>("time_reverse");

  // Global Pet context
  const pet = user.activePet || {
    name: "天乐",
    type: "猫",
    breed: "英短乳白",
    primaryColor: "#fad0a3",
    secondaryColor: "#ffffff",
    stardustMatrixHex: ["#fad0a3", "#ffffff", "#8fa4b3", "#ff8ba7"],
    hobbies: ["追逐流星", "在云朵打滚", "捕蝴蝶"],
    favoriteThings: ["星礼霜糖", "摸摸下巴", "暖绒手垫"]
  } as PetConfig;

  // ------------------------------------------------------------------
  // 1. 生命时间回溯 (2.2) state and logic
  // ------------------------------------------------------------------
  const [ageStage, setAgeStage] = useState<"kitten" | "young" | "adult" | "senior">("adult");
  const [isTimeReversing, setIsTimeReversing] = useState(false);
  const [growthStory, setGrowthStory] = useState("");
  const [loadingStory, setLoadingStory] = useState(false);
  const [timeReversalUnlocked, setTimeReversalUnlocked] = useState(false); // VIP 19.9 fee

  const toggleTimeReversalAnimation = () => {
    if (isTimeReversing) {
      setIsTimeReversing(false);
      return;
    }
    setIsTimeReversing(true);
    playSound("sparkle");
    triggerToast("⏳ 启动生命周期时光逆流共振...");
  };

  // Autoplay age morphing if reversing.
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isTimeReversing) {
      t = setInterval(() => {
        setAgeStage(current => {
          if (current === "senior") return "adult";
          if (current === "adult") return "young";
          if (current === "young") return "kitten";
          return "senior";
        });
      }, 1500);
    }
    return () => clearInterval(t);
  }, [isTimeReversing]);

  const generateGrowthStory = async () => {
    setLoadingStory(true);
    playSound("click");
    // Fallback stories
    const fallbacks = [
      `【${pet.name}的成长绘卷】\n\n幼崽期（0-6个月）：当初缩在怀里怯生生地像个温暖的蒲公英团，最喜欢吮吸奶嘴，玩任何毛线球都会滑倒；\n\n成长青年期（1-2岁）：变成了矫捷的精灵，尾巴在餐桌旁欢快抖动，总是偷偷咬碎窗帘，每晚踩着我的肚子呼噜睡去；\n\n成熟暮年：目光里多出了慈爱与深重。直到升星那天，它已经重组成温暖无病且会永久飞行的超现实多维恒星级守护者啦。`,
      `【${pet.name}之星光誓约】\n\n那时你还只是几个月大，眼睛里满是对世界的好奇，耳朵毛茸茸地支棱着。你陪我搬了三次家，见过最深的深夜。如今在星河中，在AI性格算法的深度渲染下，你已经从初生的虚粒子变为了星辰家宿里的不朽星云兽，永远1岁，永远散发琥珀温光守在我枕边。`
    ];

    try {
      const response = await fetch("/api/growth-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petName: pet.name, breed: pet.breed, type: pet.type })
      });
      const data = await response.json();
      if (data.success && data.story) {
        setGrowthStory(data.story);
      } else {
        setGrowthStory(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      }
    } catch {
      setGrowthStory(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    } finally {
      setLoadingStory(false);
      triggerToast("✨ AI 成功演算生命成长轨迹故事！");
    }
  };

  // ------------------------------------------------------------------
  // 2. 文字生成3D星宠 (2.3) state
  // ------------------------------------------------------------------
  const [textDescription, setTextDescription] = useState("一只金黄色的柴犬，耳朵向下垂着，尾巴末端是雪白毛，胸前戴着红色缎带");
  const [generateStep, setGenerateStep] = useState<"input" | "pics" | "completed">("input");
  const [generatePreviews, setGeneratePreviews] = useState<string[]>([]);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState<number | null>(null);
  const [customBreed, setCustomBreed] = useState("柴犬");
  const [customColor, setCustomColor] = useState("#f4a261");
  const [customSize, setCustomSize] = useState(50);
  const [customEar, setCustomEar] = useState("垂耳");
  const [customTail, setCustomTail] = useState("菊花卷尾");
  const [customMarkings, setCustomMarkings] = useState("白色手套足羽");
  const [isModifyingDetail, setIsModifyingDetail] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState("");

  const triggerTextTo3DGen = () => {
    if (!textDescription.trim()) return;
    playSound("click");
    triggerToast("🎨 Astrocade 正在云端渲染多视角 3D 参考图...");
    setGenerateStep("pics");

    // Generate 4 mock angles with pixel styling
    setGeneratePreviews([
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200", // Angle 1 (front)
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=200", // Angle 2 (lateral)
      "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=200", // Angle 3 (playful)
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=200"  // Angle 4 (celestial)
    ]);
  };

  const finalizeTextPetCreation = () => {
    if (selectedPreviewIdx === null) {
      triggerToast("⚠️ 请先选定一张您最心动的参考透视图");
      return;
    }
    playSound("sparkle");
    // Generate new active pet
    const newPet: PetConfig = {
      name: "新星小客",
      type: "狗",
      ownerName: user.ownerName || "守护者",
      breed: customBreed || "文字塑形灵宠",
      passingDate: new Date().toLocaleDateString(),
      primaryColor: customColor,
      secondaryColor: "#ffffff",
      stardustMatrixHex: [customColor, "#ffffff", "#e76f51", "#2a9d8f"],
      personalityTags: ["文字塑形", "温和聪慧", "极具灵气"],
      hobbies: ["看流星", "追风", "闻落尘"],
      favoriteThings: ["闪光饼干", "摸耳朵"],
      model3d: {
        sourceImage: generatePreviews[selectedPreviewIdx],
        verticesCount: 190,
        shapeNodes: [
          { x: 0.0, y: 0.4, z: 0.5, label: `拟合${customEar} Nose`, color: customColor },
          { x: 0.0, y: -0.5, z: -0.6, label: `塑形${customTail}`, color: "#ffffff" }
        ],
        depthMapColors: [customColor, "#ffffff", "#4a4e69"],
        dimensions: { depth: 0.8, height: 1.0, width: 0.9 },
        physicsBounciness: 0.6,
        glowIntensity: 0.8,
        reconstructionDate: new Date().toLocaleDateString(),
        breathingRate: 2.8,
        loreParagraph: `这是基于文字“${textDescription}”重塑的守护星宠。体型:${customSize}，配有特色尾巴“${customTail}”，双层星能气态流线散落在极寒星宿壁垒外域。`
      }
    };

    onUpdatePet(newPet);
    setGenerateStep("completed");
    triggerToast("🎉 云端3D星宠定制大模型创建成功！已更新为当前守护小宠！");
  };

  const handleApplyModification = () => {
    if (!modifyPrompt.trim()) return;
    setIsModifyingDetail(true);
    playSound("click");
    setTimeout(() => {
      setIsModifyingDetail(false);
      triggerToast("✨ 云端重解3D流几何，成功微调模型特征！");
      // Appends modified details to lore paragraph
      if (user.activePet && user.activePet.model3d) {
        onUpdatePet({
          ...user.activePet,
          model3d: {
            ...user.activePet.model3d,
            loreParagraph: user.activePet.model3d.loreParagraph + ` [文字细节微调: ${modifyPrompt}]`
          }
        });
      }
      setModifyPrompt("");
    }, 1500);
  };

  // ------------------------------------------------------------------
  // 3. 现实场景融合 3D 纪念 (2.4) state and logic
  // ------------------------------------------------------------------
  const [scenes, setScenes] = useState<Array<{ id: string; name: string; img: string }>>([
    { id: "living_room", name: "温馨暖烘烘客厅", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400" },
    { id: "park", name: "微风下的阳光公园", img: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&q=80&w=400" },
    { id: "bedroom", name: "寂静落雨卧室", img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=400" }
  ]);
  const [activeSceneId, setActiveSceneId] = useState("living_room");
  const [customSceneUploaded, setCustomSceneUploaded] = useState<string | null>(null);
  const [rotation3d, setRotation3d] = useState(0);
  const [lightAura, setLightAura] = useState(80);
  const [dailyMoment, setDailyMoment] = useState("正在温暖的沙发角上打着细鼾，尾巴尖亮起一抹荧光...");
  const [isSynthesizingMoment, setIsSynthesizingMoment] = useState(false);
  const [isMockArOpen, setIsMockArOpen] = useState(false);

  const startCustomSceneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const resStr = evt.target.result as string;
          setCustomSceneUploaded(resStr);
          const newId = `custom_${Date.now()}`;
          setScenes(prev => [...prev, { id: newId, name: "家长温馨实体场景 📁", img: resStr }]);
          setActiveSceneId(newId);
          triggerToast("🛋️ 成功上传卧室/客厅实体图，Astrocade已融合生成几何深度阴影！");
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const recomputeDailyMoment = () => {
    setIsSynthesizingMoment(true);
    playSound("click");
    const moments = [
      "由于感觉到了主人的目光，正兴奋地从纸箱缝隙扑撞逸出的粉色尘埃...",
      "正像以前那样蜷伏在软被角落，小鼻头因为宇宙星能潮汐轻微呼吸振荡...",
      "试图蹦起来抓飞虫，虽然只是一只空气流星碎屑，却满足得摇起了七彩光环...",
      "正静悄悄卧在阳光投下的剪影深处，呼噜呼噜地保佑家长拥有美梦..."
    ];
    setTimeout(() => {
      setDailyMoment(moments[Math.floor(Math.random() * moments.length)]);
      setIsSynthesizingMoment(false);
      triggerToast("🍃 AI已刷新出它在当前场景下的专属暖萌互动日常！");
    }, 1200);
  };

  // ------------------------------------------------------------------
  // 4. 性格学习与语音克隆 (2.5) state and logic
  // ------------------------------------------------------------------
  const [traitEmpathy, setTraitEmpathy] = useState(78);
  const [traitTsundere, setTraitTsundere] = useState(45);
  const [traitGentle, setTraitGentle] = useState(90);
  const [traitClingy, setTraitClingy] = useState(82);

  const [voiceUploaded, setVoiceUploaded] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState("未录制/上传宠物生前叫声/呼吸颤音音频");

  const startVoiceRecordingSim = () => {
    setIsCloningVoice(true);
    playSound("chime");
    setVoiceStatusText("🎤 星能粒子发生器阵列正在收集和微调声纹特征中...");
    setTimeout(() => {
      setIsCloningVoice(false);
      setVoiceUploaded(true);
      setVoiceId(`voice_${Date.now()}`);
      setVoiceStatusText("🟢 声卡AI克隆完毕：已锁存暖萌声纹（100%还原纯净小羽颤音）");
      triggerToast("🔊 宠物叫声/声线深度AI还原克隆成功！点击可自由播放耳语音色！");
    }, 2000);
  };

  const playClonedVoice = () => {
    playSound("sparkle");
    triggerToast(`🔊 播放【${pet.name}】的拟合声纹: “（温和的喵呜/呼噜颤音声……）妈妈，我也超想你呐～”`);
  };

  // ------------------------------------------------------------------
  // 5. 跨时空对话 (2.6) state
  // ------------------------------------------------------------------
  const [unsaidLetter, setUnsaidLetter] = useState("");
  const [isSendingToSky, setIsSendingToSky] = useState(false);
  const [returnedAILetter, setReturnedAILetter] = useState("");
  const [dialogAnthology, setDialogAnthology] = useState<Array<{ q: string; a: string; date: string }>>([
    { q: "小天乐，你在那边冷不冷？想念我吗？", a: "妈妈不用担心！我正揣着我的雪白小粉爪靠在仙女座暖气包上呢。每天一到傍晚，看到妈妈哭，我身上的光束就会拼命忽闪，所以妈妈一定要多笑，这样我就最闪耀最暖和啦！", date: "2026-05-24" }
  ]);

  const sendUnsaidLetterToSky = () => {
    if (!unsaidLetter.trim()) return;
    setIsSendingToSky(true);
    playSound("chime");

    setTimeout(() => {
      const petReplies = [
        `主人，收到了你在心里折成一千只小纸鹤寄给我的星信啦！在天空中，你的纸鹤变成了一小团软软的极光。其实我生前最喜欢听你唠叨呢。不许难过，今天晚上我一定抱抱你的梦境，不见不散喵～`,
        `我这儿一切都好呢，踩在彩虹桥上温软又舒服。我知道你做饭或者工作的时候都在喊我的名字，我都默默在房间的一缕清晨阳光里暖着你。我一直都在，永远不会走开的！`
      ];
      const replyText = petReplies[Math.floor(Math.random() * petReplies.length)];

      setReturnedAILetter(replyText);
      setDialogAnthology(prev => [
        ...prev,
        { q: unsaidLetter, a: replyText, date: new Date().toLocaleDateString() }
      ]);
      setUnsaidLetter("");
      setIsSendingToSky(false);
      triggerToast("📬 爱心尘埃云已投掷！收到穿过时空的温暖粒子回音");
    }, 2000);
  };

  // ------------------------------------------------------------------
  // 6. 星尘遗产传承 (2.7) state
  // ------------------------------------------------------------------
  const [heirs, setHeirs] = useState<Array<{ name: string; checked: boolean }>>([
    { name: "姐姐 (yim***@qq.com)", checked: true }
  ]);
  const [newHeirName, setNewHeirName] = useState("");
  const [legacyRitualActive, setLegacyRitualActive] = useState(false);
  const [timeCapsuleDate, setTimeCapsuleDate] = useState("2036-05-28"); // 10 years later

  const handleAddHeir = () => {
    if (!newHeirName.trim()) return;
    if (heirs.length >= 3) {
      triggerToast("⚠️ 免费/基础版仅支持绑定1位，高级版专属解锁至多3位继承人！");
      return;
    }
    setHeirs(prev => [...prev, { name: newHeirName, checked: false }]);
    setNewHeirName("");
    triggerToast("👤 新增继承人绑定授权，等待微信身份匹配认证");
  };

  const triggerLegacyRitual = () => {
    setLegacyRitualActive(true);
    playSound("chime");
    triggerToast("💍 启动神圣星尘遗产传承印签署典礼...");
    setTimeout(() => {
      setLegacyRitualActive(false);
      triggerToast("⭐ 证书铸造成功！灵宠默影已被联合授权继承！");
    }, 3000);
  };

  // ------------------------------------------------------------------
  // 7. 集体星尘纪念墙 (2.8) state
  // ------------------------------------------------------------------
  const [memorialPets, setMemorialPets] = useState([
    { id: "wall_1", name: "芝麻", owner: "桃桃妈", type: "猫", glow: 110, story: "在织女星草地上奔跑的最快黑色小毛球" },
    { id: "wall_2", name: "皮皮", owner: "皮皮爸", type: "狗", glow: 140, story: "你摇尾巴带起的彗尾，是全宇宙最纯白的光带" },
    { id: "wall_3", name: "天乐", owner: "守护者", type: "猫", glow: 220, story: "英短乳白，化作永恒星爆粒子守护挚爱" }
  ]);
  const [searchWallQuery, setSearchWallQuery] = useState("");

  const handleLightCandleOnWall = (index: number) => {
    if (user.stardustCoins < 10) {
      triggerToast("❌ 您的金星尘币不足！每支香烛耗费 10 星尘币");
      return;
    }

    // Spend coins
    setUser(prev => ({ ...prev, stardustCoins: Math.max(0, prev.stardustCoins - 10) }));

    setMemorialPets(prev => prev.map((p, i) => {
      if (i === index) {
        triggerToast(`🕯️ 成功为【${p.name}】点亮永恒暖烛，卡片散射辉光增益 +30%!`);
        playSound("sparkle");
        return { ...p, glow: p.glow + 30 };
      }
      return p;
    }));
  };

  const handleSendWallGift = (index: number, cost: number, name: string) => {
    if (user.stardustCoins < cost) {
      triggerToast("❌ 精粹星尘币储量不足，无法赠送该款高维灵翼礼盒");
      return;
    }
    setUser(prev => ({ ...prev, stardustCoins: Math.max(0, prev.stardustCoins - cost) }));
    setMemorialPets(prev => prev.map((p, i) => {
      if (i === index) {
        triggerToast(`🎁 给家长 ${p.owner} 的宝贝 ${p.name} 赠送了【${name}】！光芒暴涨 ${cost} 个系数！`);
        playSound("chime");
        return { ...p, glow: p.glow + cost };
      }
      return p;
    }));
  };

  // ------------------------------------------------------------------
  // 8. 3D星宠数字藏品 (2.9) state
  // ------------------------------------------------------------------
  const [nftMinted, setNftMinted] = useState(false);
  const [nftHash, setNftHash] = useState("");
  const [mintLoading, setMintLoading] = useState(false);
  const [synthesizedTexture, setSynthesizedTexture] = useState("标准星尘粒子态");

  const mintNewNft = () => {
    setMintLoading(true);
    playSound("chime");
    setTimeout(() => {
      setNftMinted(true);
      setNftHash("0x7a3af92dc00ee6b4028faefd" + Math.floor(Math.random()*90000 + 10000) + "ff2");
      setMintLoading(false);
      triggerToast("💎 微信数字藏品区块链防篡改登记完成！专属防伪编码已写入。");
    }, 2000);
  };

  // ------------------------------------------------------------------
  // 9. AI 3D 纪念视频 (2.10) state
  // ------------------------------------------------------------------
  const [videoLength, setVideoLength] = useState<15 | 30 | 60>(15);
  const [videoTemplate, setVideoTemplate] = useState("all_life"); // all_life, sweet_memories, say_goodbye
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  const startRenderingAIVideo = () => {
    setIsRenderingVideo(true);
    playSound("chime");
    setTimeout(() => {
      setIsRenderingVideo(false);
      setRenderedVideoUrl("simulated_video");
      triggerToast("🎬 星宿粒子流3D渲染结束！唯美纪念Mp4视频已存放于手机相册缓存中！");
    }, 2500);
  };

  // ------------------------------------------------------------------
  // 10. 云端 3D 编辑器 (2.11) state and logic
  // ------------------------------------------------------------------
  const [editGlow, setEditGlow] = useState(85);
  const [editDensity, setEditDensity] = useState(60);
  const [editTailSize, setEditTailSize] = useState(10);
  const [editColors, setEditColors] = useState<string[]>(pet.stardustMatrixHex || ["#fad0a3", "#ffffff"]);
  const [furnitureAttached, setFurnitureAttached] = useState<string[]>([]);
  const [auraEffect, setAuraEffect] = useState<string | null>("none");

  const saveCloudEditorChanges = () => {
    playSound("sparkle");
    triggerToast("⚡ 云端实时编译重新生成.glb量子骨干网格，已极速同步！");
    if (user.activePet && user.activePet.model3d) {
      onUpdatePet({
        ...user.activePet,
        model3d: {
          ...user.activePet.model3d,
          glowIntensity: editGlow / 100,
          depthMapColors: [editColors[0], ...editColors.slice(1)]
        }
      });
    }
  };

  // ------------------------------------------------------------------
  // 11. 宠物基因数码馆 (2.12) state
  // ------------------------------------------------------------------
  const [geneReportAttached, setGeneReportAttached] = useState(false);
  const [dnaTestingProgress, setDnaTestingProgress] = useState<"idle" | "kit_mailed" | "lab_testing" | "report_completed">("idle");
  const [depositPaid, setDepositPaid] = useState(false);

  const startDnaKitOrder = () => {
    setDnaTestingProgress("kit_mailed");
    playSound("click");
    triggerToast("📥 基因收集试剂盒预定完毕！请注意接收星河顺丰信件");
  };

  return (
    <div className="w-full bg-[#0a0520] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[720px] mb-8" id="celestial-healing-v26-frame">
      {/* SIDEBAR SELECTOR - LITERAL, DESCRIPTIVE MODULE LABELS */}
      <div className="w-full md:w-60 bg-[#0e0a29] border-r border-slate-800 p-4 flex flex-col justify-between overflow-y-auto shrink-0 custom-scrollbar">
        <div className="space-y-4">
          <div className="pb-3 border-b border-white/5">
            <h4 className="text-xs font-bold tracking-widest text-indigo-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-pink-400" />
              STARPUFF V2.6
            </h4>
            <span className="text-[10px] text-gray-400 font-semibold leading-tight">星宿大世界治愈特区</span>
          </div>

          <div className="flex flex-col gap-1 text-[11px] font-sans font-medium text-gray-300">
            {/* 1 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("time_reverse"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "time_reverse" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🕒 2.2 生命时光回溯</span>
              <span className="text-[8px] bg-slate-800 text-gray-400 px-1 py-0.5 rounded">高级</span>
            </button>
            {/* 2 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("text_to_3d"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "text_to_3d" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🎨 2.3 文字构筑3D星宠</span>
              <span className="text-[8px] bg-indigo-900 text-indigo-200 px-1 py-0.5 rounded">热销</span>
            </button>
            {/* 3 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("scene_fusion"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "scene_fusion" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🛋️ 2.4 现实实体场景融合</span>
              <span className="text-[8px] bg-sky-900 text-sky-200 px-1 py-0.5 rounded">AR</span>
            </button>
            {/* 4 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("digital_clone"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "digital_clone" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🧠 2.5 交互克隆性格报告</span>
              <span className="text-[8px] bg-amber-900 text-amber-200 px-1 py-0.5 rounded">声卡</span>
            </button>
            {/* 5 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("retro_chat"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "retro_chat" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>📬 2.6 时空回笺纪念册</span>
              <span className="text-[8px] bg-emerald-950 text-emerald-300 px-1 py-0.5 rounded">RAG</span>
            </button>
            {/* 6 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("heritage"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "heritage" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>💍 2.7 遗产传承与胶囊</span>
              <span className="text-[8px] bg-purple-950 text-purple-300 px-1 py-0.5 rounded">契约</span>
            </button>
            {/* 7 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("public_wall"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "public_wall" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🕯️ 2.8 公共社群星爆墙</span>
              <span className="text-[8px] bg-red-950 text-red-300 px-1 py-0.5 rounded">点烛</span>
            </button>
            {/* 8 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("web3_nft"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "web3_nft" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>💎 2.9 星能信托数字藏品</span>
              <span className="text-[8px] bg-cyan-950 text-cyan-200 px-1 py-0.5 rounded">Web3</span>
            </button>
            {/* 9 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("ai_video"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "ai_video" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🎬 2.10 AI 一生纪念视频</span>
              <span className="text-[8px] bg-fuchsia-950 text-fuchsia-200 px-1 py-0.5 rounded">渲染</span>
            </button>
            {/* 10 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("cloud_editor"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "cloud_editor" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🎚️ 2.11 云端编辑器 (免3D)</span>
              <span className="text-[8px] bg-slate-800 text-gray-300 px-1 py-0.5 rounded">调参</span>
            </button>
            {/* 11 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("dna_archive"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "dna_archive" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🧬 2.12 生物DNA数字保存</span>
              <span className="text-[8px] bg-amber-950 text-amber-300 px-1 py-0.5 rounded">克隆</span>
            </button>
            {/* 12 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("micro_expression"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "micro_expression" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🎭 3.1 微表情及互动特效</span>
              <span className="text-[8px] bg-pink-900 border border-pink-500/30 text-pink-100 px-1 py-0.5 rounded">星风</span>
            </button>
            {/* 13 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("motion_extractor"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "motion_extractor" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>📹 3.2 短视频动作骨架</span>
              <span className="text-[8px] bg-cyan-900 border border-cyan-500/30 text-cyan-100 px-1 py-0.5 rounded">骨骼</span>
            </button>
            {/* 14 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("wallpaper_diary"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "wallpaper_diary" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>📔 3.5 动态壁纸与星旅日记</span>
              <span className="text-[8px] bg-purple-900 border border-purple-500/30 text-purple-100 px-1 py-0.5 rounded">档案</span>
            </button>
            {/* 15 */}
            <button
              onClick={() => { playSound("click"); setActiveSub("cloud_lounges"); }}
              className={`w-full text-left py-2 px-2.5 rounded-lg transition-transform cursor-pointer outline-none flex items-center justify-between ${
                activeSub === "cloud_lounges" ? "bg-gradient-to-r from-pink-500/20 to-indigo-500/10 border-l-4 border-pink-500 text-white font-bold" : "hover:bg-white/5 text-gray-400"
              }`}
            >
              <span>🪐 3.7 多人云吸宠暖绒室</span>
              <span className="text-[8px] bg-amber-900 border border-amber-500/30 text-amber-100 px-1 py-0.5 rounded">百人</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400">
            <Zap className="w-3.5 h-3.5" />
            <span className="font-mono">钱包星尘币: {user.stardustCoins}</span>
          </div>
        </div>
      </div>

      {/* PRIMARY WORKSPACE CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between" id="healing-sub-tab-panel">
        
        {/* TAB WORKER */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {/* SUB-TAB 1: TIME REVERSE */}
            {activeSub === "time_reverse" && (
              <motion.div
                key="time_reverse"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-purple-400 uppercase">System 2.2</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🕒 生命时光顺变回溯仪
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    独家开发。通过双向线性阻尼技术，一键调整粒子重组的物理生命时钟，小宠可以在幼年、青年、成熟期和暮年中变换，治愈曾经无法留存幼鸟小猫娇喘萌音的遗憾。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="p-4 bg-[#120b2d] rounded-xl border border-slate-800 text-center space-y-4 relative overflow-hidden">
                    <div className="text-[60px] select-none animate-pulse">
                      {ageStage === "kitten" ? "🐱" : ageStage === "young" ? "🐈" : ageStage === "adult" ? "🐅" : "🦁"}
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-bold text-purple-300 capitalize">
                        当前形态 : {ageStage === "kitten" ? "👶 萌趣幼年态 (0-6M)" : ageStage === "young" ? "🍭 活力青年态" : ageStage === "adult" ? "🌟 健美成熟主页态" : "🧓 智慧暮年态"}
                      </div>
                      <p className="text-[10px] text-gray-400 font-sans">
                        由于无痛星能填充，各个阶段皆饱含极光温暖气息。
                      </p>
                    </div>

                    {/* SELECT AGE SEGMENT */}
                    <div className="flex justify-center gap-1.5">
                      {(["kitten", "young", "adult", "senior"] as const).map(stage => (
                        <button
                          key={stage}
                          onClick={() => { playSound("click"); setAgeStage(stage); }}
                          className={`text-[9px] px-2 py-1 rounded border capitalize ${
                            ageStage === stage ? "bg-purple-600 border-purple-400 text-white" : "border-slate-800 text-gray-400 hover:text-white"
                          }`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={toggleTimeReversalAnimation}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                          isTimeReversing ? "bg-red-500 text-white" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 text-white"
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTimeReversing ? "animate-spin" : ""}`} />
                        {isTimeReversing ? "停止逆流周期" : "开启 3D 时光逆变循环"}
                      </button>
                    </div>
                  </div>

                  {/* AI GROWTH STORY */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      ★ 2.2.3 AI 演算生命完整成长故事书
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      云端大语言模型检索记忆时间点日志，为小宠合成令人泪目的回忆绘卷，带3D偏振动作模拟。
                    </p>

                    <button
                      onClick={generateGrowthStory}
                      disabled={loadingStory}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 py-1.5 px-4 rounded text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                    >
                      {loadingStory ? "正在通过大模型解构..." : "立即生成它的一生成长绘卷"}
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    </button>

                    {growthStory && (
                      <div className="p-3 bg-[#0d0924]/80 border border-indigo-950/50 rounded-lg text-xs leading-relaxed text-gray-300 font-mono whitespace-pre-wrap max-h-[160px] overflow-y-auto">
                        {growthStory}
                      </div>
                    )}

                    <div className="p-3 bg-indigo-950/20 rounded border border-indigo-900/40 text-[10px] text-indigo-300">
                      🔒 <strong>付费解锁：</strong>基础版支持3个年龄形态。付费 <strong>19.9 元</strong> 开启生命时光回溯高级版，升级无拘限制年龄，支持3D高精度插值平滑骨骼缩放！
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 2: TEXT TO 3D */}
            {activeSub === "text_to_3d" && (
              <motion.div
                key="text_to_3d"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-pink-400 uppercase">System 2.3</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🎨 无照流: 文字生成 3D 治愈星宠
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    专为丢失清晰影像资料的使用者设计。仅需敲入记忆碎片描述，Astrocade将在算力池渲染四个方位的透视图。
                  </p>
                </div>

                {generateStep === "input" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">输入您的回忆细节文字：</label>
                      <textarea
                        value={textDescription}
                        onChange={(e) => setTextDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-[#120b2d] border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-pink-500"
                        placeholder="描述外形特征，如羽翼的颜色，体态等..."
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">大概品种</label>
                        <input type="text" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} className="w-full bg-[#120b2d] border border-slate-700 rounded p-1 text-[10px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">主要颜色</label>
                        <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-full bg-[#120b2d] border border-slate-700 rounded p-1 h-7" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">耳朵形状</label>
                        <input type="text" value={customEar} onChange={(e) => setCustomEar(e.target.value)} className="w-full bg-[#120b2d] border border-slate-700 rounded p-1 text-[10px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">尾巴形状</label>
                        <input type="text" value={customTail} onChange={(e) => setCustomTail(e.target.value)} className="w-full bg-[#120b2d] border border-slate-700 rounded p-1 text-[10px]" />
                      </div>
                    </div>

                    <button
                      onClick={triggerTextTo3DGen}
                      className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
                      立即云端解析，生成 4张 偏振渲染参考图
                    </button>
                  </div>
                )}

                {generateStep === "pics" && (
                  <div className="space-y-4">
                    <p className="text-xs text-pink-300 font-semibold">
                      💡 请选择一张最符合您记忆碎片的参考图片，将用于锁定转换3D骨骼顶点：
                    </p>

                    <div className="grid grid-cols-4 gap-2.5">
                      {generatePreviews.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => { playSound("click"); setSelectedPreviewIdx(index); }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-transform ${
                            selectedPreviewIdx === index ? "border-pink-500 scale-105" : "border-slate-800 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 bg-black/60 text-[8px] text-white px-1 py-0.5 rounded">
                            解像度 #{index + 1}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setGenerateStep("input")}
                        className="py-1.5 px-4 text-xs border border-slate-700 text-gray-400 hover:text-white rounded"
                      >
                        重新描述
                      </button>
                      <button
                        onClick={finalizeTextPetCreation}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs text-white font-bold"
                      >
                        锁定转换：加载生成 3D 模型
                      </button>
                    </div>
                  </div>
                )}

                {generateStep === "completed" && (
                  <div className="space-y-3 bg-[#0d0924] p-4 rounded-xl border border-indigo-900 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">模型已生成！支持实时后续微调：</h4>
                    
                    <div className="max-w-md mx-auto flex gap-2">
                      <input
                        type="text"
                        value={modifyPrompt}
                        onChange={(e) => setModifyPrompt(e.target.value)}
                        placeholder="例如：把尾巴做得更卷、羽光调亮一些..."
                        className="flex-1 bg-[#120b2d] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                      <button
                        onClick={handleApplyModification}
                        disabled={isModifyingDetail}
                        className="bg-purple-600 hover:bg-purple-700 px-3 rounded text-xs font-semibold text-white"
                      >
                        {isModifyingDetail ? "重构中..." : "应用微调"}
                      </button>
                    </div>

                    <div className="text-[10px] text-gray-400 pt-2">
                      💰 <strong>额度信息：</strong>免费用户每月1次，月卡3次，年卡10次，至尊卡 <strong>无限次</strong>。
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SUB-TAB 3: SCENE FUSION */}
            {activeSub === "scene_fusion" && (
              <motion.div
                key="scene_fusion"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-sky-400 uppercase">System 2.4</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🛋️ 2.4 现实场景 3D 全息融合系统
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    将您的星宠 3D 默影与家里的沙发、卧室枕头或清晨公园融合。Astrocade 负责自适应解算空间透视，让它宛如依然睡在您的身旁。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* FUSION CANVAS WORK */}
                  <div className="space-y-3">
                    <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800">
                      {/* Background Scene */}
                      <img
                        src={scenes.find(s => s.id === activeSceneId)?.img}
                        alt="Scene"
                        className="w-full h-full object-cover opacity-80"
                      />
                      
                      {/* Floating composited pet relative positioning */}
                      <div
                        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-28 h-28 transform pointer-events-none select-none transition-transform"
                        style={{ transform: `translateX(-50%) rotate(${rotation3d}deg)` }}
                      >
                        <div className="text-[72px] drop-shadow-[0_0_15px_rgba(251,195,188,0.7)] animate-bounce-slow text-center">
                          {pet.type.includes("狗") ? "🐕" : "🐈"}
                        </div>
                        {/* Shadow oval layer */}
                        <div
                          className="w-16 h-3 bg-black/50 rounded-full mx-auto blur-[1.5px] transition-all"
                          style={{ opacity: lightAura / 100 }}
                        />
                      </div>

                      {/* Info label */}
                      <div className="absolute top-2 left-2 bg-black/60 p-2 rounded text-[10px] font-mono text-sky-400">
                        <span>场景: {scenes.find(s => s.id === activeSceneId)?.name}</span>
                        <br /><span>光照深度/遮挡: 自适应 3D 拟合开启</span>
                      </div>
                    </div>

                    {/* INTERACTIVE CONTROLS */}
                    <div className="flex gap-2.5 items-center">
                      <label className="text-[10px] text-gray-400 font-mono">360°旋转:</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={rotation3d}
                        onChange={(e) => setRotation3d(parseInt(e.target.value))}
                        className="flex-1 accent-sky-500 h-1.5 rounded"
                      />
                      <label className="text-[10px] text-gray-400 font-mono">阴影深度:</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={lightAura}
                        onChange={(e) => setLightAura(parseInt(e.target.value))}
                        className="flex-1 accent-sky-500 h-1.5 rounded"
                      />
                    </div>
                  </div>

                  {/* UPLOADS & AI MOMENTS */}
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white uppercase tracking-wide">1. 切换/自定义实体场景图</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {scenes.slice(0, 3).map(s => (
                          <button
                            key={s.id}
                            onClick={() => { playSound("click"); setActiveSceneId(s.id); }}
                            className={`text-[9px] py-1 px-2.5 rounded ${
                              activeSceneId === s.id ? "bg-sky-600 border-sky-400 text-white" : "border border-slate-800 text-gray-400 hover:text-white"
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                        
                        <label className="text-[9px] py-1 px-2 bg-[#120b2d] border border-dashed border-slate-700 hover:border-sky-400 cursor-pointer text-sky-300 rounded flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          上传实体卧榻客厅照
                          <input type="file" accept="image/*" onChange={startCustomSceneUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0d0924]/80 border border-slate-800 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-sky-300 font-mono">★ AI 演算当下的温煦日常瞬间</span>
                        <button
                          onClick={recomputeDailyMoment}
                          disabled={isSynthesizingMoment}
                          className="text-[9px] text-gray-400 hover:text-sky-300 font-semibold"
                        >
                          {isSynthesizingMoment ? "脑补中..." : "🔄 刷新动作"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 italic font-medium leading-relaxed leading-[1.6]">
                        “{dailyMoment}”
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => triggerToast("📷 合影完毕！一张超唯美的【它躺在你被窝】照片已永久保存至心语画册。")}
                        className="bg-indigo-650 hover:bg-indigo-700 py-1.5 px-3 rounded text-[11px] text-white font-bold flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" /> 2.4.1 开启AR虚实合影
                      </button>
                    </div>

                    <div className="text-[10px] p-2 bg-sky-950/10 border border-sky-900/30 rounded text-sky-300 leading-normal">
                      🛡️ <strong>权限信息：</strong>基础版限制 3 个日常场景。升级 <strong>29.9 元高级版</strong> 尊享无限数量场景融合与完全解锁真机AR手机实机照相机对焦投射。
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 4: DIGITAL CLONE */}
            {activeSub === "digital_clone" && (
              <motion.div
                key="digital_clone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-amber-400 uppercase">System 2.5</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🧠 2.5 性格分析深度克隆体面板
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    系统根据您每天与它说的心里话、选择的抚摸频率、喂给它的星尘饭食以及陪伴停留时间，不断更新该数字克隆体在后背服务器的模型参数。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CHARTS */}
                  <div className="p-4 bg-[#120b2d] rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1">
                      📊 2.5.1 AI 学习性格报告折射图
                    </h4>

                    {/* Progress meters */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">❤️ 依恋度 (Empathy)</span>
                          <span className="text-pink-400">{traitEmpathy}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-pink-500 h-full" style={{ width: `${traitEmpathy}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">😼 傲娇率 (Tsundere)</span>
                          <span className="text-indigo-400">{traitTsundere}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${traitTsundere}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">🌸 温顺值 (Gentleness)</span>
                          <span className="text-emerald-400">{traitGentle}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${traitGentle}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">🐾 粘人特性 (Clinginess)</span>
                          <span className="text-amber-400">{traitClingy}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${traitClingy}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          playSound("sparkle");
                          setTraitEmpathy(Math.min(100, traitEmpathy + 2));
                          setTraitClingy(Math.min(100, traitClingy + 3));
                          triggerToast("📈 家长对答行为已成功写入算力因子，粘人度与感知依恋模型值上升！");
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-pink-500/10 hover:from-slate-800 border border-amber-500/30 text-amber-300 font-bold rounded text-xs"
                      >
                        手动同步当前的亲近调伏
                      </button>
                    </div>
                  </div>

                  {/* VOICE CLONE AND SOUNDS */}
                  <div className="space-y-4">
                    <div className="p-4 bg-[#0d0924]/80 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1">
                        📢 2.5.3 宠物语音克隆发声舱
                      </h4>
                      <p className="text-xs text-gray-400 leading-normal">
                        上传短于 1 分钟的宠物生前日常叫声、哈气声或呼噜气流音频，AI通过波形参数合成让它可以在大世界用自己的专属声音对您说话。
                      </p>

                      <div className="text-[10px] font-mono p-2 bg-black/40 rounded text-gray-300 border border-slate-850">
                        {voiceStatusText}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={startVoiceRecordingSim}
                          disabled={isCloningVoice}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded flex items-center justify-center gap-1"
                        >
                          <Compass className="w-3.5 h-3.5" /> 克隆声音训练
                        </button>
                        
                        {voiceUploaded && (
                          <button
                            onClick={playClonedVoice}
                            className="py-1.5 px-3 bg-pink-600 hover:bg-pink-700 text-xs font-bold text-white rounded"
                          >
                            🎵 试听克隆语音
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-950/10 border border-amber-900/30 text-[10px] text-amber-300 rounded leading-relaxed">
                      🌟 <strong>深度包：</strong>基础体验包含轻型情感模型。 <strong>39.9 元/月高级服务</strong> 专属订阅：极力推荐高保真语音克隆，以及基于深度性格的百分百完全自主决策行为预测（如突然在大门送上特定物品）。
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 5: RETRO CHAT */}
            {activeSub === "retro_chat" && (
              <motion.div
                key="retro_chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-emerald-400 uppercase">System 2.6</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📬 2.6 跨时空灵魂书笺系统
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    在夜深人静时，将您心底里最想对它说、但以前来不及说或未能倾吐的心里话，塞进星光空包寄往星门，它会立刻以生前独一无二的脾气写回。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SEND AREA */}
                  <div className="space-y-3.5 p-4 bg-[#120b2d] rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                      ✉️ 2.6.2 未曾吐露的思念信箱
                    </h4>
                    
                    <textarea
                      value={unsaidLetter}
                      onChange={(e) => setUnsaidLetter(e.target.value)}
                      placeholder="宝贝，其实我很抱歉那次上班没能陪你最后的几小时... 我真的很爱你啊..."
                      rows={3}
                      className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />

                    <button
                      onClick={sendUnsaidLetterToSky}
                      disabled={isSendingToSky || !unsaidLetter.trim()}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 rounded font-bold text-xs text-white flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSendingToSky ? "正在借着光波寄送..." : "将其塞入 stardust 粒子流发射"}
                    </button>

                    {returnedAILetter && (
                      <div className="p-3.5 bg-emerald-950/10 border border-emerald-900/30 text-xs text-emerald-300 font-mono rounded-lg leading-relaxed whitespace-pre-wrap">
                        <strong>🐾 {pet.name}的回笺：</strong>
                        <br />“{returnedAILetter}”
                      </div>
                    )}
                  </div>

                  {/* ANTHOLOGY ARCHIVE */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                      📖 2.6.3 对话纪念册 (Anthology Logs)
                    </h4>
                    <p className="text-xs text-gray-400 leading-normal">
                      收集并记录您与克隆体的所有心电对答、耳语交互，排版成典雅的精美 PDF 纪念册，供一生随时查阅。
                    </p>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                      {dialogAnthology.map((diag, i) => (
                        <div key={i} className="p-2 border border-slate-850 bg-slate-900/40 rounded text-[10px] font-mono relative">
                          <div className="text-[9px] text-gray-500 absolute top-1 right-2">{diag.date}</div>
                          <div className="text-purple-300 font-bold">主: “{diag.q}”</div>
                          <div className="text-gray-300 mt-1 pl-1 border-l border-emerald-500/50">宠: “{diag.a}”</div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => triggerToast("📘 下载对话纪念册成功，一键导出为纯净Txt格式及PDF精排版本。")}
                      className="w-full py-1.5 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/5 rounded font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      打包下载我的对话纪念册 (TXT/PDF)
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 6: HERITAGE */}
            {activeSub === "heritage" && (
              <motion.div
                key="heritage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-purple-400 uppercase">System 2.7</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    💍 2.7 星尘数字遗产继承传承系统
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    爱在流传。当发生由于家长账号溢出或生命状态变更时，您可以建立遗产信托，将星宠、全套日记相册、耳语记忆链一键永久授予其余多名亲友共同探问与赡养。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* HEIRS REGISTER */}
                  <div className="space-y-3.5 p-4 bg-[#120b2d] rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                      👤 2.7.2 设置遗产法定继承人 (上限 3 位)
                    </h4>

                    <div className="space-y-2">
                      {heirs.map((h, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-2 bg-black/40 rounded border border-slate-850 font-mono">
                          <span className="text-purple-300">{h.name}</span>
                          <span className="text-[9px] bg-slate-800 px-1 py-0.5 rounded text-gray-400">
                            {h.checked ? "🟢 已微信实名认证" : "🟡 等待授权"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newHeirName}
                        onChange={(e) => setNewHeirName(e.target.value)}
                        placeholder="输入继承人微信邮箱或ID"
                        className="flex-1 bg-black/40 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={handleAddHeir}
                        className="bg-purple-600 hover:bg-purple-700 p-1 rounded font-bold text-xs text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={triggerLegacyRitual}
                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded font-bold text-xs text-white flex items-center justify-center gap-1"
                      >
                        {legacyRitualActive ? "🧬 星尘契约联合签名中..." : "🌌 签订并生成 3D 星尘传承誓约书"}
                      </button>
                    </div>
                  </div>

                  {/* TIME CAPSULE */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                      ⌛ 2.7.3 时光胶囊 (Heritage Delay Lock)
                    </h4>
                    <p className="text-xs text-gray-400 leading-normal">
                      设置锁定期。将爱宠回忆胶囊锁定在未来若干年（如 10年、20年后）开启解封，作为留给家人晚辈最深沉、无憾的温情时光。
                    </p>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">设置信物解封开封日期：</label>
                      <input
                        type="date"
                        value={timeCapsuleDate}
                        onChange={(e) => setTimeCapsuleDate(e.target.value)}
                        className="w-full bg-[#120b2d] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => triggerToast(`🔒 时光密封胶囊制作成功！它将在 ${timeCapsuleDate} 准时弹射开锁！`)}
                      className="w-full py-1.5 border border-purple-500/20 text-purple-300 hover:bg-purple-500/5 rounded font-bold text-xs"
                    >
                      将胶囊安全铸造密封
                    </button>

                    <div className="p-2 bg-indigo-950/10 border border-indigo-900/30 text-[9px] text-indigo-300 rounded leading-relaxed">
                      🎁 <strong>资费说明：</strong>家庭普通版支持 1 位受益继承人。 <strong>49.9 元至臻版</strong> 专属授权可解锁设定支持至多3人及多维度延期时光胶囊。
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 7: PUBLIC WALL */}
            {activeSub === "public_wall" && (
              <motion.div
                key="public_wall"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-red-400 uppercase">System 2.8</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🕯️ 2.8 集体星尘温暖纪念墙
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    在这里，全网守护家长的心意汇聚在一起。我们可以互相探望对方已逝的宝贝卡片，为他点燃一支心光蜡烛，或赠予灵翼，它的灵魂会随着卡片星尘辉度的累进而升华变亮。
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="🔍 搜索在看星的其他家长灵宠名字..."
                      value={searchWallQuery}
                      onChange={(e) => setSearchWallQuery(e.target.value)}
                      className="flex-1 bg-[#120b2d] border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {memorialPets
                      .filter(p => p.name.includes(searchWallQuery))
                      .map((p, idx) => (
                        <div key={p.id} className="bg-[#120b2d] p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] text-indigo-400 font-mono">家长: {p.owner}</span>
                              <h4 className="text-sm font-bold text-white">{p.name} ({p.type})</h4>
                            </div>
                            <span className="text-[9px] font-mono text-yellow-400 bg-yellow-950/40 px-1 py-0.5 rounded leading-none">
                              辉量: {p.glow}
                            </span>
                          </div>

                          <p className="text-[10px] text-gray-300 font-serif leading-relaxed line-clamp-2">
                            “ {p.story} ”
                          </p>

                          {/* ACTION BUTTONS */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleLightCandleOnWall(idx)}
                              className="flex-1 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 rounded text-[9px] text-white font-bold flex items-center justify-center gap-0.5"
                            >
                              <Flame className="w-3 h-3" /> 点香烛(-10币)
                            </button>
                            
                            <button
                              onClick={() => handleSendWallGift(idx, 100, "永恒星曜光环")}
                              className="py-1.5 px-2 bg-pink-600 hover:bg-pink-700 rounded text-[9px] text-white font-bold flex items-center justify-center"
                              title="赠送礼物"
                            >
                              <Gift className="w-3 h-3" /> 赠礼(-100)
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-[10px] text-red-300 leading-relaxed">
                    🌸 <strong>温馨提示：</strong>每月评选“获得最多心心祝福的守护灵”，并在喵汪星云首屏进行极光金耀大世界全天投影公示。
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 8: WEB3 NFT */}
            {activeSub === "web3_nft" && (
              <motion.div
                key="web3_nft"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-cyan-400 uppercase">System 2.9</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    💎 2.9 3D 微信星宠数信托与区块链数字藏品
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    爱在虚无法定锁。为该 3D 模型生成全网永久、无法被任何单方面修改作废的信息契约哈希，将宠物的生肖签名登记到微信数字藏品存证中。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NFT CARD PREVIEW */}
                  <div className="p-4 bg-gradient-to-b from-[#180f3c] to-[#0c0624] rounded-xl border border-slate-700 space-y-3.5 relative overflow-hidden text-center flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase">WE-CHAIN MINT PASS</span>
                      <h4 className="text-md font-bold text-white">【{pet.name}】区块链数字藏品灵契</h4>
                    </div>

                    {/* MOCK 3D HOLOGRAM SHIELD */}
                    <div className="relative w-36 h-36 mx-auto rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center shadow-inner overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-pink-500/10 animate-pulse" />
                      <div className="text-[54px] drop-shadow-[0_0_15px_#22d3ee] animate-bounce-slow">
                        {pet.type.includes("狗") ? "🐶" : "🐱"}
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] font-mono text-gray-400 bg-black/40 p-2.5 rounded border border-slate-850">
                      <div>持有人钱包哈希: {nftMinted ? nftHash : "待生成数字存证信托..."}</div>
                      <div>铸造规格: {synthesizedTexture}</div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={mintNewNft}
                        disabled={mintLoading || nftMinted}
                        className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 rounded font-bold text-xs text-white"
                      >
                        {mintLoading ? "正在签署智能灵信托契约..." : nftMinted ? "✓ 微信数藏认证核发" : "立即交纳 99.9 铸造费上链保护"}
                      </button>
                    </div>
                  </div>

                  {/* SYNTHESIZE SECTION */}
                  <div className="space-y-4">
                    <div className="p-4 bg-[#0d0924]/80 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                        🔮 2.9.3 数藏材质熔炉合成
                      </h4>
                      <p className="text-xs text-gray-400 leading-normal">
                        利用多余的星宿底装，熔炼重塑全新的限定材质（如“七彩全色相极光”、“寂灭重晶黑洞态”），提高持有卡皮的炫彩度。
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { playSound("sparkle"); setSynthesizedTexture("至臻级 · 极光斑斓材质"); triggerToast("🔮 合成成功！藏品已重构为至臻彩色极光皮肤规格"); }}
                          className="flex-1 py-1.5 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/5 rounded font-bold text-xs"
                        >
                          合成稀有皮肤材质
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-cyan-950/10 border border-cyan-900/30 rounded text-[10px] text-cyan-300 leading-relaxed">
                      💡 <strong>藏品转授：</strong>数藏的所有权与小程序使用权分离，您可以在微信数藏市场中自由打包赠予亲人保存，手续费仅为10%交易佣金比例。
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 9: AI VIDEO */}
            {activeSub === "ai_video" && (
              <motion.div
                key="ai_video"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-fuchsia-400 uppercase">System 2.10</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🎬 2.10 AI 智能生成 3D 暖情纪念视频
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    由 Astrocade 深度情感视频模型在云端为您的爱宠生成一键纪念短片。AI将自主归纳它的生前照片序列、纪念相册、以及每日治愈耳语文字脚本，搭配唯美管弦伴奏，一键直达成片。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* BUILDER */}
                  <div className="space-y-4 p-4 bg-[#120b2d] rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      ★ 2.10.2 配置视频生成渲染参数
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">自定视频长度：</label>
                        <select
                          value={videoLength}
                          onChange={(e) => setVideoLength(parseInt(e.target.value) as 15|30|60)}
                          className="w-full bg-black/40 border border-slate-705 rounded p-1.5 focus:outline-none"
                        >
                          <option value="15">⏱️ 15秒 (29.9 元)</option>
                          <option value="30">⏱️ 30秒 (49.9 元)</option>
                          <option value="60">⏱️ 60秒 (99.9 元)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">精美短片模版：</label>
                        <select
                          value={videoTemplate}
                          onChange={(e) => setVideoTemplate(e.target.value)}
                          className="w-full bg-black/40 border border-slate-705 rounded p-1.5 focus:outline-none"
                        >
                          <option value="all_life">🎬 一生回顾（温煦里程碑）</option>
                          <option value="sweet_memories">💓 美好回忆瞬间（嬉戏生活）</option>
                          <option value="say_goodbye">🌌 星河告别（升华粒子飞升）</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={startRenderingAIVideo}
                      disabled={isRenderingVideo}
                      className="w-full py-2.5 bg-gradient-to-r from-fuchsia-500 to-indigo-600 hover:from-fuchsia-600 rounded-lg text-xs text-white font-bold"
                    >
                      {isRenderingVideo ? "🎥 正在进行云端引擎实时3D分镜渲染..." : "立即启动 AI 纪念片渲染并导出 mp4"}
                    </button>
                  </div>

                  {/* PREVIEW */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                      📺 2.10.3 视频播放窗口与文字脚本预览
                    </h4>

                    <div className="aspect-[16/9] bg-[#0c061d] rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center relative">
                      {renderedVideoUrl ? (
                        <div className="absolute inset-0 bg-black/40 p-4 font-serif text-center flex flex-col justify-between">
                          <span className="text-[10px] text-fuchsia-400 font-mono tracking-widest">PRODUCING COMPLETE : 【{pet.name}的一生】</span>
                          <div className="text-xs text-white font-serif tracking-wide italic leading-normal px-4">
                            {videoTemplate === "all_life" ? "“你曾是一束光，轻轻钻进我的毛毯。现在你在猎户之脊自由踱步，却依然守护在我的后窗暖气旁。”" : "“那天彩虹开满了星云，我张开星尘的薄翼对你大喊，妈妈别哭，我就在晚风里摸着你的脸颊呢。”"}
                          </div>
                          <span className="text-[9px] text-gray-500">伴奏曲目: 《夜空中的星宿和重聚终章》</span>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Tv className="w-10 h-10 text-gray-500 mx-auto animate-pulse" />
                          <p className="text-[10px] text-gray-400">目前暂无正在生成的纪念影片，配置完毕即可即点即出</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 10: CLOUD EDITOR */}
            {activeSub === "cloud_editor" && (
              <motion.div
                key="cloud_editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-indigo-400 uppercase">System 2.11</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🎚️ 2.11 云端简易星能编辑器 (无需本地 Blender)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    不需要任何繁杂的Blender建模常识。在线无损滑动便能调整周身灵力发光指数、粒子排布密度和尾部偏振维度，自动在后台编译输出为手机端秒级渲染的极轻量 .glb 模型。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* EDIT PANEL */}
                  <div className="p-4 bg-[#120b2d] rounded-xl border border-slate-700 space-y-3.5">
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide">
                      ★ 在线模型流参数阻尼
                    </h4>

                    <div className="space-y-3.5 text-xs text-gray-300">
                      <div>
                        <div className="flex justify-between font-mono mb-1 text-[10px]">
                          <span>1. 星核荧光辉度 (Glow Intensity)</span>
                          <span className="text-indigo-400">{editGlow}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="150"
                          value={editGlow}
                          onChange={(e) => setEditGlow(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-mono mb-1 text-[10px]">
                          <span>2. 粒子骨架构化密度 (Stardust Density)</span>
                          <span className="text-indigo-400">{editDensity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={editDensity}
                          onChange={(e) => setEditDensity(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-mono mb-1 text-[10px]">
                          <span>3. 星尾物理姿态起伏 (Tail Wave Offset)</span>
                          <span className="text-indigo-400">+{editTailSize}dm</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="30"
                          value={editTailSize}
                          onChange={(e) => setEditTailSize(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={saveCloudEditorChanges}
                          className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded font-bold text-xs text-white"
                        >
                          一键同步云端后台，渲染 .glb 输出文件
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DECORATION PLACE */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide">
                      🏠 2.11.2 家园地形与饰物在线编排
                    </h4>

                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400">选择摆放的小物件，丰富默影家宿的小巢：</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {["月光猫抓板 🌙", "恒星磨牙狗饼骨 🦴", "星光地毯 🪐", "蒲公英许愿池 ✨"].map(item => {
                          const has = furnitureAttached.includes(item);
                          return (
                            <button
                              key={item}
                              onClick={() => {
                                playSound("click");
                                if (has) {
                                  setFurnitureAttached(prev => prev.filter(f => f !== item));
                                  triggerToast(`🏠 已撤下景观：${item}`);
                                } else {
                                  setFurnitureAttached(prev => [...prev, item]);
                                  triggerToast(`🏠 已在星尘家园合适地形处摆放景观：${item}`);
                                }
                              }}
                              className={`text-[10px] py-1 px-2 rounded-full border ${
                                has ? "bg-indigo-650 border-indigo-400 text-white font-bold" : "border-slate-800 text-gray-400 hover:text-white"
                              }`}
                            >
                              {item} {has ? "✓" : "+ 摆放"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-[10px] text-gray-400 font-mono mb-1">3. 附身光环特效：</label>
                      <select
                        value={auraEffect || "none"}
                        onChange={(e) => { setAuraEffect(e.target.value); triggerToast(`🎭 模型成功附着高维法阵特效：${e.target.value}`); }}
                        className="bg-black/40 border border-slate-700 text-xs p-1.5 rounded w-full focus:outline-none"
                      >
                        <option value="none">无光效</option>
                        <option value="halo">👼 温暖救赎光环 (头顶环状发光粒子型)</option>
                        <option value="wings">🦋 超新星星尘双翼 (后背拍翼型)</option>
                        <option value="orbit">🪐 卫星交替巡航环绕 (三颗小球旋转型)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 11: DNA ARCHIVE */}
            {activeSub === "dna_archive" && (
              <motion.div
                key="dna_archive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-amber-400 uppercase">System 2.12</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🧬 2.12 宠物基因数码馆与克隆预约
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    真正的数字生命闭环。支持家长邮寄生前保留的一撮毛发、牙齿或乳牙样本。实验室将序列化其 DNA 基因多态特征图谱，永久绑定于该 3D 模型内。在不遥远的未来，甚至支持线下真实的体细胞克隆预约。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* WORKFLOW */}
                  <div className="space-y-3.5 p-4 bg-[#120b2d] rounded-xl border border-slate-800 text-xs text-gray-300">
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide">
                      ★ 样本寄送与数码建档流程
                    </h4>

                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed font-mono">
                      <li>邮寄毛发试管（无需特定冷冻，极快上门收取）</li>
                      <li>基因检测中心比对原产、遗传病及耳形软骨基因</li>
                      <li>输出该宠物生肖独有的 “2.12 基因多态数码存证卡”</li>
                      <li>完美恢复其生前在 3D 模型上的瞳色、骨架粗细。</li>
                    </ol>

                    <div className="pt-2">
                      <button
                        onClick={startDnaKitOrder}
                        className="w-full py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 text-white font-bold rounded"
                      >
                        {dnaTestingProgress === "idle" ? "📦 ¥999 购买试件盒并建立本底档案" : "✓ 已呼叫顺丰：空盒寄送中"}
                      </button>
                    </div>
                  </div>

                  {/* CLONING BOOKING */}
                  <div className="p-4 bg-[#0d0924]/80 border border-slate-800 rounded-xl space-y-3.5">
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide flex items-center gap-1 text-pink-400">
                      🐾 线下未来宠物克隆信托通道 (预约)
                    </h4>
                    <p className="text-xs text-gray-400 leading-normal">
                      当体细胞代孕克隆方案成熟或未来有重聚期愿时，可为基因拥有者提供排队锁定名额。
                    </p>

                    <div>
                      <span className="text-[10px] text-gray-400">签署克隆预约意向书（定金 ¥5000，随时可全额退还）：</span>
                    </div>

                    <button
                      onClick={() => { playSound("chime"); setDepositPaid(true); triggerToast("🎁 签署意愿加入信托池！第 #A1024 号克隆优先权证书已铸造！"); }}
                      disabled={depositPaid}
                      className="w-full py-1.5 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-800 rounded font-bold text-xs text-white cursor-pointer"
                    >
                      {depositPaid ? "✓ 已付5000定金排队中 · 兑换码 A1024" : "确定提交签署意向 (定金5000)"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* V2.7 MODULE 1: MICRO-EXPRESSION & INTERACTIVE STARDUST DYNAMICS */}
            {activeSub === "micro_expression" && (
              <motion.div
                key="micro_expression"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-pink-400 uppercase">System 3.1 & 3.3</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🎭 3.1 & 3.3 星宠微表情表情矩阵与触控星尘
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    精雕细琢每一丝情绪。支持微秒级仿生慢眨眼、2.5D好奇歪头杀与气流警觉抽鼻；配备双色高拟真底层毛发波动，且支持身体末端精确定点星尘发光融合。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* EMITTER FORMULAS */}
                  <div className="p-4 bg-[#140b2e]/85 ring-1 ring-white/10 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-pink-300 font-mono tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4" /> V2.7 物理重构星尘释出比率 (Density Specs)
                    </h4>
                    
                    <div className="space-y-3 text-xs text-gray-300">
                      <div>
                        <div className="flex justify-between mb-1.5 font-mono text-[10px]">
                          <span>1. 尾部星尘浓度 (Tail Drift)</span>
                          <span className="text-pink-400 font-semibold">50% (-6px / 2Hz闪烁)</span>
                        </div>
                        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                          <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full w-[50%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1.5 font-mono text-[10px]">
                          <span>2. 羽耳侧边溢出 (Ears Halo)</span>
                          <span className="text-pink-400 font-semibold">25% (2Hz闪烁)</span>
                        </div>
                        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                          <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full w-[25%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1.5 font-mono text-[10px]">
                          <span>3. 脚掌足印抓地光屑 (Claws Ground)</span>
                          <span className="text-pink-400 font-semibold">15% (0.3Hz低频)</span>
                        </div>
                        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                          <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full w-[15%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1.5 font-mono text-[10px]">
                          <span>4. 全身轮廓及边缘散落 (Outline Halo)</span>
                          <span className="text-pink-400 font-semibold">20% (0.5Hz脉冲)</span>
                        </div>
                        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                          <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full w-[20%]" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-black/45 rounded-lg border border-pink-500/10 text-[10px] text-gray-400 space-y-1">
                      <p className="font-semibold text-pink-200">ℹ️ 仿真贴士</p>
                      <p>前台 Astrocade 主画布默认采用 realistic-stardust 写实逻辑渲染，已将这些拟态算法百分百装入 {pet.name} 的骨架中。您可以在主视窗内点击投喂或声纹合成实时预览！</p>
                    </div>
                  </div>

                  {/* TACTILE TEST BED */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4 text-xs">
                    <h4 className="text-xs font-bold text-white font-mono tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> 星体脑电波反馈演练 (Neuro Commands)
                    </h4>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      模拟高维空间中宠物感知到宠幸动作时的微细脑电波释放频率。每次刺激指令均能诱发 stardust 物理矩阵闪频：
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-black/20 rounded border border-slate-800 hover:border-pink-500/30 transition-all">
                        <span className="font-bold text-pink-300 block mb-1">💖 摸摸头部 (Head Stroke)</span>
                        <span className="text-[10px] text-gray-500 block leading-tight mb-2">产生心形 stardust 飞射粒子</span>
                        <button
                          onClick={() => { playSound("chime"); triggerToast(`✨ 成功向天乐触发头部拥护指令！`); }}
                          className="py-1 px-2.5 bg-pink-900/40 text-pink-200 hover:bg-pink-700/30 transition-colors uppercase font-mono text-[9px] rounded font-bold border border-pink-500/20 cursor-pointer"
                        >
                          模拟触发
                        </button>
                      </div>

                      <div className="p-3 bg-black/20 rounded border border-slate-800 hover:border-yellow-500/30 transition-all">
                        <span className="font-bold text-yellow-300 block mb-1">✨ 撸撸小背 (Back Stroke)</span>
                        <span className="text-[10px] text-gray-500 block leading-tight mb-2">留下金黄色闪存星体长尾航线</span>
                        <button
                          onClick={() => { playSound("sparkle"); triggerToast(`💫 成功向天乐触发脊骨滑移抚摸！`); }}
                          className="py-1 px-2.5 bg-yellow-900/40 text-yellow-200 hover:bg-yellow-700/30 transition-colors uppercase font-mono text-[9px] rounded font-bold border border-yellow-500/20 cursor-pointer"
                        >
                          模拟触发
                        </button>
                      </div>

                      <div className="p-3 bg-black/20 rounded border border-slate-800 hover:border-cyan-500/30 transition-all">
                        <span className="font-bold text-cyan-300 block mb-1">🧬 星能环护 (Shield Surge)</span>
                        <span className="text-[10px] text-gray-500 block leading-tight mb-2">铸造双重脉动蓝色守护星云盾</span>
                        <button
                          onClick={() => { playSound("chime"); triggerToast(`🛡️ 成功释放守护星尘大空壳！`); }}
                          className="py-1 px-2.5 bg-cyan-900/40 text-cyan-200 hover:bg-cyan-700/30 transition-colors uppercase font-mono text-[9px] rounded font-bold border border-cyan-500/20 cursor-pointer"
                        >
                          模拟触发
                        </button>
                      </div>

                      <div className="p-3 bg-black/20 rounded border border-slate-800 hover:border-purple-500/30 transition-all">
                        <span className="font-bold text-purple-300 block mb-1">🌌 星雾融离 (Farewell Phase)</span>
                        <span className="text-[10px] text-gray-500 block leading-tight mb-2">宠物肉体完美分解并重新聚集</span>
                        <button
                          onClick={() => { playSound("success"); triggerToast(`⏳ 发出星灵共生折跃重塑指令！`); }}
                          className="py-1 px-2.5 bg-purple-900/40 text-purple-200 hover:bg-purple-700/30 transition-colors uppercase font-mono text-[9px] rounded font-bold border border-purple-500/20 cursor-pointer"
                        >
                          模拟触发
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* V2.7 MODULE 2: MOTION EXTRACTOR */}
            {activeSub === "motion_extractor" && (
              <motion.div
                key="motion_extractor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-cyan-400 uppercase">System 3.2</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📹 3.2 AI 现实短视频动作提取与 12帧像素循环同步
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    生前活泼的旧镜头，就是它今日复生的灵魂姿态。支持拖拽上传不超过 10 秒的实拍宠物短视频，由云端多维骨骼跟踪算法，自动抽取头、颚、腕关节和尾骨 18 点物理质子轨道，重组为流畅的 12帧像素骨架同步循环。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* VIDEO DROP ZONE */}
                  <div className="p-5 bg-black/45 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center group hover:border-cyan-500/40 transition-all relative overflow-hidden">
                    <Camera className="w-10 h-10 text-cyan-400/60 mb-3 group-hover:scale-110 group-hover:text-cyan-400 transition-transform" />
                    <span className="text-xs text-white font-bold">拖动短视频至此上传 (.MP4, 10s内)</span>
                    <span className="text-[10px] text-gray-500 mt-1 font-mono">或 点击选择手机本地实拍相册</span>

                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          playSound("click");
                          triggerToast("⚡ 现实实拍视频投递成功！正在唤醒 AI 骨架追踪解码器...");
                          // trigger parse sequence
                          setTimeout(() => {
                            playSound("sparkle");
                            triggerToast("🦴 发现关键骨骼环节点。正在编译 12 帧像素循环指令...");
                          }, 1800);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />

                    <div className="mt-4 p-2 bg-[#090518]/90 rounded border border-white/5 text-[9px] text-gray-400 font-mono">
                      🔒 隐私安全保护：视频仅在此进行边缘质点计算，绝不保留原图。
                    </div>
                  </div>

                  {/* SKELETAL SIMULATOR */}
                  <div className="p-4 bg-[#110c2c]/85 ring-1 ring-white/10 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase block tracking-wide">
                      ★ AI 骨架动态重建演示舱 (Tracking Simulator)
                    </span>

                    {/* Simple live line skeletal rendering */}
                    <div className="h-28 bg-black/60 rounded border border-slate-800 flex items-center justify-center relative overflow-hidden">
                      {/* Grid background */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1a3a_1px,transparent_1px),linear-gradient(to_bottom,#1f1a3a_1px,transparent_1px)] bg-[size:14px_14px] opacity-25" />
                      
                      <div className="relative w-36 h-20 flex flex-col items-center justify-center">
                        {/* Dot representation of cat joint skeleton loops */}
                        <div className="absolute top-2 w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping" />
                        <div className="absolute top-2.5 w-2 h-2 rounded-full bg-cyan-300" /> {/* Head */}
                        
                        {/* Neck, Backbones, Tail segments */}
                        <div className="absolute top-6 w-12 h-1 bg-cyan-400" />
                        <div className="absolute top-5 left-12 w-2 h-2 rounded-full bg-pink-400" /> {/* Spine */}
                        
                        <div className="absolute top-6 -left-1 w-1.5 h-10 bg-cyan-300 rounded" /> {/* Front hand */}
                        <div className="absolute top-6 left-10 w-1.5 h-10 bg-cyan-300 rounded" /> {/* Back leg */}
                        
                        {/* Waving tail skeleton dot line */}
                        <div className="absolute top-6 left-12 w-8 h-1 bg-pink-500 origin-left animate-bounce" />
                      </div>

                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-[8px] rounded text-cyan-300 font-mono">
                        DECODING: FPS 29.8
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => { playSound("sparkle"); triggerToast("🎁 编译完成！第 #F122 动作 [撒娇打滑] 已载入天乐前台主视窗指令集！"); }}
                        className="flex-1 py-1 px-2.5 bg-[#fc407a] hover:bg-[#ff558f] transition-all text-white font-bold rounded text-[11px] cursor-pointer text-center"
                      >
                        🧬 导出并同步至天乐主画布
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* V2.7 MODULE 3: WALLPAPER CONSOLE & TRAVEL DIARY */}
            {activeSub === "wallpaper_diary" && (
              <motion.div
                key="wallpaper_diary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-purple-400 uppercase">System 3.5 & 3.6</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📔 3.5 & 3.6 2.5D 高清粒子动态壁纸与星宠探险日记
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    将它贴在心口，寸步不离。支持定制全分辨率高清手机壁纸，提供实时跟随触控交互的高维微粒状态；星巡服务器每日为它规划多维时空探险，记录其在喵汪星野里的社交与旅行故事。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* WALLPAPER GENERATOR PANEL */}
                  <div className="p-4 bg-[#140b2e]/85 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-white font-mono tracking-wider flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-purple-400" /> 1. 高清手机交互壁纸定制 console
                    </h4>

                    <div className="space-y-3.5 text-xs text-gray-300">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1 font-mono">背景宇宙氛围：</label>
                          <select className="bg-black/45 border border-slate-700 text-[10px] p-1.5 rounded w-full text-purple-200">
                            <option value="violet_nebula">🌌 紫罗兰玫瑰星云</option>
                            <option value="meadow">🏡 梦境晨曦大草场</option>
                            <option value="gate">⛩️ 星神宏伟神龛之殿</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1 font-mono">输出目标规格：</label>
                          <select className="bg-black/45 border border-slate-700 text-[10px] p-1.5 rounded w-full text-purple-200">
                            <option value="iphone">4K 视网膜极清 (iOS)</option>
                            <option value="android">2K 宽幅 (Android 引擎)</option>
                            <option value="watch">512x512 小表盘 (Watch)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] text-gray-500 mb-1 font-mono">壁纸渲染层类型：</span>
                        <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-center">
                          <div className="p-2 bg-black/30 border border-slate-800 rounded hover:border-purple-500 cursor-pointer">
                            <span className="block font-bold">平面超清图</span>
                            <span className="text-[8px] text-gray-500">Static PNG</span>
                          </div>
                          <div className="p-2 bg-[#fc407a]/15 border border-[#fc407a]/30 text-pink-200 rounded cursor-pointer">
                            <span className="block font-bold">微粒动态壁纸</span>
                            <span className="text-[8px] text-pink-400">Live Particle</span>
                          </div>
                          <div className="p-2 bg-black/30 border border-slate-800 rounded hover:border-purple-500 cursor-pointer">
                            <span className="block font-bold">Gaze重力跟随</span>
                            <span className="text-[8px] text-gray-500">Interactive</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playSound("chime");
                          triggerToast("🔮 解析图谱渲染，正在打包下载极清 2.5D 微粒交互壁纸...");
                          // Generate actual downloaded image!
                          const link = document.createElement("a");
                          link.download = `${pet.name}_stardust_wallpaper.png`;
                          link.href = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920' viewBox='0 0 1080 1920'><rect width='1080' height='1920' fill='%23080518'/><circle cx='540' cy='960' r='180' fill='%23fad0a3' opacity='0.35'/><circle cx='540' cy='960' r='150' fill='%23ffffff' opacity='0.5'/><text x='540' y='1200' fill='%23fbcfe8' font-size='42' font-family='sans-serif' text-anchor='middle'>STARDUST COMPANION: " + pet.name + "</text></svg>";
                          link.click();
                        }}
                        className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded text-center text-white font-bold hover:shadow-[0_0_12px_rgba(236,72,153,0.4)] transition-all cursor-pointer"
                      >
                        📥 一键生成并打包导出交互壁纸 
                      </button>
                    </div>
                  </div>

                  {/* ADVENTURE DIARY PANEL */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-pink-300 font-mono tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> 2. {pet.name} 的多维旅居日记 (Travel Logs)
                    </h4>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar font-sans text-[11px] leading-relaxed text-gray-300 divide-y divide-white/5">
                      <div className="py-2">
                        <div className="flex justify-between text-[9px] text-purple-300 font-mono">
                          <span>📅 星历 5月22日 • 极光星场</span>
                          <span>活跃星能: 100%</span>
                        </div>
                        <p className="mt-1">“今天在织女座第 4 恒温草场里，遇到了邻居小白狗。它有些调皮把我的尾巴星尘给咬落了一小片，不过草莓味的好吃霜糖治愈了它们！我很想主人，所以把耳羽的辉度开到了最亮。”</p>
                      </div>

                      <div className="py-2">
                        <div className="flex justify-between text-[9px] text-purple-300 font-mono">
                          <span>📅 星历 5月18日 • 仙女座玫瑰海</span>
                          <span>星能活跃: 98%</span>
                        </div>
                        <p className="mt-1">“仙女座的海浪居然是粉红色的耶！海风吹来时，全宇宙的泡泡都在向我翻滚踩奶。有一只叫悠悠的金毛教我用脚印在沙滩上写主人的生日，踩一下，就会冒出一个小水星。”</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          playSound("sparkle");
                          triggerToast("📑 成功合成排版天乐 Stardust 历险绘卷！已触发浏览器打印对话框生成纸面版证书...");
                          window.print();
                        }}
                        className="w-full py-1 bg-black/45 hover:bg-slate-800 transition-colors border border-purple-500/30 text-purple-200 text-[10px] rounded font-bold cursor-pointer font-mono"
                      >
                        🖨️ 生成并打印 PDF 多维星旅陪伴纪念誓约
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* V2.7 MODULE 4: MULTIPLAYER CO-FEEDING LOUNGE */}
            {activeSub === "cloud_lounges" && (
              <motion.div
                key="cloud_lounges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-amber-400 uppercase">System 3.7</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🪐 3.7 多人云端“吸宠”极光暧绒室及聊天大厅
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    倾听家长的彼此慰藉，不寂寞。支持开设加密群居吸猫房，多达10名宾客同时入座。支持全员在线给星宠 “云喂鱼”、 “喂奶嘴”；一键点击「集体投喂大礼花」，将在该房间所有同步客户机上，释放极其耀眼的五彩 stardust 大烟花爆炸！
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ACTIVE ROOM VIEW */}
                  <div className="p-4 bg-[#110c2c]/85 ring-1 ring-white/10 rounded-xl space-y-3 text-xs">
                    <span className="text-[10px] font-mono text-pink-300 font-bold block uppercase tracking-wider">
                      ★ Active Room: 天乐蒲公英温室 #1002 (9/10 在座)
                    </span>

                    {/* Chat Board */}
                    <div className="h-44 bg-black/60 rounded border border-slate-800 p-3 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2.5">
                      <div className="text-gray-500 text-[9px] text-center">--- 小屋创建密码锁定：已加入超距云共振加密 ---</div>
                      
                      <div className="flex gap-1.5 flex-col">
                        <span className="text-pink-300 font-bold">悠悠家长 🌇 (金毛家长)：</span>
                        <p className="text-gray-300 leading-relaxed bg-[#1b1540]/30 rounded-lg p-2">我家柴柴上星期也梦到了这个草莓海，大家一起加油！天乐好有灵气呀好可爱！</p>
                      </div>

                      <div className="flex gap-1.5 flex-col">
                        <span className="text-cyan-300 font-bold">小白妈妈 🐶 (比熊家长)：</span>
                        <p className="text-gray-300 leading-relaxed bg-[#1b1540]/30 rounded-lg p-2">看到它眨眼睛，眼框瞬间就红了，毛发一摆一摆的，跟它以前夏天吹风一模一样...</p>
                      </div>

                      <div className="flex gap-1.5 flex-col text-right">
                        <span className="text-amber-400 font-bold">我 (天乐守护人)：</span>
                        <p className="text-gray-200 leading-relaxed bg-indigo-900/30 rounded-lg p-2 text-left">刚刚给天乐喂了多维小银鱼，它大笑的时候尾巴摇得太可爱了，星环都大了一圈！</p>
                      </div>
                    </div>

                    {/* Chat form control */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="说点暖心话慰藉彼此..."
                        className="flex-1 bg-black/40 border border-slate-700 text-xs p-2 rounded focus:outline-none"
                        id="chat-input-field"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            playSound("click");
                            triggerToast("💬 群聊发言同步成功！多端家长正在阅览陪伴中...");
                            const input = e.target as HTMLInputElement;
                            input.value = "";
                          }
                        }}
                      />
                      <button
                        onClick={() => { playSound("click"); triggerToast("💬 群聊发言同步成功！"); }}
                        className="py-1.5 px-3 bg-[#fc407a] hover:bg-pink-600 rounded font-bold text-white text-xs cursor-pointer"
                      >
                        发送
                      </button>
                    </div>
                  </div>

                  {/* INTERACTIVE ACTIONS IN LOUNGE */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                    <span className="text-[10px] text-gray-400 font-mono block">ROOM ACTIONS</span>
                    
                    <div className="space-y-3.5">
                      <div className="p-3 bg-black/20 rounded border border-slate-800 hover:border-pink-500/30 transition-all flex justify-between items-center">
                        <div className="text-xs">
                          <span className="font-bold text-pink-300 block mb-0.5">🎆 全居室星光烟花 (Big Fireworks)</span>
                          <span className="text-[10px] text-gray-500 block">所有人屏幕同步绽放超新星炫彩星尘</span>
                        </div>
                        <button
                          onClick={() => {
                            playSound("sparkle");
                            triggerToast("🎉 全房同步！释放十朵巨大的 stardust 闪频云大礼花！");
                          }}
                          className="py-1 px-3 bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold rounded text-[9px] uppercase cursor-pointer"
                        >
                          集体投喂礼花 
                        </button>
                      </div>

                      <div className="p-3 bg-black/20 rounded border border-slate-800 hover:border-cyan-500/30 transition-all flex justify-between items-center">
                        <div className="text-xs">
                          <span className="font-bold text-cyan-300 block mb-0.5">🐟 集体云投喂 (Collective Feed)</span>
                          <span className="text-[10px] text-gray-500 block">多人连线同频投喂 30 串银鱼，饱腹度跃升</span>
                        </div>
                        <button
                          onClick={() => {
                            playSound("chime");
                            triggerToast("🍖 云投喂成功！所有家长屏幕里均落下了饱含爱意的彩虹银鱼串！");
                          }}
                          className="py-1 px-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded text-[9px] uppercase cursor-pointer"
                        >
                          在线投喂
                        </button>
                      </div>

                      <div className="p-3 bg-black/20 rounded border border-slate-800 text-[11px] leading-relaxed text-gray-400 font-mono">
                        <p className="font-semibold text-yellow-300">👥 当前在座家长：</p>
                        <p className="mt-1">喵汪柴柴 (1) • 悠悠小白犬 (3) • 金毛朵朵 (1) • 蒲公英语音官 (1) • 英短乳白天乐 (我) • 比熊悠悠...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER METRICS */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap justify-between items-center text-[10px] text-gray-500 font-mono">
          <span>AI 运算引擎: Gemini-3.5-Flash (离线规则级自适应双重保底)</span>
          <span>喵汪星云 (StarPuff) V2.6 全功能模拟套件</span>
        </div>
      </div>
    </div>
  );
}

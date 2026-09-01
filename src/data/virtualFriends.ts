/**
 * 虚拟 AI 好友统一数据源
 *
 * 单机版没有真实多用户后端，用一批本地模拟的"星友家长"充当平台用户，
 * 统一驱动：社区互动 / 信箱来信 / 好友列表 / 星门偶遇 / 每日心语社交。
 *
 * ⚠️ 本文件必须保持零运行时依赖、零 DOM/React 引用（只能 import type）：
 * socialPetPool.ts 经 esbuild 打进 dist/server.cjs，任何运行时 import 都会被拉进服务端。
 */

import type { PetType } from "../types";

export interface VirtualFriend {
  id: string;
  petName: string;
  type: PetType;
  ownerName: string; // 已收敛的唯一家长名（各处数据源一致）
  icon: string; // emoji 头像，离线安全
  primaryColor: string; // 头像底色 / 星门光点颜色
  breed?: string;
  size?: number; // 星门 canvas 体型，默认 9
  personalityTags: string[];
  greetingPool: string[]; // 好友页打招呼语
  postPool: string[]; // 社区发帖文案池
  letterPool: string[]; // 主动来信·问候/分享
  showcasePool: string[]; // 主动来信·晒宠物
}

/** 12 位虚拟星友：6 位收敛原有宠物池 + 6 位新增 */
export const VIRTUAL_FRIENDS: VirtualFriend[] = [
  {
    id: "vf_bamban", petName: "斑斑", type: "狗", ownerName: "默默的麻麻",
    icon: "🐶", primaryColor: "#e07a5f", breed: "中华田园犬", size: 10,
    personalityTags: ["温柔憨厚", "狂野打滚", "善解兔意"],
    greetingPool: [
      "汪汪！默默说极光树后头藏着一只跟它一样爱打滚的小家伙，是你吗？",
      "汪！你送我的那颗星星，我叠在窝里当夜灯啦～",
    ],
    postPool: [
      "今天在彗星跑道滚了一身星尘，像个毛茸茸的银河球，把默默逗笑了。",
      "我家默默的大脚印还印在彗尾跑道上，路过的星友说像一串小花瓣。",
    ],
    letterPool: [
      "晚上好呀，我是斑斑。今天默默又望着星空发呆，我在旁边打滚想逗它开心。",
      "斑斑想告诉你：星星再远，也够得着你的手心。",
    ],
    showcasePool: [
      "晒晒我今天捡到的星星碎片，像不像你家宝贝的毛球？",
      "看！默默给我编了条星云小围脖，可暖和啦～",
    ],
  },
  {
    id: "vf_liuxingtu", petName: "流星兔", type: "兔", ownerName: "雪糕麻麻",
    icon: "🐰", primaryColor: "#a2d2ff", breed: "安哥拉长毛兔", size: 9,
    personalityTags: ["干饭达人", "温顺乖巧", "粘人屁颠"],
    greetingPool: [
      "噗叽噗叽！你是新来的吧？来，抓一撮彗星粉尘当见面礼！⭐",
      "蹦蹦！听说你家的宝贝也爱啃星萝卜，是真的吗？",
    ],
    postPool: [
      "今天在织女星小镇啃了三根星萝卜，肚子圆滚滚的，雪糕麻麻笑得直不起腰。🥕",
      "流星兔说银河图书馆新进了一批会发光的书，它蹲在书页上晒太阳，像一团软软的云。",
    ],
    letterPool: [
      "家长好呀，我是流星兔！今天在彗尾跑道捡到一片会发光的叶子，想送给你家宝贝。",
      "雪糕麻麻说你是特别温柔的人，所以我忍不住写封信来打招呼啦！",
    ],
    showcasePool: [
      "晒晒今天的成果——一根比我还长的星萝卜！",
      "看，我给自己编了顶彗星小草帽，可神气啦！",
    ],
  },
  {
    id: "vf_miaoxiaojiu", petName: "喵小九", type: "猫", ownerName: "七七爸",
    icon: "🐱", primaryColor: "#ffd166", breed: "英短蓝猫", size: 9,
    personalityTags: ["傲娇舔毛", "高冷慵懒", "藏玩具高手"],
    greetingPool: [
      "喵嗷……你来了？本喵的星云鱼干可以分你半条，就半条。",
      "喵。听说你家的毛球很温柔？本喵勉为其难记住了。",
    ],
    postPool: [
      "今天又蹲在仙女座喷泉边发呆，一蹲一下午。七七爸说我跟以前在家看他做饭时一个样。",
      "新买的星纱玩具，本喵假装不喜欢，半夜偷偷叼走了。",
    ],
    letterPool: [
      "喵。本喵偶尔路过你们家宝贝的地盘，觉得它还算顺眼。就……打个招呼而已，别想太多。",
      "七七爸说你今天来看了我？哼，本喵只是顺路晒晒太阳罢了。",
    ],
    showcasePool: [
      "晒一下本喵的星纱玩具——才不是特意炫耀，只是恰好在镜头前。",
      "仙女座喷泉的水面映着本喵，还挺好看的。就……记录一下。",
    ],
  },
  {
    id: "vf_shandian", petName: "闪电青鸟", type: "鸟", ownerName: "小羽同学",
    icon: "🐤", primaryColor: "#560bad", breed: "玄凤鹦鹉", size: 8,
    personalityTags: ["社交恐怖", "歌声嘹亮", "爱蹭额头"],
    greetingPool: [
      "啾啾啾！听说你会唱《星光海》？来合个声！🎵",
      "啾！我是星云第一主唱闪电青鸟，很高兴认识你！",
    ],
    postPool: [
      "今天在猎户座森林开个人演唱会，把星尘都震得飘起来了。小羽同学说比它闹钟还响。",
      "新歌《极光圆舞曲》录制完成，唱高音时尾巴都在发光！",
    ],
    letterPool: [
      "啾啾！我写了首新歌《给远方家长的晚安》，今晚要在银河图书馆唱，你们家宝贝一定要来听哦！",
      "家长你好，我是闪电青鸟！听我主人说你是特别温柔的人，我忍不住飞过来送一段星光伴奏给你。啾！",
    ],
    showcasePool: [
      "晒晒新做的星光铃铛挂饰，飞起来叮叮当当，超好听！",
      "演唱会海报出炉啦，我可是精心排练了三整天！",
    ],
  },
  {
    id: "vf_bobo", petName: "波波熊", type: "其他", ownerName: "软糖妈妈",
    icon: "🐻", primaryColor: "#80ed99", size: 11,
    personalityTags: ["贪吃软萌", "憨厚黏人"],
    greetingPool: [
      "呼噜噜～你看起来软乎乎的，像棉花糖！认识一下吧！🧸",
      "嘿，软糖妈妈说你家的宝贝特别乖，我好想和它一起打滚！",
    ],
    postPool: [
      "今天在玫瑰星云公园滚成一团毛球，被三只小星宠当成了新玩具，我不生气，还笑得憨憨的。",
      "软糖妈妈给我缝了星星小背心，穿上走路都带风！",
    ],
    letterPool: [
      "呼噜噜～家长好，我是波波熊！听说你们家宝贝又乖又可爱，我好想和它一起在公园打滚呀！",
      "今天在星云里发现一块超软的云朵，趴在上面睡了一下午，想留一半给你们家宝贝当新窝！",
    ],
    showcasePool: [
      "晒晒我的星星小背心，软糖妈妈的手艺超棒！",
      "这块云朵软得能陷进去，推荐给你们家宝贝！",
    ],
  },
  {
    id: "vf_qianliang", petName: "千两小狗", type: "狗", ownerName: "千千妈妈",
    icon: "🐕", primaryColor: "#f4f1de", size: 10,
    personalityTags: ["活泼爱玩", "忠诚粘人"],
    greetingPool: [
      "汪汪汪！终于等到你啦！过来让我闻闻你是不是和星星一样香！🐕",
      "汪！千千妈妈说你家宝贝跑步超快，真的吗？来比一场！",
    ],
    postPool: [
      "今天在双子座沙滩追了一百次浪花，边追边叫，快乐得像只小马达。千千妈妈说我一点没变。",
      "新朋友介绍！我一秒就和别家的狗狗玩在一起了，社交能力满分！",
    ],
    letterPool: [
      "汪！家长好，我是千两小狗！听说你们家宝贝特别受欢迎，我也想和它当最好的朋友！",
      "今天在星云里遇到了你们家宝贝，它跑得真快！我追了好久才追上，玩得超开心！",
    ],
    showcasePool: [
      "晒晒今天追到的那颗最亮的流星！",
      "千千妈妈给我买了新项圈，闪闪的，好看吧？",
    ],
  },
  {
    id: "vf_naiyou", petName: "奶油", type: "猫", ownerName: "橘猫姐姐",
    icon: "🐱", primaryColor: "#F4A261", size: 9,
    personalityTags: ["温柔粘人", "干饭达人"],
    greetingPool: [
      "喵～你好呀，我叫奶油，你闻起来有星星奶香的味道！🍦",
      "橘猫姐姐说你家的宝贝很温柔，我最喜欢温柔的小家伙啦！",
    ],
    postPool: [
      "今天在双子座沙滩晒了一上午太阳，肚子饿得咕咕叫，橘猫姐姐说我永远吃不饱。🍦",
      "新玩具是一根会发光的逗猫棒，我追了一下午，把云都追散了一团。",
    ],
    letterPool: [
      "喵～家长好！我是奶油，听说你们家宝贝也爱晒太阳，改天我们一起去双子座沙滩吧！",
      "橘猫姐姐今天又念叨你家的宝贝了，说它一定很乖。我就写信来问问，要不要一起玩呀？",
    ],
    showcasePool: [
      "晒晒今天的大太阳——也晒晒我圆滚滚的肚子！",
      "新学会用尾巴比星星，看！",
    ],
  },
  {
    id: "vf_huajuan", petName: "花卷", type: "狗", ownerName: "柴柴爸",
    icon: "🐶", primaryColor: "#C08457", size: 10,
    personalityTags: ["活泼爱玩", "忠诚粘人"],
    greetingPool: [
      "汪汪！我是花卷！柴柴爸说你会来，我等你好久啦！尾巴已经摇成螺旋桨了！",
      "汪！你家的宝贝爱玩球吗？我藏了一颗会发光的星星球！",
    ],
    postPool: [
      "今天和柴柴爸在仙女座喷泉玩接球，我跳得老高，把喷泉的水花都接住了！",
      "我学会新技能啦——用鼻子顶星星球转三圈不掉！",
    ],
    letterPool: [
      "汪！家长好，我是花卷！今天看到你们家宝贝在公园跑，我追着跑了一圈又一圈，超开心！",
      "柴柴爸说你是好人，让我多跟你家宝贝玩。我保证，我会保护好它！",
    ],
    showcasePool: [
      "晒晒我的星星球，柴柴爸说这是星云里最亮的一颗！",
      "看我顶球绝技——三圈！不掉！",
    ],
  },
  {
    id: "vf_xueqiu", petName: "雪球", type: "兔", ownerName: "雪球外婆",
    icon: "🐰", primaryColor: "#E0FBFC", size: 8,
    personalityTags: ["温顺乖巧", "粘人屁颠"],
    greetingPool: [
      "吱…你好呀，我叫雪球，我有点害羞，但外婆说你是好人，让我跟你打个招呼。🤍",
      "外婆说你家宝贝像雪花一样温柔，是真的吗？",
    ],
    postPool: [
      "今天窝在雪球外婆织的云朵小窝里睡了一下午，醒来发现尾巴上沾了三颗星星。",
      "外婆给我梳了新毛，白得像刚下的雪，她说我是她的小雪团。",
    ],
    letterPool: [
      "家长你好呀，我是雪球……外婆说写信要抬头，我就写了。希望你家宝贝今天也开开心心的。",
      "今天在星云里看到你们家宝贝在晒太阳，我也跟着晒了一小会儿，感觉暖暖的。",
    ],
    showcasePool: [
      "晒晒外婆给我织的云朵小窝，好软好暖！",
      "今天的我，白得像一颗小星星！",
    ],
  },
  {
    id: "vf_buding", petName: "布丁", type: "仓鼠", ownerName: "布丁妈",
    icon: "🐹", primaryColor: "#F8EDEB", size: 7,
    personalityTags: ["贪吃软萌", "安静"],
    greetingPool: [
      "吱吱！我藏了一颗星光果仁，分你一半！🤍",
      "布丁妈说你家的宝贝很安静，我也喜欢安安静静地囤零食。",
    ],
    postPool: [
      "今天把一颗星星果仁滚回了窝，滚了整整一个下午，布丁妈说我是最执着的小仓鼠。",
      "新换的云朵垫子，我钻进去就不肯出来了，只露出一撮白毛。",
    ],
    letterPool: [
      "吱吱～家长好，我是布丁！我听说你们家宝贝也爱藏小零食，我们肯定能聊得来！",
      "今天捡到一颗特别闪的星尘果仁，想偷偷塞给你们家宝贝。不要说出去哦！",
    ],
    showcasePool: [
      "晒晒我攒的一小堆星光果仁——都是宝贝！",
      "这是我的云朵窝，布丁妈说我是全星云最软的小家伙！",
    ],
  },
  {
    id: "vf_jiumi", petName: "啾咪", type: "鸟", ownerName: "百灵鸟爸",
    icon: "🐦", primaryColor: "#A3B18A", size: 7,
    personalityTags: ["歌声嘹亮", "社交恐怖"],
    greetingPool: [
      "啾啾！新朋友！我刚刚写了一首欢迎歌，现在唱给你听！啾～（清嗓）",
      "嗨！我是啾咪，星云里最会唠嗑的小鸟，认识你太开心啦！",
    ],
    postPool: [
      "今天在银河图书馆门口开了场即兴演唱会，把排队的人都唱进去了，百灵鸟爸说我是社交小炸弹。",
      "新学会唱《星河小夜曲》的第三段，练了整整一天，嗓子都冒星光了！",
    ],
    letterPool: [
      "啾啾啾！家长你好！我是啾咪，我每天都会在星云里巡演，听说你家宝贝唱歌也很好听，改天我们对歌呀！",
      "今天看到你们家宝贝在听歌，我忍不住飞过去给它唱了一小段，它好像很喜欢！",
    ],
    showcasePool: [
      "晒晒我的新麦克风——其实就是一片会发光的叶子！",
      "演唱会纪念照！今天的我，闪闪发光！",
    ],
  },
  {
    id: "vf_zhima", petName: "芝麻", type: "猫", ownerName: "芝麻糊妈",
    icon: "🐱", primaryColor: "#9D8189", size: 9,
    personalityTags: ["傲娇高冷", "藏玩具高手"],
    greetingPool: [
      "喵……（上下打量）嗯，还可以。芝麻糊妈让我理你一下，我就理一下。",
      "喵。你是来参观本喵的领地的吗？参观费，半条星云鱼干。",
    ],
    postPool: [
      "今天把新玩具藏到了第七棵星云树后面，除了我没人找得到。这是本喵的骄傲。",
      "芝麻糊妈说我高冷，哼，她不懂。这叫贵族气质。",
    ],
    letterPool: [
      "喵。听说你家宝贝很会藏玩具？本喵这里有个玩具交换会，感兴趣就来。",
      "芝麻糊妈说你今天来过，本喵不在，不过……下次来带条鱼干，本喵可以考虑见你。",
    ],
    showcasePool: [
      "晒晒我藏玩具的第七棵星云树——才不告诉你位置。",
      "今天的我，依旧高冷，依旧好看。",
    ],
  },
];

/** 派生：每日心语社交池（socialPetPool 消费，server 端） */
export function toPlatformPets(): Array<{ name: string; type: string; ownerName: string; personalityTags: string[] }> {
  return VIRTUAL_FRIENDS.map(f => ({
    name: f.petName,
    type: f.type,
    ownerName: f.ownerName,
    personalityTags: f.personalityTags,
  }));
}

/** 派生：星门偶遇 bot（NebulaGateCanvas 消费） */
export function toBackendBots(): Array<{ name: string; type: PetType; primaryColor: string; size: number; ownerName: string }> {
  return VIRTUAL_FRIENDS.map(f => ({
    name: f.petName,
    type: f.type,
    primaryColor: f.primaryColor,
    size: f.size ?? 9,
    ownerName: f.ownerName,
  }));
}

/** 随机取 N 位不重复好友（excludeId 排除某位，防自匹配/防重复） */
export function pickFriends(count: number, excludeId?: string): VirtualFriend[] {
  const pool = excludeId ? VIRTUAL_FRIENDS.filter(f => f.id !== excludeId) : [...VIRTUAL_FRIENDS];
  const picked: VirtualFriend[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

/** 随机取 1 条文案 */
export function pickOne(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

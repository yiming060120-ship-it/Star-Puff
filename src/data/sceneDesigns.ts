export interface SceneDesign {
  overview: string;
  layers: string[];
  modeling: { title: string; desc: string[] }[];
  dynamics: string[];
  interactions: { element: string; trigger: string; function: string }[];
  petBehaviors: { location: string; action: string; duration: string; effect: string }[];
  prompt: string;
}

export const SCENE_DESIGNS: Record<string, SceneDesign> = {
  rose: {
    overview: "场景范围为 60m×60m 的开放公园。中央蜿蜒的花瓣形主步道（宽度3m），由发光花瓣纹理铺成，从入口延伸到中央喷泉。步道两侧错落分布20丛玫瑰花（每丛5-12朵，高度0.5m-2m不等）。场景入口处矗立4m高、6m宽的大型玫瑰拱门，藤蔓缠绕，花朵密集垂挂。右侧中央为直径8m的圆形星尘喷泉，拥有三层水流。5张星尘长椅散落分布在步道旁的树荫下。远景是巨大的玫瑰色星云，螺旋纹理缓慢流动，远处花田延伸到天际。",
    layers: [
      "远景层：巨大的玫瑰色星云，缓慢流动的螺旋纹理，远处延伸到天际的花田，带景深虚化。",
      "中远景层：高耸的开花乔木，树冠蓬松，外围低矮灌木丛。",
      "中景层：4m高的大型玫瑰拱门，直径8m的中央星尘喷泉，蜿蜒的发光花瓣主步道。",
      "近景层：步道旁高低错落的玫瑰花丛，带有木纹细节的星尘长椅，地面的发光草地与小野花。",
      "粒子层：全屏漂浮的粉色星尘粒子，喷泉溅起的半透明水花粒子，缓慢飘落的花瓣特效。"
    ],
    modeling: [
      { title: "玫瑰花", desc: ["6-8层花瓣，深粉至白色渐变，边缘自发光", "花心明黄色带点状高光，细微脉络纹理，蜡质光泽", "每朵花独立3秒循环开合动画，不同步"] },
      { title: "玫瑰拱门", desc: ["粗糙石头纹理基底，带苔藓细节", "藤蔓叶片脉络清晰，花簇顶部密集，下垂花串轻微摆动", "整体散发柔和粉色体积光"] },
      { title: "星尘喷泉", desc: ["三层磨砂星尘石底座，带有精细雕花", "半透明粉色发光水流，循环向上喷涌再落下", "池壁雕刻花纹，水面波纹反射，水花化为星尘飘散"] },
      { title: "花瓣步道", desc: ["嵌入花瓣形发光地砖，独立纹理，深浅排列自然", "步道边缘淡粉色发光线缓慢呼吸闪烁", "星尘草地材质，踩踏留有微弱光痕"] }
    ],
    dynamics: [
      "玫瑰花瓣：缓慢开合动画，3秒/循环，非同步",
      "喷泉水流：自下而上喷涌落下，循环往复",
      "步道发光线：2秒/次的柔和呼吸闪烁",
      "天空星云：极慢速的螺旋旋转流动"
    ],
    interactions: [
      { element: "玫瑰花丛", trigger: "所有花朵同时完全绽放，散发出15-20颗爱心形状星尘粒子，花瓣飘落加速，持续3秒后慢慢闭合", function: "纯视觉治愈交互；累计点击10次解锁「花匠」成就" },
      { element: "星尘喷泉", trigger: "喷泉高度翻倍，溅出范围扩大，散发大量彩色星尘，周围星宠向喷泉聚集", function: "触发星宠聚集事件，增加社交互动概率" },
      { element: "玫瑰拱门", trigger: "拱门发出明亮粉光，落下持续5秒的花瓣雨，全场景花瓣密度翻倍", function: "打卡功能，生成当前场景的宠物合影" },
      { element: "星尘长椅", trigger: "长椅发出微光，附近星宠跳上长椅趴下休息，尾巴轻轻摆动", function: "触发宠物休息动作，生成耳语事件素材" },
      { element: "步道地面", trigger: "点击位置生成一朵临时小玫瑰，从地面长出，3秒后消散为星尘", function: "纯趣味微交互" }
    ],
    petBehaviors: [
      { location: "花丛旁", action: "星宠主动靠近，低头闻花香，鼻子抽动", duration: "5-8秒", effect: "头顶冒出粉色爱心星尘" },
      { location: "喷泉边", action: "站在水池边缘，用爪子玩水，尾巴摆动", duration: "3-5秒", effect: "溅起小水花粒子" },
      { location: "长椅上", action: "跳上长椅趴下休息，眼睛半闭，偶尔轻轻摇尾巴", duration: "10-15秒", effect: "无" },
      { location: "步道上", action: "缓慢行走，遇到同伴时停下互相蹭头打招呼", duration: "短暂", effect: "触发粉色光带社交特效" }
    ],
    prompt: "3D next-gen game environment, Unreal Engine 5 render, Rose Nebula Park. 60x60m open park, meandering glowing petal path, highly detailed 3D rose bushes with translucent self-illuminating edges and sub-surface scattering. Large stone archway covered in glowing vines and hanging roses. 8m wide 3-tier frosted stone fountain cascading glowing pink translucent water. Soft diffuse celestial lighting, volumetric pink god rays (Tyndall effect). Floating stardust particles (0.1-0.5cm), depth of field, 8K textures, low saturation pastel pink and indigo color palette, cozy healing atmospheric cosmic vibe. No hard shadows."
  },
  vega: {
    overview: "场景范围为50m×50m的山坡小镇。中央星尘石板路从山脚延伸至山顶广场，路面带有坡度。山坡错落分布8栋圆顶星尘小屋，窗户透出暖黄色灯光。左侧山顶耸立3层高的星尘灯塔，塔顶旋转光束缓慢扫过全景。右侧山脚为「星尘面包店」，挂有铃铛招牌及发光橱窗。山顶中央的小镇广场摆放2张木质方桌与4把椅子。周围点缀12棵发光像素树（树叶蓝紫，树干深紫）。远景为深紫色夜空，布满闪烁星星及连绵的暖紫色渐变星尘山丘。",
    layers: [
      "远景层：深紫色夜空，闪烁星星，暖紫色连绵的星尘山丘轮廓，带景深虚化。",
      "中远景层：错落分布的深紫色发光树木，山坡后方的地形起伏。",
      "中景层：8栋圆顶星尘小屋，3层高星尘灯塔，星尘面包店，山顶中央小镇广场。",
      "近景层：带有磨损痕迹的发光石板路，路灯，木质桌椅及台灯，低矮草丛与石头。",
      "粒子层：小镇上空缓慢漂浮的微小星尘粒子，小屋烟囱冒出的星尘烟雾。"
    ],
    modeling: [
      { title: "星尘小屋", desc: ["半透明深蓝色星尘质感墙壁，可隐约看见内部轮廓", "紫色瓦片屋顶带有苔藓，暖黄色发光方窗带有木框细节", "木质门带把手与小台阶，屋顶烟囱持续冒出星尘烟雾"] },
      { title: "星尘灯塔", desc: ["3层石质纹理圆柱塔身，带有砖块拼接与风化痕迹", "顶部玻璃金属灯室，内置旋转光源射出暖黄色体积光束（30秒/圈）"] },
      { title: "面包店", desc: ["一层半宽体结构，木质铃铛招牌", "大橱窗展示5-6种带暖光的精细面包模型（法棍、牛角包等）"] },
      { title: "石板路与广场", desc: ["方形石板错落，缝隙带微光，表面有磨损与脚印痕迹", "每隔5m带有暖光路灯，广场中心带放射状花纹及木质桌椅（带使用痕迹）"] }
    ],
    dynamics: [
      "灯塔光束：30秒/圈的缓慢旋转扫射体积光",
      "小屋窗帘：偶尔触发的拉动动画",
      "屋顶烟囱：持续向上飘散的星尘烟雾",
      "发光树叶：蓝紫色叶片的微弱呼吸闪烁"
    ],
    interactions: [
      { element: "面包店招牌", trigger: "铃铛晃动发声，门口冒出热气星尘，橱窗面包变亮，弹出菜单", function: "零食购买入口，消耗星尘币恢复对话次数" },
      { element: "灯塔塔顶", trigger: "光束旋转翻倍，亮度提升，全景被暖光照亮2秒", function: "场景氛围交互，打卡合影" },
      { element: "小屋窗户", trigger: "灯光闪烁3次，窗帘拉开见模糊星尘影子走动，2秒后拉上", function: "纯趣味微交互" },
      { element: "广场桌椅", trigger: "饮品冒出热气，台灯变亮，附近星宠走来坐下", function: "触发星宠休息动作" },
      { element: "路灯", trigger: "亮度翻倍，周围一圈路灯依次亮起（传灯效果）", function: "纯氛围交互" }
    ],
    petBehaviors: [
      { location: "面包店门口", action: "坐下抬头看向橱窗，尾巴摇动，仿佛等面包出炉", duration: "5-10秒", effect: "无" },
      { location: "广场区域", action: "慢悠悠散步，或趴在桌边打盹", duration: "8-12秒", effect: "闭眼打盹动画" },
      { location: "石板路上", action: "沿路闲逛，东张西望，遇同伴打招呼", duration: "短暂", effect: "社交光效" },
      { location: "灯塔下", action: "抬头看旋转光束，歪头好奇", duration: "3-5秒", effect: "无" }
    ],
    prompt: "3D next-gen game environment, Unreal Engine 5 render, Vega Town. 50x50m hillside town, domed translucent deep-blue stardust cabins with purple tiled roofs and warm yellow glowing windows. 3-story stone lighthouse sweeping volumetric warm god rays. Cozy bakery with detailed glowing bread models in the window. Stardust cobblestone path with wear-and-tear textures. Glowing blue-purple trees. Soft diffuse celestial lighting, glowing floating stardust particles (0.1-0.5cm), 8K textures, depth of field. Low saturation pastel indigo and warm yellow color palette, cinematic cozy healing vibe. No hard shadows."
  },
  comet: {
    overview: "场景范围为直径80m的环形跑道。主体环形发光跑道宽8m，表面呈现彗星尾迹质感（深蓝至亮白渐变），附带极速流动光效。起点处悬浮着立体的「3、2、1」数字倒计时牌和发光起跑线。跑道沿途均匀设立4个巨大的发光加速环。周边悬浮20颗表面坑洼、缓慢自转的深灰色小行星/陨石。内侧为草坪状星尘地面，点缀发光石块。远景是深邃宇宙，布满快速向后流动的速度线粒子，天空中可见缓慢旋转的星云漩涡与每隔10秒划过的流星。",
    layers: [
      "远景层：深邃宇宙背景，缓慢旋转的星云漩涡，快速划过的流星，向后流动的速度线。",
      "中远景层：悬浮在跑道周围的20颗坑洼陨石与小行星，高低远近错落。",
      "中景层：8m宽的环形发光跑道，悬浮数字倒计时牌，4个多层结构的巨大发光加速环。",
      "近景层：跑道内侧的发光草坪，点缀的星尘石块和低矮植物，跑道边缘呼吸闪烁的光带。",
      "粒子层：全屏飞速向后流动的速度线粒子，跑道表面的流动流光。"
    ],
    modeling: [
      { title: "彗星跑道", desc: ["半透明发光材质，中心亮白边缘深蓝，附带明显的流线型速度纹理", "跑道边缘蓝白光带持续呼吸闪烁，表面有凝固星尘的颗粒感，带微弱起伏"] },
      { title: "加速环", desc: ["直径5m圆形发光环，亮蓝色多层结构", "内部有旋转的光线与能量流粒子，底部设有金属质感支架"] },
      { title: "小行星/陨石", desc: ["不规则形状，表面覆盖高精度陨石坑、裂缝与环形山细节", "深灰色带紫调，不同部位明暗交替，每颗具备不同转速的自转动画（10-20秒/圈）"] },
      { title: "起跑线", desc: ["白蓝渐变的发光起跑线，带有扫描线流动动画", "悬浮立体数字牌带有放大发光效果，旁边设有发令台小旗帜"] }
    ],
    dynamics: [
      "跑道流光：沿跑道方向高速流动的材质UV动画",
      "陨石自转：每颗10-20秒的缓慢独立旋转",
      "速度线粒子：背景中持续向后拉伸飞速流动的线条",
      "流星划过：每8-12秒斜向划拉过的带长尾流星"
    ],
    interactions: [
      { element: "起跑线", trigger: "触发 3-2-1-GO 倒计时，所有星宠开始竞速，速度线密度翻倍", function: "赛跑小游戏，第一名获50星尘币" },
      { element: "加速环", trigger: "加速环爆闪强光，下一只穿过的宠物速度翻倍且拖尾变长", function: "竞速辅助道具交互" },
      { element: "流星", trigger: "流星转向砸向跑道，爆炸成大片彩色星尘粒子", function: "纯视觉特效交互" },
      { element: "小行星", trigger: "轻微晃动，表面散发星尘粒子（模拟撞击）", function: "趣味互动" },
      { element: "跑道地面", trigger: "生成临时发光箭头加速道具，宠物踩踏后提速2秒", function: "微观干预辅助交互" }
    ],
    petBehaviors: [
      { location: "跑道主体", action: "沿跑道奔跑互相追逐，超过时触发蓝色光带，身后带星尘拖尾", duration: "持续", effect: "加速光带与拖尾特效" },
      { location: "加速环处", action: "主动穿过加速环，身体发光，速度加快尾巴翘起", duration: "瞬间", effect: "爆发提速光效" },
      { location: "起跑线附近", action: "无比赛时在起点来回走动，嗅闻地面做热身", duration: "随机", effect: "无" },
      { location: "内侧草坪", action: "跑累后停下趴在草坪喘气，休息后重返跑道", duration: "10秒", effect: "喘气动画" }
    ],
    prompt: "3D next-gen game environment, Unreal Engine 5 render, Comet Track. 80m diameter glowing circular track in deep space, 8m wide with comet tail flowing gradient texture (bright white to deep blue). 4 massive futuristic glowing blue boost rings. 20 highly detailed rocky asteroids with craters slowly rotating in the background. Suspended holographic 3-2-1 countdown sign. Inner grassy stardust terrain. Dynamic background with high-speed flowing light trails and shooting stars. Soft diffuse celestial lighting, volumetric glow, glowing floating stardust particles. 8K textures, depth of field. Dynamic, energetic cosmic racing vibe. No hard shadows."
  },
  library: {
    overview: "场景范围为40m×40m的圆形图书馆内部。四周被8层高的深棕色木质螺旋书架包围，书架直达星空穹顶，每层摆满独立建模的发光书籍。中央为直径15m的悬空圆形阅读平台，通过发光的螺旋悬浮楼梯相连。平台中央放置着大型星尘书桌（长3m），桌上配有翻开的星尘大书、羽毛笔、墨水瓶和摇曳的烛台，旁边是深紫色的布艺高背椅。约30只米粒大小的“书虫”（发光小生物）在书架间慢悠悠飞舞。顶部是缓慢旋转的螺旋状银河，底部弥漫着厚重的半透明星尘雾气。",
    layers: [
      "远景层：穹顶流动的螺旋状银河，密集星星缓慢闪烁。",
      "中远景层：螺旋上升直达穹顶的8层巨型木质书架，上半部分带强烈景深虚化。",
      "中景层：直径15m的悬空半透明阅读平台，发光的螺旋悬浮楼梯。",
      "近景层：中央星尘大书桌，高背椅，桌上细节（羽毛笔、墨水瓶、发光书籍、烛台）。",
      "粒子层：底部浓郁的半透明星尘雾气，在空中飞舞的30只发光书虫小生物。"
    ],
    modeling: [
      { title: "多层螺旋书架", desc: ["深棕色高精度木纹，每层带有古典雕花细节，螺旋上升", "数以千计独立建模的书籍，书脊带模糊星尘文字与各色微光，部分倾斜放置"] },
      { title: "中央大书桌与文具", desc: ["带有使用痕迹与磨损的深棕色木桌，桌角雕花", "桌面大书缓慢翻页（星尘文字纹理），羽毛笔细节逼真，烛台火焰带体积光"] },
      { title: "悬浮楼梯与平台", desc: ["台阶为发光石质，独立悬浮且螺旋上升，带有呼吸闪烁", "阅读平台半透明星尘质感，底部带有悬浮光效浮动，边缘设发光栏杆"] },
      { title: "发光书虫", desc: ["米粒大小的发光实体，带有高速扇动的小翅膀，散发暖黄色微光"] }
    ],
    dynamics: [
      "悬浮平台：极其缓慢的上下浮动动画",
      "桌面大书：书页自动缓慢翻动的物理动画",
      "顶部银河：宏大的极慢速螺旋旋转",
      "书虫飞行：不规则的上下飘动，忽明忽暗"
    ],
    interactions: [
      { element: "书架书籍", trigger: "书籍发柔光浮起，翻开悬浮展示书页，2秒后合上归位", function: "氛围交互，强化静谧感" },
      { element: "中央大书", trigger: "书本完全翻开，页面亮起，弹出UI界面", function: "「记忆日记」入口（查看宠物成长/耳语）" },
      { element: "书虫", trigger: "书虫加速飞行留出金轨，吸引附近书虫聚集成团后散开", function: "趣味互动" },
      { element: "悬浮楼梯", trigger: "台阶从下至上依次亮起循环，光带上升", function: "引导视觉的氛围交互" },
      { element: "顶部银河", trigger: "一颗流星拖尾坠落到书架，化为一本发光新书", function: "隐秘彩蛋" }
    ],
    petBehaviors: [
      { location: "书桌旁", action: "安静趴在椅子旁或书桌脚下，闭眼轻摇尾巴", duration: "10-15秒", effect: "无" },
      { location: "书架底层", action: "用鼻子拱底层书籍，书本微微晃动", duration: "3-5秒", effect: "书籍物理晃动" },
      { location: "阅读平台上", action: "脚步放轻缓慢走动，偶尔停下抬头仰望书架", duration: "持续", effect: "无" },
      { location: "书虫旁", action: "抬头追随书虫移动，脑袋跟着转动", duration: "5秒", effect: "无" }
    ],
    prompt: "3D next-gen game environment, Unreal Engine 5 render, Galaxy Library interior. 40x40m circular majestic library, 8-story deep brown wooden spiraling bookshelves filled with thousands of individually modeled glowing books. 15m suspended translucent stardust reading platform in the center with glowing floating stairs. Large detailed wooden desk with open glowing magic book, quill, ink, and flickering candle. Deep purple fabric high-back chair. Majestic swirling galaxy and stars on the ceiling. Thick translucent stardust fog at the bottom. Glowing bookworm bugs flying. Soft diffuse celestial lighting, warm volumetric god rays. 8K textures, wood grain, depth of field. Low saturation, mysterious, quiet and healing academic cosmic vibe. No hard shadows."
  },
  gemini: {
    overview: "场景范围为60m×40m的新月形沙滩。前景是闪闪发光的金色星尘沙粒，具有自然的沙丘起伏与脚印纹理。前方是一片紫色的星海，海浪循环拍岸，浪花呈现白色星尘质感。海面上漂浮着两座大小、形状完全对称的双子小岛，岛上各有一棵对称弯曲的棕榈树。沙滩上散落着15个不同造型、散发微光的星尘贝壳。左侧设有蓝白条纹遮阳伞和浅棕色布艺躺椅，右侧建有一座带露台的沙滩小木屋。天空中悬挂着两个对称的双子太阳，散发橙紫柔光，海面偶尔有半透明星尘海豚跃出。",
    layers: [
      "远景层：粉紫色渐变天空，两颗对称的双子太阳，海天交界处的景深虚化。",
      "中远景层：两座完全对称的双子小岛（带草地、白色沙滩与棕榈树），跃出的星尘海豚。",
      "中景层：带有横向波纹与涨落动画的紫色星海，白色星尘浪花边缘。",
      "近景层：金色星尘沙滩，遮阳伞与躺椅，带露台的小木屋，散落的发光星尘贝壳。",
      "粒子层：海浪拍岸溅起的星尘水花，全屏缓慢漂浮的金色微小星尘粒子。"
    ],
    modeling: [
      { title: "金色沙滩与星海", desc: ["沙粒为细碎金色高光像素点，带有沙丘起伏、脚印及海浪冲刷的湿润反光痕迹", "海水从深紫到浅紫渐变，表面具备真实的波纹反射（倒映太阳与天空），白色星尘浪花包含细腻泡沫线"] },
      { title: "双子小岛", desc: ["绝对对称的两座微型岛屿，覆盖细腻草地", "棕榈树干弯曲角度对称，树叶随风摆动方向相反，边缘环绕礁石与浪花"] },
      { title: "星尘贝壳", desc: ["螺旋、扇形、海螺等多种高精模型，表面附带细腻珠光纹理", "开合动画展示内部的自发光高光珍珠，带有柔和光晕"] },
      { title: "休闲设施与木屋", desc: ["蓝白条纹木杆遮阳伞（微风摆动），带有凹陷使用痕迹的布艺躺椅", "精细木纹材质的带露台小木屋，窗户透出暖光"] }
    ],
    dynamics: [
      "星海波涛：横向波纹循环与浪花拍岸的涨落物理动画",
      "双子太阳：天空倒影在水面的波光粼粼晃动",
      "海豚跃出：每15-20秒随机位置跃出水面的划轨动画",
      "棕榈与遮阳伞：受到统一微风场影响的轻柔摆动"
    ],
    interactions: [
      { element: "海水区域", trigger: "溅起星尘水花，生成涟漪向外扩散，浪花变大", function: "纯视觉互动体验" },
      { element: "沙滩贝壳", trigger: "缓慢打开露出珍珠，珍珠发光晕，3秒后闭合", function: "收集彩蛋，集齐7种解锁「收藏家」成就" },
      { element: "双子小岛", trigger: "两岛同时亮起，中间生成包含流光粒子的彩虹色光桥，持续5秒", function: "核心打卡交互，生成合影" },
      { element: "沙滩地面", trigger: "出现小沙坑并溅起沙粒粒子，3秒后平整恢复", function: "模拟刨沙趣味交互" },
      { element: "木屋门", trigger: "门打开透出暖光，展示模糊室内轮廓后关门", function: "氛围交互" }
    ],
    petBehaviors: [
      { location: "海边浅滩", action: "追着浪花跑，浪退跟进浪来后退，来回跑动", duration: "8-10秒", effect: "脚底溅起细微水花" },
      { location: "沙滩上", action: "用爪子刨沙子，刨出小坑", duration: "5秒", effect: "沙粒星尘飞溅" },
      { location: "贝壳旁", action: "用鼻子碰贝壳，贝壳打开时吓一跳往后退", duration: "瞬间", effect: "受惊吓动画" },
      { location: "躺椅旁", action: "趴在躺椅旁的沙地上晒太阳，眼睛半闭", duration: "10-15秒", effect: "无" }
    ],
    prompt: "3D next-gen game environment, Unreal Engine 5 render, Gemini Beach. 60x40m crescent beach with sparkling golden stardust sand, dunes and footprint textures. Purple glowing ocean with horizontal ripples and white stardust waves crashing on shore. Two perfectly symmetrical islands with mirroring palm trees. Highly detailed seashells with pearl glow scattered on sand. Blue and white striped beach umbrella, fabric lounge chair. Wooden beach cabin with warm glowing windows. Two symmetrical glowing suns in a pastel pink-purple sky. Soft diffuse lighting, volumetric glow, floating golden particles. 8K textures, depth of field. Relaxing, symmetrical cosmic vacation vibe. No hard shadows."
  },
  andromeda: {
    overview: "场景范围为50m×50m的圆形广场，是宏大且浪漫的核心社交区。中央矗立总高12m的四层大型星雕喷泉，各层水流颜色（深蓝、紫、粉紫、粉白）向上递进且越发纤细。底层水池直径20m，水面平静倒映着喷泉，漂浮12朵缓慢开合的星尘莲花。广场地面由发光石砖铺设出放射状的马赛克星座图案。广场边缘环绕12根古典多立克石柱，柱身缠绕发光藤蔓，柱顶燃烧永不熄灭的星尘火焰。远景是极其巨大且清晰的仙女座螺旋星云，星星密度极高，带来强烈的视觉震撼。",
    layers: [
      "远景层：巨大的仙女座螺旋星云，清晰的旋臂结构，极高密度的璀璨星空背景。",
      "中远景层：广场外围的阶梯与高层平台轮廓。",
      "中景层：12根带有藤蔓和火焰的古典石柱，直径20m的底层大水池。",
      "近景层：12m高的四层星尘喷泉主体，发光放射状石砖广场地面，漂浮的星尘莲花。",
      "粒子层：全场景极高密度的漂浮星尘（密度提升50%），喷泉四层溅射的巨量彩色水花粒子。"
    ],
    modeling: [
      { title: "四层大型喷泉", desc: ["极高精度的石雕主体，各层带有繁复雕花，顶端设有一颗高亮星珠", "水流为半透明发光星尘质感，带体积光与真实流体动力学喷射动画（每层颜色递变）"] },
      { title: "星尘莲花与水池", desc: ["莲花多层花瓣渐变，中心含金色发光花蕊，独立5秒循环开合动画", "池壁带雕纹，水面物理反射倒影清晰，微风波纹渲染逼真"] },
      { title: "古典石柱", desc: ["多立克柱式，深灰石质带有风化凹槽，柱头柱基精雕", "藤蔓发光叶片紧贴柱身，顶端暖黄色星尘火焰带摇曳动画与光晕"] },
      { title: "广场放射地面", desc: ["石砖马赛克拼接星座图案，砖缝嵌入微光材质，材质带有磨砂反光感"] }
    ],
    dynamics: [
      "仙女座星云：占据半边天的宏大螺旋极慢速旋转",
      "喷泉水流：四层复合流体特效，飞溅回落循环",
      "石柱火焰：顶端12团星尘火焰的真实摇曳",
      "星尘莲花：水面漂浮游动与花瓣缓慢开合"
    ],
    interactions: [
      { element: "喷泉中心", trigger: "喷射高度翻倍，散发巨量彩色星尘，全景星尘密度翻倍，持续5秒", function: "核心奇观展现，强制触发全场景宠物向广场聚集" },
      { element: "星尘莲花", trigger: "莲花完全绽放，中心升起发光许愿星，弹出许愿界面", function: "「许愿」功能入口，生成对应的系统记录" },
      { element: "石柱火焰", trigger: "火焰爆旺，藤蔓全亮，12根石柱依次传递点亮一圈", function: "极具仪式感的视觉特效互动" },
      { element: "水池水面", trigger: "生成动态涟漪，周围莲花与水面倒影随波纹物理晃动", function: "流体物理交互" },
      { element: "广场地面", trigger: "亮起星尘光环沿马赛克纹理向外扩散，2秒后消散", function: "地表光带氛围交互" }
    ],
    petBehaviors: [
      { location: "喷泉边缘", action: "围着喷泉转圈狂奔，追逐落下的水花，尾巴高翘", duration: "持续活跃", effect: "欢快的步伐光尘" },
      { location: "广场区域", action: "多只星宠大规模聚集，互相追逐打闹", duration: "高频触发", effect: "密集的社交光带特效" },
      { location: "水池边", action: "低头喝水，抬起头用力甩脸上的水", duration: "3-5秒", effect: "甩出水花粒子" },
      { location: "石柱旁", action: "趴在石柱底部休息，抬头呆看顶部火焰", duration: "5-8秒", effect: "无" }
    ],
    prompt: "3D next-gen game environment, Unreal Engine 5 render, Andromeda Fountain plaza. 50x50m magnificent circular stone plaza with radiating glowing mosaic brick patterns. Epic 12m high 4-tier intricately carved stone fountain cascading glowing translucent water (blue, purple, pink-white transitions) with realistic fluid dynamics. 20m pool reflecting the sky, 12 glowing blooming stardust lotuses. Surrounded by 12 classical Doric pillars wrapped in glowing vines, topped with eternal stardust fire. Monumental Andromeda spiral galaxy in the majestic starry background. Soft diffuse celestial lighting, intense volumetric god rays. Extremely high density of floating stardust particles (0.1-0.5cm). 8K textures, depth of field. Majestic, grand, romantic cosmic festival vibe. No hard shadows."
  },
  orion: {
    overview: "场景范围为60m×60m的深邃发光森林。场景内树木高大挺拔，包含针叶与阔叶树种，树干深紫，树冠呈现蓝绿色的生物发光。地面覆盖着散发绿蓝色微光的苔藓与草丛。一条蜿蜒的「蘑菇小径」贯穿森林，由各色伞状发光蘑菇组成。几棵参天大树间悬挂着深绿色的星尘藤蔓，垂坠着金黄色发光果实。森林深处大树根部有一个透出神秘蓝光的半圆形树洞。林间弥漫着厚重的底部星尘雾气，约50只忽明忽暗的黄色萤火虫在空中游荡。透过树冠缝隙，可清晰仰望夜空中标志性的猎户座腰带三星。",
    layers: [
      "远景层：树冠缝隙透出的猎户座三星夜空，森林深处浓郁的雾气遮蔽。",
      "中远景层：高低错落的高大生物发光树木群，营造强烈的森林纵深感。",
      "中景层：贯穿地表的发光蘑菇小径，大树间悬挂的藤蔓与金黄果实，神秘树洞。",
      "近景层：地面覆盖的发光苔藓、高低起伏的草丛与小野花，粗壮裸露的树根。",
      "粒子层：林间半透明流动的地表雾气，50只游荡的黄色发光萤火虫实体。"
    ],
    modeling: [
      { title: "发光树木与树洞", desc: ["高精度深紫色树干，附带树皮裂纹与苔藓细节，裸露粗壮树根", "蓝绿色发光叶片构成的蓬松树冠，树根部半圆形树洞透出深邃蓝光光晕"] },
      { title: "蘑菇小径", desc: ["高低错落的多彩伞状蘑菇（橙黄蓝紫红），伞盖自发光且带菌褶细节，白色菌柄纹理真实"] },
      { title: "发光苔藓与植物", desc: ["地面细碎高精苔藓材质，随呼吸缓慢变化亮度的绿光", "不同高度的草叶细节与各色点缀野花"] },
      { title: "藤蔓与果实", desc: ["深绿叶片藤蔓，垂挂带高光的金黄色圆形果实", "果实附带微风摆动物理动画，成熟度颜色不一"] }
    ],
    dynamics: [
      "萤火虫：缓慢不规则的三维游动轨迹，忽明忽暗的光效",
      "森林雾气：地表具有体积感的雾气缓慢平移流淌",
      "发光植物：苔藓与树冠极慢速的生物呼吸发光",
      "果实藤蔓：受微风影响的自然悬垂摇摆"
    ],
    interactions: [
      { element: "发光蘑菇", trigger: "点击处蘑菇亮度翻倍，周围蘑菇像信号传递般依次亮起沿小路循环一圈", function: "森林特有的生态链视觉交互" },
      { element: "神秘树洞", trigger: "蓝光爆亮，从洞内飘出10颗星星，弹出探险界面", function: "「森林寻宝」小游戏入口（每日1次获币/装扮）" },
      { element: "萤火虫", trigger: "加速飞舞划出金轨，吸引附近萤火虫聚团后散开", function: "趣味昆虫互动" },
      { element: "发光果实", trigger: "果实脱落砸向地面，摔碎迸发出大量金色星尘粒子", function: "环境彩蛋" },
      { element: "地面苔藓", trigger: "点击位置留下发光脚印纹理，3秒后缓慢消散", function: "模拟物理踩踏交互" }
    ],
    petBehaviors: [
      { location: "蘑菇小径上", action: "沿路缓慢散步，走走停停，低头东闻西嗅", duration: "持续", effect: "无" },
      { location: "树洞前", action: "好奇蹲在洞口往里张望，用前爪轻轻扒拉洞口边缘", duration: "5-8秒", effect: "无" },
      { location: "草丛里", action: "原地起跳扑捉空中的萤火虫，扑空后歪头疑惑", duration: "8-12秒", effect: "萤火虫受惊四散" },
      { location: "大树下", action: "躲在粗壮树根的阴影里安静趴下睡觉", duration: "长时", effect: "闭眼呼吸动画" }
    ],
    prompt: "3D next-gen game environment, Unreal Engine 5 render, Orion Forest. 60x60m deep mystical forest. Towering trees with deep purple trunks, detailed bark, and bioluminescent blue-green glowing canopies. Winding path made of multi-colored glowing glowing mushrooms with intricate gills. Ground covered in soft glowing green-blue moss, ferns, and thick exposed tree roots. Glowing golden round fruits hanging from dark green vines. Mysterious glowing blue tree hollow at the base of a massive tree. Thick translucent volumetric stardust fog rolling on the ground. 50 glowing yellow fireflies floating erratically. Night sky peeking through canopy showing Orion's belt. Soft diffuse lighting, highly detailed 8K textures, depth of field. Mysterious, quiet, natural healing cosmic vibe. No hard shadows."
  }
};

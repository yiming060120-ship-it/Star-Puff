# 星云之门 - 七大场景深度玩法设计文档

## 【玫瑰星云公园】
一、场景核心定位
种花养花的休闲养成玩法，融合社交与轻度经营的浪漫治愈花园。

二、核心功能模块详解
1. **我的花园（核心玩法）**：玩家拥有3×3格私人花圃（可升至5×5），种植星尘花（玫瑰/百合/星云花/彩虹玫瑰）。不同种子生长周期与收益不同。包含浇水、施肥、除虫操作，成熟后采摘收获。
2. **花语许愿池**：投入自种花卉许愿，7天后推送AI耳语。不同花种对应不同愿望主题（爱情/健康/事业）。
3. **花瓣雨收集小游戏**：每日12:00、18:00、21:00定时触发花瓣雨，点击收集花瓣兑换道具，宠物心情值影响收集效率。
4. **花束制作工坊**：9朵花合成1束，赠送好友增加亲密度与特殊增益（心情/体力/专属对话框）。

三、场景内UI布局
- 左上角：花匠等级、当前星尘币、花瓣数量
- 右上角：花瓣雨倒计时预告、好友互动入口
- 底部：背包（种子/道具/花束）、快捷工具栏（浇水/施肥/采摘）
- 弹窗：许愿池输入面板、花圃升级确认框、合成工坊面板

四、数值与进度系统
- 等级体系：花匠等级（决定花圃上限和高级种子解锁）
- 货币与奖励：星尘币用于购买种子/扩建；花瓣兑换特殊装饰
- 每日限制：免费种子每日3颗，浇水/施肥每日限3次

五、3D交互细节
- 种植时，种子以抛物线落入土壤，伴随星光尘埃；浇水时水壶倾倒出晶莹的发光水滴。
- 花瓣雨期间，开启屏幕空间深度模糊（DOF），物理引擎驱动花瓣随重力飘落，宠物会上蹿下跳抓花瓣。
- 许愿时水池中心泛起巨大的全息花朵投影。

六、成就系统表
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 初级花匠 | 种出第一朵花 | 100星尘币 |
| 园艺大师 | 花圃升到5×5 | 专属花圃装饰 |
| 花瓣收藏家 | 收集1000片花瓣 | 彩虹玫瑰种子×1 |
| 许愿达人 | 许下100个愿望 | 专属称号「许愿者」 |
| 社交花蝴蝶 | 送出50束花 | 专属头像框 |

七、场景生成Prompt
`A highly detailed 3D isometric view of a magical botanical garden in space, "Rose Nebula Park", featuring a 3x3 grid glowing flower bed with blooming luminescent roses and lilies. In the center, a majestic classic stone wishing well fountain glowing with stardust water. A rustic wooden crafting workbench in the corner with tied glowing flower bouquets. Ethereal petal rain falling from the sky. Cinematic volumetric lighting, ray tracing, Unreal Engine 5 style, pastel pink and deep purple cosmic background, cozy and healing atmosphere, highly detailed textures, tilt-shift lens. --ar 16:9 --v 6.0`

---

## 【织女星小镇】
一、场景核心定位
模拟宠物小镇生活，包含经营、装修购物与全天候生活规律的沉浸式社区。

二、核心功能模块详解
1. **星尘面包店（经营玩法）**：从摊位升级至连锁店，每日制作基础面包、牛角包、星云蛋糕，挂机自动售卖赚取星尘币。每日刷新热门高价面包。
2. **宠物公寓系统**：租赁并装修房间（北欧/复古/星云风家具），宠物在此产生独立生活行为（睡/吃/玩），可邀请好友宠物串门。
3. **小镇任务板**：每日5个随机任务（送货/寻物/帮忙/收集），完成后获得声望。
4. **昼夜交替系统**：24小时真实昼夜循环，不同时间段NPC行为与场景光照改变（清晨排队、夜晚流星），触发专属事件。

三、场景内UI布局
- 左上角：面包店等级、小镇声望值
- 右上角：小镇实时时钟（带有昼夜图标）、任务板快捷追踪
- 底部：店铺管理面板、公寓装修（家具背包）
- 弹窗：顾客交易记录、家具购买商城、任务交付详情

四、数值与进度系统
- 等级体系：店铺等级（摊位→大店），小镇声望等级
- 货币与奖励：星尘币（买家具/原料），声望值（解锁新区域）
- 每日限制：面包烤箱栏位限制，每日最多接5个任务

五、3D交互细节
- 面包出炉时会有热气腾腾的粒子特效和烘焙音效；
- 昼夜切换时光照平滑过渡，夜晚路灯与店铺招牌会有霓虹闪烁的启动动画；
- 装修房间时采用网格吸附（Grid Snapping）系统，家具落地时有果冻弹跳反馈。

六、成就系统表
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 面包师学徒 | 卖出第一个面包 | 50星尘币 |
| 面包大亨 | 面包店升到满级 | 专属面包店皮肤 |
| 装修达人 | 房间摆放50件家具 | 专属家具套装 |
| 小镇名人 | 声望达到满级 | 专属称号「镇长」 |
| 夜猫子 | 深夜进入小镇100次 | 专属夜光装饰 |

七、场景生成Prompt
`A cozy 3D isometric town in space, "Vega Town", featuring a warm glowing bakery shop with fresh breads in the window, and a modern pet apartment building with a visible decorated room through a large window. A central town square with a wooden quest board and a cobblestone path. Dynamic day-night cycle lighting, twilight atmosphere with glowing street lamps and fireflies. Tiny cute animal NPCs walking around. Highly detailed architectural miniature, tilt-shift photography, Pixar animation style, warm orange and deep indigo color palette, Unreal Engine 5 render, ray-traced shadows. --ar 16:9 --v 6.0`

---

## 【彗星跑道】
一、场景核心定位
宠物赛跑竞技中心，融合属性养成、道具策略与排位赛的动感竞速生态。

二、核心功能模块详解
1. **宠物赛跑比赛（核心玩法）**：每日定时举办（新手/进阶/大师组）8只宠物竞速，基于属性（速度/耐力等）计算胜负。
2. **道具赛模式**：跑道随机刷新道具箱（加速火箭/减速星云/护盾等），增加随机性和策略性。
3. **宠物训练系统**：跑道旁设训练区，每日3次消耗体力提升宠物基础属性（速度/耐力/爆发/技巧）。
4. **排行榜与赛季**：全服总胜场/速度排行榜，每月更新赛季段位（青铜至王者），结算丰厚奖励。

三、场景内UI布局
- 左上角：当前段位徽章、排位积分、宠物四维属性雷达图
- 右上角：距离下一场比赛倒计时、排行榜入口
- 底部：道具栏（道具赛中）、训练项目选择卡片
- 弹窗：比赛结算画面（颁奖台）、赛季规则说明

四、数值与进度系统
- 等级体系：排位段位系统（青铜→王者），宠物运动等级
- 货币与奖励：星尘币、冠军奖杯、排位积分
- 每日限制：每日训练限3次，体力限制参赛次数

五、3D交互细节
- 比赛过程全3D演算，起步时有喷射尾焰特效，超越时有动态镜头残影（Motion Blur）；
- 吃到加速道具时，宠物模型带有超音速马赫环光效；
- 训练时宠物举哑铃或跑步机带有大汗淋漓的粒子和疲劳动作切换。

六、成就系统表
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 初出茅庐 | 参加第一场比赛 | 50星尘币 |
| 飞毛腿 | 单局最快速度纪录 | 速度属性+5 |
| 连胜王者 | 连胜10场 | 专属称号「疾风」 |
| 道具大师 | 使用100次道具 | 专属道具皮肤 |
| 赛季王者 | 赛季结束王者段位 | 专属奖杯装饰 |

七、场景生成Prompt
`A dynamic 3D isometric sci-fi racing track in space, "Comet Track", featuring a glowing neon track with speed boost pads and floating item boxes. A high-tech starting line with holographic countdown numbers. Surrounding floating asteroids and deep space nebula background. A dedicated training corner with miniature treadmills and weights for pets. Energetic and vibrant cyber-pop color palette, cyan and orange neon lights, motion blur effect, tilt-shift lens, highly detailed, Unreal Engine 5 style. --ar 16:9 --v 6.0`

---

## 【银河图书馆】
一、场景核心定位
记录宠物成长的时光档案馆，主打回忆、日记收集与时光回溯的情感陪伴。

二、核心功能模块详解
1. **宠物成长日记（核心功能）**：自动收录AI耳语、第一次事件、互动数据、心情曲线及抓拍截图，可自定义标签与翻页浏览。
2. **时光回溯功能**：在图书馆顶层选择历史日期，场景滤镜变为老照片色调，重现那天宠物的状态与事件。
3. **记忆碎片收集**：书架每日藏有3片记忆碎片（初见/陪伴/冒险/成长），集齐解锁专属回忆动画。
4. **星尘书信系统**：玩家写信化作星尘寄出，次日收到宠物视角的AI回信，特殊纪念日触发主动来信。

三、场景内UI布局
- 左上角：日记总天数、已收集记忆碎片进度
- 右上角：日历控件（用于时光回溯）
- 底部：写信快捷键、记忆碎片图鉴
- 弹窗：精美的日记翻页UI、信纸阅读界面、时光回溯加载倒计时

四、数值与进度系统
- 等级体系：陪伴天数（无上限）
- 货币与奖励：收集碎片获取回忆动画，回溯获取遗漏的纪念品
- 每日限制：每日碎片寻找限3片，每日回信1封

五、3D交互细节
- 打开日记本时，纸张有真实的物理翻页弯曲动画，飞出微小的金色星屑；
- 启动时光回溯时，巨大的齿轮与星晷在空中旋转，屏幕出现时空扭曲的漩涡转场特效；
- 寻找记忆碎片时，点击错误的书本会掉出灰尘粒子，正确的书会散发耀眼紫光。

六、成就系统表
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 开卷有益 | 翻开第一页日记 | 50星尘币 |
| 时光旅人 | 回溯100次 | 专属时光沙漏装饰 |
| 记忆收藏家 | 收集全部记忆碎片 | 专属回忆动画 |
| 笔友 | 收发50封信 | 专属信纸皮肤 |
| 图书馆馆长 | 日记写满365天 | 专属称号「守夜人」 |

七、场景生成Prompt
`A majestic 3D isometric view of a magical cosmic library, "Galaxy Library", featuring towering spiral bookshelves filled with glowing books. In the center, a large vintage wooden desk with an open glowing diary book and a quill. Floating memory fragments shining like stars. A time-rewind observatory contraption at the top tier. Mysterious and calm atmosphere, deep purple and gold color palette, volumetric light rays shining through stained glass, floating dust motes, Unreal Engine 5, highly detailed, tilt-shift lens. --ar 16:9 --v 6.0`

---

## 【双子座沙滩】
一、场景核心定位
轻松休闲的度假海滩，融合收集图鉴、双人（镜像）互动与沙滩小游戏的游乐场。

二、核心功能模块详解
1. **贝壳收集图鉴（核心玩法）**：沙滩每日刷新20个贝壳（7大类35种），收录图鉴或兑换星尘币，集齐解锁专属装饰。
2. **双生宠物互动**：海洋中生成性格相反的镜像双胞胎宠物，可进行双人堆沙堡、泼水、合影等互动，每日解锁双子谜题。
3. **沙滩小游戏合集**：包含沙堡大赛、沙滩排球、冲浪、潜水寻宝、接飞盘等，赢取沙滩币。
4. **沙滩日光浴系统**：宠物躺椅挂机恢复心情，自由切换背景音乐，累计时长获得日光浴奖励。

三、场景内UI布局
- 左上角：沙滩币余额、当前贝壳收集进度（X/35）
- 右上角：BGM播放器（海浪/轻音乐）、小游戏入口列表
- 底部：图鉴按钮、双人互动指令条（堆沙/泼水/合影）
- 弹窗：图鉴详情页、小游戏排行榜、日光浴结算页面

四、数值与进度系统
- 等级体系：图鉴收集度（百分比）
- 货币与奖励：沙滩币（小游戏产出）、星尘币（重复贝壳回收）
- 每日限制：每日贝壳拾取限20个，日光浴奖励每日限1次（30分钟）

五、3D交互细节
- 海浪采用真实的流体渲染，浪花拍打沙滩会留下泡沫并冲上新的贝壳；
- 双生宠物互动时有精准的同步动画（如排球的抛物线计算与击球反馈）；
- 潜水寻宝小游戏视角切换至水下，带有屏幕水波折射滤镜和气泡上升特效。

六、成就系统表
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 拾贝人 | 捡到第一个贝壳 | 30星尘币 |
| 贝壳大师 | 图鉴收集100% | 专属金色沙滩铲 |
| 双子奇缘 | 和镜像宠物互动100次 | 专属双子头像框 |
| 游戏达人 | 所有小游戏最高分 | 专属称号「沙滩之王」 |
| 度假达人 | 累计日光浴100小时 | 专属豪华躺椅 |

七、场景生成Prompt
`A beautiful 3D isometric beach in space, "Gemini Beach", featuring symmetrical twin suns in a pastel sky, glowing purple ocean waves gently crashing onto golden sand. A relaxing sunbed area under a striped beach umbrella. Colorful exotic seashells scattered on the shore. A magical mirror-like water surface reflecting the cosmos. Cute pet characters playing beach volleyball. Vibrant summer vibe, highly detailed, tilt-shift lens, Unreal Engine 5 render, ray-traced water reflections. --ar 16:9 --v 6.0`

---

## 【仙女座喷泉】
一、场景核心定位
盛大浪漫的许愿祈福中心，作为全服大型活动主场地与盲盒抽奖核心场景。

二、核心功能模块详解
1. **星尘许愿池（核心功能）**：投入星尘币换取各种增益Buff（爱情/财富/健康/幸运），或花费高额许愿自定义愿望。
2. **喷泉抽奖系统**：奖池含普通/稀有/史诗/传说级物品（皮肤/装饰/特效），含保底机制，喷泉爆发对应品质颜色特效。
3. **大型活动中心**：承接节日活动（情人节玫瑰喷泉/圣诞节雪花喷泉），全服共享进度条解锁奖励。
4. **星座祈福系统**：环绕喷泉的12根星座石柱，每日祈福1次获得对应星座24小时专属Buff（如狮子座魅力+10%）。

三、场景内UI布局
- 左上角：当前拥有Buff状态及倒计时、全服活动进度条
- 右上角：全服传说物品中奖滚动播报
- 底部：抽奖按钮（单抽/十连）、星座石柱快捷导航
- 弹窗：奖池预览、祈福Buff详情、节日活动任务面板

四、数值与进度系统
- 等级体系：全服活动共建等级
- 货币与奖励：星尘币（抽奖消耗），抽奖积分（用于兑换保底商店物品）
- 每日限制：星座祈福每日1次，常规许愿每日3次

五、3D交互细节
- 抽到传说物品时，四层喷泉水柱冲天而起，整个屏幕被金色星芒和流星雨覆盖，震动反馈；
- 节日活动时，整个场景的材质无缝切换（如从水面变成冰面，石柱缠绕圣诞彩灯）；
- 祈福时对应的星座石柱图腾会点亮，射出一道光束连接宠物。

六、成就系统表
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 许愿新手 | 第一次许愿 | 50星尘币 |
| 心想事成 | 许愿成功100次 | 专属许愿光环 |
| 欧皇附体 | 抽到传说奖 | 全服公告+专属称号 |
| 星座大师 | 集齐12星座祈福 | 12星座宠物皮肤 |
| 活动达人 | 参加10次大型活动 | 限定活动纪念徽章 |

七、场景生成Prompt
`A grand 3D isometric majestic plaza in space, "Andromeda Fountain", featuring an epic four-tier cascading marble fountain flowing with glowing cyan stardust water. Surrounded by 12 classical pillars with eternal holographic constellation fire at the top. A giant mesmerizing spiral galaxy in the backdrop sky. Elaborate mosaic floor tiles. Festive event decorations, magnificent and luxurious atmosphere, epic volumetric lighting, tilt-shift lens, Unreal Engine 5, highly detailed. --ar 16:9 --v 6.0`

---

## 【猎户座森林】
一、场景核心定位
神秘探险玩法，融合野外寻宝、环境解谜与神奇生物图鉴收集的深度探索区。

二、核心功能模块详解
1. **森林寻宝探险（核心玩法）**：寻找隐藏的宝箱（普通/稀有/史诗/传说），利用场景环境线索定位，获取大量奖励。
2. **森林解谜系统**：每日3个机关解谜（蘑菇阵/萤火虫拼图/树洞密码/星座连线），解开可进入隐藏区域或获得极品道具。
3. **宠物野外探索**：宠物消耗体力在不同深度区域（外围/密林/洞穴/遗迹）自动探索，拾取野果/蘑菇/虫子。
4. **森林生物图鉴**：在特定时间和地点遇见神奇生物（萤火虫/精灵/神兽），拍照收录图鉴，集齐解锁专属神兽伙伴。

三、场景内UI布局
- 左上角：当前探索区域深度、宠物剩余体力
- 右上角：生物出没时间线提示、寻宝雷达指示器
- 底部：解谜工具包（放大镜/捕虫网）、生物图鉴入口
- 弹窗：解谜交互小游戏面板（如连线图）、宝箱开奖界面

四、数值与进度系统
- 等级体系：探索区域解锁（基于宠物等级：10级密林/30级遗迹）
- 货币与奖励：寻宝产出星尘币与专属探险家装饰
- 每日限制：每日宝箱寻找上限（普通5/稀有2），解谜限3次

五、3D交互细节
- 树林间有丁达尔效应的光柱和地面移动的斑驳树影，雾气（Volumetric Fog）随探索深度增加而变浓；
- 蘑菇阵解谜时，踩对蘑菇会发出清脆的音阶和孢子光效，踩错会喷出无害的黑烟；
- 发现稀有生物时，镜头会自动平滑拉近，背景虚化凸显生物细节。

六、成就系统表
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 初入森林 | 第一次进入森林 | 30星尘币 |
| 寻宝猎人 | 找到100个宝箱 | 专属寻宝罗盘 |
| 解谜大师 | 解开所有谜题 | 专属智慧光环 |
| 探险家 | 解锁所有探索区域 | 专属称号「森林行者」 |
| 生物学家 | 图鉴收集100% | 专属神兽宠物伙伴 |

七、场景生成Prompt
`A mysterious 3D isometric glowing forest in space, "Orion Forest", featuring giant bioluminescent trees with cyan and purple glowing canopies. Thick magical fog rolling on the mossy ground. Hidden treasure chests glowing inside hollow tree trunks. Glowing mushrooms and ethereal fireflies lighting up a hidden path. A majestic mythical deer spirit in the distance. Enigmatic and adventurous atmosphere, volumetric fog and light rays, tilt-shift lens, highly detailed, Unreal Engine 5. --ar 16:9 --v 6.0`

---
*注：上述设计在游戏开发中可通过增量更新逐步落地，各个系统底层数据均通过统一的全局状态管理器共享。*

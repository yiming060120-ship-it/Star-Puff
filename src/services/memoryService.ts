/**
 * 宠物记忆系统（长期记忆，按宠物 id 隔离）
 * 从对话中提取主人关键信息（名字/生日/喜好/情绪事件），供后续对话自然引用。
 */

export interface Memory {
  id: string;
  content: string;
  type: "fact" | "emotion" | "event" | "preference";
  timestamp: number;
  importance: number; // 1-5，5 最重要
}

const MAX_MEMORIES = 30;

class MemoryServiceClass {
  private cache: Record<string, Memory[]> = {};

  private key(petId: string) {
    return `pet_conversation_memories_${petId}`;
  }

  private load(petId: string): Memory[] {
    if (this.cache[petId]) return this.cache[petId];
    try {
      const saved = localStorage.getItem(this.key(petId));
      const parsed = saved ? JSON.parse(saved) : [];
      this.cache[petId] = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.cache[petId] = [];
    }
    return this.cache[petId];
  }

  private save(petId: string) {
    try {
      localStorage.setItem(this.key(petId), JSON.stringify(this.cache[petId] || []));
    } catch {
      /* 忽略存储失败 */
    }
  }

  /** 添加记忆（自动去重，按重要性保留最多 MAX_MEMORIES 条） */
  addMemory(petId: string, content: string, type: Memory["type"] = "fact", importance = 3) {
    const memories = this.load(petId);
    const exists = memories.some(
      (m) => m.content === content || (content.length > 5 && m.content.includes(content))
    );
    if (exists) return;

    memories.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content,
      type,
      timestamp: Date.now(),
      importance,
    });
    memories.sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp);
    this.cache[petId] = memories.slice(0, MAX_MEMORIES);
    this.save(petId);
  }

  /** 获取用于 Prompt 的记忆文本（取最重要的 10 条） */
  getMemoriesForPrompt(petId: string): string[] {
    return this.load(petId)
      .slice(0, 10)
      .map((m) => m.content);
  }

  /** 从用户消息中提取记忆（规则提取：名字/生日/喜好/情绪事件） */
  extractMemoriesFromMessage(userMessage: string): string[] {
    const newMemories: string[] = [];

    const nameMatch = userMessage.match(/我叫(.+?)(?:[,，。.！!？?]|$)/);
    if (nameMatch) newMemories.push(`主人的名字是${nameMatch[1]}`);

    const birthdayMatch = userMessage.match(/(?:我生日是|我过生日是|我的生日是)(.+?)(?:[,，。.！!？?]|$)/);
    if (birthdayMatch) newMemories.push(`主人的生日是${birthdayMatch[1]}`);

    const likeMatch = userMessage.match(/我(?:喜欢|超爱|最爱)(.+?)(?:[,，。.！!？?]|$)/);
    if (likeMatch) newMemories.push(`主人喜欢${likeMatch[1]}`);

    if (/今天(?:好|超|特别)(?:开心|高兴|难过|伤心|累|烦)/.test(userMessage)) {
      newMemories.push(`主人今天说：${userMessage.slice(0, 30)}`);
    }

    return newMemories;
  }

  getAll(petId: string): Memory[] {
    return [...this.load(petId)];
  }
}

export const MemoryService = new MemoryServiceClass();

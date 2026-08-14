/**
 * 宠物物种模型配置
 *
 * 12 个高精 .glb 模型已拷贝到 public/models/species/species_01.glb ~ species_12.glb
 *
 * ⚠️ 重要：由于源文件命名无意义（textured_mesh (N).glb），
 * 当前无法确定每个模型对应哪种动物。请按以下步骤补全映射：
 *   1. 运行游戏，在"宠物种类选择"界面逐个预览模型
 *   2. 根据看到的动物，修改下方 SPECIES_MODELS 数组里每个条目的 species 字段
 *
 * species 可选值（与 PetType 对齐）：猫 / 狗 / 兔 / 仓鼠 / 其他
 */

export interface SpeciesModel {
  /** 模型文件名（相对 public/models/species/） */
  file: string;
  /** 显示名称 */
  label: string;
  /** 动物种类（待确认后填写） */
  species: "猫" | "狗" | "兔" | "仓鼠" | "其他";
  /** 已确认映射？（false 表示还需要人工确认） */
  confirmed: boolean;
}

export const SPECIES_MODELS: SpeciesModel[] = [
  { file: "species_01.glb", label: "模型 01", species: "其他", confirmed: false },
  { file: "species_02.glb", label: "模型 02", species: "其他", confirmed: false },
  { file: "species_03.glb", label: "模型 03", species: "其他", confirmed: false },
  { file: "species_04.glb", label: "模型 04", species: "其他", confirmed: false },
  { file: "species_05.glb", label: "模型 05", species: "其他", confirmed: false },
  { file: "species_06.glb", label: "模型 06", species: "其他", confirmed: false },
  { file: "species_07.glb", label: "模型 07", species: "其他", confirmed: false },
  { file: "species_08.glb", label: "模型 08", species: "其他", confirmed: false },
  { file: "species_09.glb", label: "模型 09", species: "其他", confirmed: false },
  { file: "species_10.glb", label: "模型 10", species: "其他", confirmed: false },
  { file: "species_11.glb", label: "模型 11", species: "其他", confirmed: false },
  { file: "species_12.glb", label: "模型 12", species: "其他", confirmed: false },
];

/** 获取模型完整路径 */
export function getSpeciesModelPath(file: string): string {
  return `/models/species/${file}`;
}

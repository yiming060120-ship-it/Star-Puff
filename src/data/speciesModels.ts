/**
 * 宠物物种模型配置
 *
 * 12 个高精 .glb 模型已拷贝到 public/models/species/species_01.glb ~ species_12.glb
 * 缩略图位于 public/models/species/thumbnails/species_XX_thumb.png
 *
 * 名称与种类基于实际 3D 渲染外观标注（从预览页截取后视觉判断）。
 * 后续如需精确品种（如英短/布偶/缅因等），可由用户进一步标注。
 */

export type SpeciesKind = "猫" | "狗" | "兔" | "鸟" | "仓鼠" | "其他";

export interface SpeciesModel {
  /** 模型文件名（相对 public/models/species/） */
  file: string;
  /** 缩略图路径（相对 public/） */
  thumbnail: string;
  /** 显示名称（基于实际外观标注） */
  label: string;
  /** 动物种类 */
  species: SpeciesKind;
  /** 已确认映射 */
  confirmed: boolean;
}

export const SPECIES_MODELS: SpeciesModel[] = [
  { file: "species_01.glb", thumbnail: "/models/species/thumbnails/species_01_thumb.png", label: "纯白猫",       species: "猫", confirmed: true },
  { file: "species_02.glb", thumbnail: "/models/species/thumbnails/species_02_thumb.png", label: "橘虎斑猫",     species: "猫", confirmed: true },
  { file: "species_03.glb", thumbnail: "/models/species/thumbnails/species_03_thumb.png", label: "三花猫",       species: "猫", confirmed: true },
  { file: "species_04.glb", thumbnail: "/models/species/thumbnails/species_04_thumb.png", label: "橘猫（深色）", species: "猫", confirmed: true },
  { file: "species_05.glb", thumbnail: "/models/species/thumbnails/species_05_thumb.png", label: "橘虎斑坐姿猫", species: "猫", confirmed: true },
  { file: "species_06.glb", thumbnail: "/models/species/thumbnails/species_06_thumb.png", label: "蓝白猫",       species: "猫", confirmed: true },
  { file: "species_07.glb", thumbnail: "/models/species/thumbnails/species_07_thumb.png", label: "灰白花猫",     species: "猫", confirmed: true },
  { file: "species_08.glb", thumbnail: "/models/species/thumbnails/species_08_thumb.png", label: "边牧犬",       species: "狗", confirmed: true },
  { file: "species_09.glb", thumbnail: "/models/species/thumbnails/species_09_thumb.png", label: "三花长毛猫",   species: "猫", confirmed: true },
  { file: "species_10.glb", thumbnail: "/models/species/thumbnails/species_10_thumb.png", label: "橘白猫",       species: "猫", confirmed: true },
  { file: "species_11.glb", thumbnail: "/models/species/thumbnails/species_11_thumb.png", label: "银灰长毛猫",   species: "猫", confirmed: true },
  { file: "species_12.glb", thumbnail: "/models/species/thumbnails/species_12_thumb.png", label: "银虎斑猫",     species: "猫", confirmed: true },
];

/** 获取模型完整路径 */
export function getSpeciesModelPath(file: string): string {
  return `/models/species/${file}`;
}

/** 获取缩略图完整路径 */
export function getSpeciesThumbnailPath(thumb: string): string {
  return `/${thumb}`;
}

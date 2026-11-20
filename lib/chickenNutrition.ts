import type { FoodNutrition } from './foodNutrition';

// USDA SR28 NDB 05062: edible, boneless, skinless breast, weighed raw.
// Keep this separate from the cooked chicken reference used by meal plans.
export const rawChickenBreast: FoodNutrition = {
 id: 'garden-chicken-raw', name: '去皮鸡胸肉（生重）', unit: 'g',
 source: '通用估算', energyKcal: 120, protein: 22.5, carbs: 0, fat: 2.62,
 sourceUrl: 'https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg05.pdf',
 labelEvidence: 'USDA SR28 NDB 05062：去骨去皮鸡胸肉生重，每100g 120千卡、蛋白质22.5g、碳水0g、脂肪2.62g。通用参考，非所购商品标签；烹调油酱另计。',
 importedAt: '', serving: { grams: 100, description: '1掌心份量 · 生重' },
 marketDepartmentOverride: '肉类',
};

// Maps a report_templates section key to how it should be rendered.
// type: "metric_table" | "narrative" | "product_list"
// metrics (optional): restrict a metric_table/narrative to these metric keys; omitted = all evaluated metrics.
// category (product_list only): products table `category` to list.
export const SECTION_DEFS = {
  biology_narrative: {
    title: "Soil Biology",
    type: "narrative",
    metrics: ["WEOC", "WEON", "Organic_Matter", "Soil_Health_Score"],
  },
  crop_fertilizer_table: {
    title: "Fertility Recommendations",
    type: "metric_table",
  },
  lime_recommendation: {
    title: "Lime Recommendation",
    type: "metric_table",
    metrics: ["Soil_pH", "Ca_Sat"],
  },
  cool_season_mix: {
    title: "Cool Season Mix Recommendations",
    type: "product_list",
    category: "cool_season_seed",
  },
  warm_season_mix: {
    title: "Warm Season Mix Recommendations",
    type: "product_list",
    category: "warm_season_seed",
  },
  seasonal_nutrient_table: {
    title: "Nutrient Levels",
    type: "metric_table",
  },
};

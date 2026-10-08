import cashFlowCategoryRepository from "./cashFlowCategory.repository.js";

const getCashFlowCategories = async (req, res) => {
  const cashFlowCategories =
    await cashFlowCategoryRepository.getCashFlowCategories();

  return cashFlowCategories;
};

export default { getCashFlowCategories };

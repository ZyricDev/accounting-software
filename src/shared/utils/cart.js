const buildCartSummary = (items, priceKey, itemTransformer = null) => {
  let subtotal = 0;
  let totalQuantity = 0;

  const mappedItems = items.map((item) => {
    const lineTotal = (item[priceKey] || 0) * item.quantity;
    subtotal += lineTotal;
    totalQuantity += item.quantity;

    const processedItem = itemTransformer ? itemTransformer(item) : item;

    return { ...processedItem, lineTotal };
  });

  return {
    items: mappedItems,
    totalQuantity,
    subtotal,
  };
};

const toApiCart = (cart, priceKey, itemTransformer = null) => {
  const summary = buildCartSummary(cart.items, priceKey, itemTransformer);
  const discountAmount = cart.discountAmount ?? 0;

  return {
    id: cart.id,
    ...summary,
    discountAmount,
    finalTotal: summary.subtotal - discountAmount,
  };
};

export { buildCartSummary, toApiCart };

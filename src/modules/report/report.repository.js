import { pool } from "../../database/connection.js";

const getTodaySalesStats = async () => {
  const query = `
    SELECT 
      COUNT(si.id) AS total_invoices,
      COALESCE(SUM(si.total_amount), 0) AS final_payable_amount,
      COALESCE(SUM(si.credit_amount), 0) AS total_credit,
      COALESCE(SUM(si.discount_amount), 0) AS total_discount,
      -- مقادیر دقیق محاسبه شده از روی ریز اقلام فاکتور:
      COALESCE(SUM(item_stats.gross_sales_items), 0) AS gross_sales_items,
      COALESCE(SUM(item_stats.total_cogs), 0) AS total_cogs
    FROM sales_invoices si
    LEFT JOIN (
      SELECT 
        invoice_id, 
        SUM(sale_price * quantity) AS gross_sales_items,
        SUM(purchase_price * quantity) AS total_cogs
      FROM sales_invoices_items
      GROUP BY invoice_id
    ) item_stats ON item_stats.invoice_id = si.id
    WHERE si.status = 'ACTIVE' 
      AND DATE(si.created_at) = CURDATE()
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

const getTodayReturnsStats = async () => {
  const query = `
  SELECT 
    COUNT(ri.id) AS return_count,
    COALESCE(SUM(ri.total_quantity), 0) AS total_returned_items,
    COALESCE(SUM(ri.total_amount), 0) AS total_returned_amount,
    COALESCE(SUM(item_stats.total_return_cogs), 0) AS total_return_cogs
  FROM return_invoices ri
  LEFT JOIN (
    SELECT 
      rii.return_invoice_id,
      SUM(sii.purchase_price * rii.quantity) AS total_return_cogs
    FROM return_invoices r
    JOIN return_invoice_items rii ON rii.return_invoice_id = r.id
    JOIN sales_invoices_items sii 
      ON sii.invoice_id = r.reference_invoice_id
     AND sii.product_id = rii.product_id
    WHERE r.status = 'ACTIVE'
      AND r.return_type = 'SALE_RETURN'
      AND r.created_at >= CURDATE()
      AND r.created_at < CURDATE() + INTERVAL 1 DAY
    GROUP BY rii.return_invoice_id
  ) item_stats ON item_stats.return_invoice_id = ri.id
  WHERE ri.status = 'ACTIVE'
    AND ri.return_type = 'SALE_RETURN'
    AND ri.created_at >= CURDATE()
    AND ri.created_at < CURDATE() + INTERVAL 1 DAY
`;

  const [rows] = await pool.query(query);

  return rows[0];
};

export default {
  getTodaySalesStats,
  getTodayReturnsStats,
};

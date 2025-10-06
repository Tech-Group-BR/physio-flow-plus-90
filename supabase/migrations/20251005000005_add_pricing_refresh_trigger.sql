-- Migration: Add trigger to automatically refresh subscription_pricing
-- This ensures pricing is always in sync with products and subscription_discounts

-- Function to refresh subscription_pricing based on products and discounts
CREATE OR REPLACE FUNCTION refresh_subscription_pricing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all existing pricing records
  DELETE FROM subscription_pricing;
  
  -- Generate new pricing records for all active products and discounts
  INSERT INTO subscription_pricing (
    product_id,
    product_name,
    base_price,
    period,
    display_name,
    description,
    months,
    discount_percent,
    monthly_price,
    total_price,
    savings
  )
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.price AS base_price,
    sd.period,
    sd.display_name,
    sd.description,
    sd.months,
    sd.discount_percent,
    -- Calculate monthly price with discount
    ROUND(p.price * (1 - sd.discount_percent / 100), 2) AS monthly_price,
    -- Calculate total price for the period
    ROUND(p.price * (1 - sd.discount_percent / 100) * sd.months::numeric, 2) AS total_price,
    -- Calculate savings compared to paying monthly
    ROUND(p.price * sd.months::numeric - (p.price * (1 - sd.discount_percent / 100) * sd.months::numeric), 2) AS savings
  FROM 
    products p
  CROSS JOIN 
    subscription_discounts sd
  WHERE 
    p.is_active = true 
    AND sd.is_active = true
  ORDER BY 
    p.name, 
    sd.months::integer;
END;
$$;

-- Trigger function to call refresh when products change
CREATE OR REPLACE FUNCTION trigger_refresh_pricing_from_products()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh pricing after any change to products
  PERFORM refresh_subscription_pricing();
  RETURN NEW;
END;
$$;

-- Trigger function to call refresh when discounts change
CREATE OR REPLACE FUNCTION trigger_refresh_pricing_from_discounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh pricing after any change to subscription_discounts
  PERFORM refresh_subscription_pricing();
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS refresh_pricing_on_product_change ON products;
DROP TRIGGER IF EXISTS refresh_pricing_on_discount_change ON subscription_discounts;

-- Create trigger on products table
CREATE TRIGGER refresh_pricing_on_product_change
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_pricing_from_products();

-- Create trigger on subscription_discounts table
CREATE TRIGGER refresh_pricing_on_discount_change
AFTER INSERT OR UPDATE OR DELETE ON subscription_discounts
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_pricing_from_discounts();

-- Initial refresh to populate pricing table
SELECT refresh_subscription_pricing();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_subscription_pricing() TO authenticated;

COMMENT ON FUNCTION refresh_subscription_pricing() IS 'Recalculates all subscription pricing based on current products and discounts';
COMMENT ON TRIGGER refresh_pricing_on_product_change ON products IS 'Automatically updates subscription_pricing when products change';
COMMENT ON TRIGGER refresh_pricing_on_discount_change ON subscription_discounts IS 'Automatically updates subscription_pricing when subscription_discounts change';

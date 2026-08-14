-- =========================================================
-- Sadhna Ayurveda - Supabase PostgreSQL Database Schema
-- =========================================================
-- Run this script in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    items_list TEXT NOT NULL,
    final_amount NUMERIC(10, 2) DEFAULT 0,
    pay_method TEXT DEFAULT 'cod',
    status TEXT DEFAULT 'Pending Approval',
    stock_available BOOLEAN DEFAULT TRUE,
    awb_number TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by order status and phone
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read and insert permissions (for backend API or standard anon access)
CREATE POLICY "Allow public read orders" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update orders" ON public.orders
    FOR UPDATE USING (true);

-- Insert initial sample orders if table is empty
INSERT INTO public.orders (id, payment_id, name, phone, email, address, items_list, final_amount, pay_method, status, stock_available, awb_number, created_at)
VALUES
    ('ORD-1001', 'pay_P892104921', 'Vikrant Sharma', '9876543210', 'vikrant@sadhnaayurveda.com', 'Madhuwala, Dehradun, Uttarakhand - 248007', 'Sadhna Madhu Shant x 1', 3500.00, 'razorpay', 'Pending Approval', true, 'SR849201948', NOW()),
    ('ORD-1002', 'COD-7729103', 'Anjali Verma', '9718179397', 'anjali@gmail.com', 'Sector 62, Noida, UP - 201301', 'Sadhna Liver Detox Juice x 2', 7000.00, 'cod', 'Approved', true, 'SR992018234', NOW())
ON CONFLICT (id) DO NOTHING;

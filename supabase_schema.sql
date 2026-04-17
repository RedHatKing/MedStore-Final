CREATE TABLE public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    manufacturing_name TEXT, 
    invoice_date DATE DEFAULT CURRENT_DATE,
    batch_no TEXT,
    expiry_date DATE,
    purchase_rate NUMERIC,
    image_base64 TEXT, 
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Parties" ON public.parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_products_name ON public.products(product_name);
CREATE INDEX idx_products_party ON public.products(party_id);